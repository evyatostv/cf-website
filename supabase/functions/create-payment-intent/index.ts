import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

// Amounts in agorot (ILS cents)
const PLAN_AMOUNTS: Record<string, number> = {
  basic:        89900,   // ₪899
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
    const { plan } = await req.json();

    if (!plan || !PLAN_AMOUNTS[plan]) {
      return new Response(
        JSON.stringify({ error: `Invalid plan: "${plan}"` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let finalAmount = PLAN_AMOUNTS[plan];
    let discountAmount = 0;

    // Always check for existing paid plan and auto-apply credit
    const { data: purchase } = await supabase
      .from('purchases')
      .select('amount')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (purchase?.amount) {
      discountAmount = purchase.amount;
    } else {
      // Fallback: derive from user_access current plan
      const { data: access } = await supabase
        .from('user_access')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle();

      if (access?.plan && PLAN_AMOUNTS[access.plan]) {
        discountAmount = PLAN_AMOUNTS[access.plan];
      }
    }

    // BE-003: reject same-tier / downgrade repurchases. If the credit they've
    // already paid is >= the target plan's price, the target is NOT strictly
    // higher than what they own — there is nothing to charge and re-issuing an
    // intent would (a) re-grant access for ₪0 and (b) let a client "buy" a plan
    // they already have. Reject with 400 instead of minting a zero-amount intent.
    if (discountAmount >= PLAN_AMOUNTS[plan]) {
      return new Response(
        JSON.stringify({
          error: 'כבר יש ברשותך חבילה זו או חבילה גבוהה יותר — אין אפשרות לשדרג לחבילה זו.',
          code: 'NOT_AN_UPGRADE',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    finalAmount = PLAN_AMOUNTS[plan] - discountAmount;

    // Defensive: after applying credit the amount must be a positive charge.
    // (discountAmount < price is guaranteed above, so this is a belt-and-braces
    // guard against any future change to the credit logic.)
    if (finalAmount <= 0) {
      return new Response(
        JSON.stringify({
          error: 'לא ניתן ליצור תשלום על סכום אפס. פנה/י לתמיכה אם הבעיה נמשכת.',
          code: 'INVALID_AMOUNT',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: 'ils',
      metadata: {
        plan,
        userId: user.id,
        planName: PLAN_NAMES[plan],
        isUpgrade: discountAmount > 0 ? 'true' : 'false',
        discountAmount: String(discountAmount),
      },
      receipt_email: user.email || undefined,
      description: discountAmount > 0
        ? `שדרוג ל-${PLAN_NAMES[plan]} (זיכוי תשלום קודם)`
        : PLAN_NAMES[plan],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      automatic_payment_methods: { enabled: true },
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
    // BE-004: never leak internal error text (Stripe/DB internals, English) to the
    // client. Log the full error server-side with a correlation id, return a
    // generic Hebrew message + the id the user can quote to support.
    const correlationId = crypto.randomUUID();
    console.error(`create-payment-intent error [${correlationId}]:`, err);
    return new Response(
      JSON.stringify({
        error: 'אירעה שגיאה ביצירת התשלום. נסה/י שוב או פנה/י לתמיכה עם מזהה השגיאה.',
        correlationId,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
