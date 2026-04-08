import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

// Amounts in agorot (ILS cents)
const PLAN_AMOUNTS: Record<string, number> = {
  basic:        75900,   // ₪759
  professional: 99900,   // ₪999
  full:         129900,  // ₪1,299
};

const PLAN_NAMES: Record<string, string> = {
  basic:        'חבילה בסיסית',
  professional: 'חבילה מקצועית',
  full:         'חבילת ניהול מלאה',
};

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
    const { plan, isUpgrade } = await req.json();

    if (!plan || !PLAN_AMOUNTS[plan]) {
      return new Response(
        JSON.stringify({ error: `Invalid plan: "${plan}"` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let finalAmount = PLAN_AMOUNTS[plan];
    let discountAmount = 0;

    if (isUpgrade) {
      // Fetch the user's most recent purchase to calculate the discount
      const { data: purchases } = await supabase
        .from('purchases')
        .select('amount')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (purchases?.amount) {
        discountAmount = purchases.amount;
        finalAmount = Math.max(finalAmount - discountAmount, 0);
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: 'ils',
      metadata: {
        plan,
        userId: user.id,
        planName: PLAN_NAMES[plan],
        isUpgrade: isUpgrade ? 'true' : 'false',
        discountAmount: String(discountAmount),
      },
      receipt_email: user.email || undefined,
      description: isUpgrade
        ? `שדרוג ל-${PLAN_NAMES[plan]} (זיכוי תשלום קודם)`
        : PLAN_NAMES[plan],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        finalAmount,
        discountAmount,
      }),
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
