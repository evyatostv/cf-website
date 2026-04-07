import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

// Amounts in agorot (ILS cents)
const PLAN_AMOUNTS: Record<string, number> = {
  basic:        345000,  // ₪3,450
  professional: 459000,  // ₪4,590
  full:         589000,  // ₪5,890
};

const PLAN_NAMES: Record<string, string> = {
  basic:        'חבילה בסיסית',
  professional: 'חבילה מקצועית',
  full:         'חבילת ניהול מלאה',
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

    if (!plan || !PLAN_AMOUNTS[plan]) {
      return new Response(
        JSON.stringify({ error: `Invalid plan: "${plan}"` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: PLAN_AMOUNTS[plan],
      currency: 'ils',
      // Use verified identity from JWT — never from request body
      metadata: { plan, userId: user.id, planName: PLAN_NAMES[plan] },
      receipt_email: user.email || undefined,
      description: PLAN_NAMES[plan],
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-payment-intent error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
