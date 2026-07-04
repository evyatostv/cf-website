import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

// Map plan slugs → Stripe Price IDs
const PRICE_IDS: Record<string, string> = {
  basic:        Deno.env.get('STRIPE_PRICE_BASIC')!,
  professional: Deno.env.get('STRIPE_PRICE_PROFESSIONAL')!,
  full:         Deno.env.get('STRIPE_PRICE_FULL')!,
};

// BE-012: use an explicit origin allowlist instead of a wildcard `*` fallback.
// A `*` here defeats CORS as a defence and (with credentials) is invalid — mirror
// the allowlist used by the other payment functions.
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://cf-website-flame.vercel.app',
  'https://clinic-flow.co.il',
  'https://www.clinic-flow.co.il',
  Deno.env.get('SITE_URL'),
].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    // BE-004: never leak internal error text to the client — log with a
    // correlation id, return a generic Hebrew message.
    const correlationId = crypto.randomUUID();
    console.error(`create-checkout-session error [${correlationId}]:`, err);
    return new Response(JSON.stringify({
      error: 'אירעה שגיאה ביצירת התשלום. נסה/י שוב או פנה/י לתמיכה עם מזהה השגיאה.',
      correlationId,
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
