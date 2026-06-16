import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { checkRateLimit, tooManyResponse } from '../_shared/rate-limit.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

// Map plan slugs → Stripe Price IDs
const PRICE_IDS: Record<string, string> = {
  basic:        Deno.env.get('STRIPE_PRICE_BASIC')!,
  professional: Deno.env.get('STRIPE_PRICE_PROFESSIONAL')!,
  full:         Deno.env.get('STRIPE_PRICE_FULL')!,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limit by client IP: 10 requests / minute
  const rl = await checkRateLimit(req, { name: 'create-checkout-session', max: 10, windowSec: 60 });
  if (!rl.ok) {
    return tooManyResponse(rl.retryAfter, corsHeaders);
  }

  // Verify the caller's JWT — use their identity, never trust the request body
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { plan } = await req.json();

    if (!plan || !PRICE_IDS[plan]) {
      return new Response(JSON.stringify({ error: `Invalid plan: "${plan}"` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      // Use verified identity from JWT — never from request body
      customer_email: user.email,
      metadata: { plan, userId: user.id },
      success_url: `${Deno.env.get('SITE_URL')}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('SITE_URL')}/pricing`,
      payment_method_types: ['card'],
      locale: 'auto',
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('create-checkout-session error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
