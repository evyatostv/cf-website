import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

// Map plan slugs → Stripe Price IDs (set these after creating products in Stripe dashboard)
const PRICE_IDS: Record<string, string> = {
  basic:        Deno.env.get('STRIPE_PRICE_BASIC')!,
  professional: Deno.env.get('STRIPE_PRICE_PROFESSIONAL')!,
  full:         Deno.env.get('STRIPE_PRICE_FULL')!,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plan, userId, email } = await req.json();

    console.log('Request:', { plan, userId, email });
    console.log('Price IDs:', PRICE_IDS);
    console.log('Stripe key set:', !!Deno.env.get('STRIPE_SECRET_KEY'));
    console.log('Site URL:', Deno.env.get('SITE_URL'));

    if (!plan || !PRICE_IDS[plan]) {
      console.error('Invalid plan or missing price ID:', plan, PRICE_IDS);
      return new Response(JSON.stringify({ error: `Invalid plan: "${plan}". Available: ${Object.keys(PRICE_IDS).join(', ')}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      customer_email: email,
      metadata: { plan, userId },
      success_url: `${Deno.env.get('SITE_URL')}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('SITE_URL')}/pricing`,
      payment_method_types: ['card'],
      locale: 'he',
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
