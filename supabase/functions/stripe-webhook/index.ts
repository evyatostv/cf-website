import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service role to bypass RLS
);

async function grantAccess(
  plan: string,
  userId: string | null,
  email: string | null,
  sourceId: string,
  amount: number = 0,
) {
  if (!plan || (!userId && !email)) {
    console.error('Missing plan or user info:', { plan, userId, email });
    return false;
  }

  const now = new Date().toISOString();

  // Update user_access
  const { error: accessError } = await supabase.from('user_access').upsert({
    user_id: userId || null,
    email: email,
    plan,
    is_active: true,
    expires_at: null,
    notes: `Stripe: ${sourceId}`,
    granted_at: now,
  }, { onConflict: 'user_id' });

  if (accessError) {
    console.error('Failed to update user_access:', accessError);
    return false;
  }

  // Record purchase (for upgrade credit logic)
  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id: userId || null,
    email: email,
    plan,
    version: plan,
    amount,
    payment_id: sourceId,
    discount_eligible: false,
    purchased_at: now,
  });

  if (purchaseError) {
    console.error('Failed to record purchase (non-fatal):', purchaseError);
  }

  console.log(`Access granted: user=${userId} email=${email} plan=${plan} amount=${amount}`);
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

  // Handle PaymentIntent (embedded Payment Element flow — primary)
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const plan = pi.metadata?.plan;
    const userId = pi.metadata?.userId || null;
    const email = pi.receipt_email;
    const amount = pi.amount; // in agorot

    const ok = await grantAccess(plan!, userId, email, pi.id, amount);
    if (!ok) {
      return new Response('DB error', { status: 500 });
    }
  }

  // Handle Checkout Session (legacy flow)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan;
    const userId = session.metadata?.userId || null;
    const email = session.customer_email;
    const amount = session.amount_total || 0;

    await grantAccess(plan!, userId, email, session.id, amount);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
