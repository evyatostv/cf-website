import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service role to bypass RLS
);

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan;
    const userId = session.metadata?.userId;
    const email = session.customer_email;

    if (!plan || (!userId && !email)) {
      console.error('Missing plan or user info in session metadata');
      return new Response('Missing metadata', { status: 400 });
    }

    // Upsert user_access row
    const { error } = await supabase.from('user_access').upsert({
      user_id: userId || null,
      email: email,
      plan,
      is_active: true,
      expires_at: null, // lifetime license
      notes: `Stripe session: ${session.id}`,
      granted_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      console.error('Failed to update user_access:', error);
      return new Response('DB error', { status: 500 });
    }

    console.log(`Access granted: user=${userId} email=${email} plan=${plan}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
