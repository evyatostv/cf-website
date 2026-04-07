import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service role to bypass RLS
);

async function grantAccess(plan: string, userId: string | null, email: string | null, sourceId: string) {
  if (!plan || (!userId && !email)) {
    console.error('Missing plan or user info:', { plan, userId, email });
    return false;
  }

  const { error } = await supabase.from('user_access').upsert({
    user_id: userId || null,
    email: email,
    plan,
    is_active: true,
    expires_at: null, // lifetime license
    notes: `Stripe: ${sourceId}`,
    granted_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to update user_access:', error);
    return false;
  }

  console.log(`Access granted: user=${userId} email=${email} plan=${plan}`);
  return true;
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle Checkout Session (legacy hosted checkout flow)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan;
    const userId = session.metadata?.userId || null;
    const email = session.customer_email;

    await grantAccess(plan!, userId, email, session.id);
  }

  // Handle PaymentIntent (embedded Payment Element flow)
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const plan = pi.metadata?.plan;
    const userId = pi.metadata?.userId || null;
    const email = pi.receipt_email;

    const ok = await grantAccess(plan!, userId, email, pi.id);
    if (!ok) {
      return new Response('DB error', { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
