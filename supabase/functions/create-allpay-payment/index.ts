import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLPAY_LOGIN = Deno.env.get('ALLPAY_LOGIN')!;
const ALLPAY_KEY = Deno.env.get('ALLPAY_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') || 'https://clinic-flow.co.il';

const PLAN_PRICES: Record<string, number> = {
  basic: 899,
  professional: 999,
  full: 1299,
};

const PLAN_NAMES: Record<string, string> = {
  basic: 'חבילה בסיסית',
  professional: 'חבילה מקצועית',
  full: 'חבילת ניהול מלאה',
};

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
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

/**
 * AllPay signature algorithm (from official docs):
 * 1. Remove `sign` parameter
 * 2. Exclude parameters with empty values
 * 3. Sort all keys alphabetically at ALL levels (top-level, items array, keys within each item)
 * 4. Extract values only, join with colon ":"
 * 5. Append API key at end (preceded by colon)
 * 6. SHA256 hash the result
 */
/**
 * AllPay signature — follows the official Node.js example exactly:
 * 1. Remove `sign`, skip empty values
 * 2. Sort keys alphabetically
 * 3. For each value: if string and non-empty → push to chunks; if array → iterate items, sort item keys, push string values
 * 4. Join chunks with ":", append API key, SHA256
 */
async function computeSign(params: Record<string, unknown>, apiKey: string): Promise<string> {
  const chunks: string[] = [];

  const sortedKeys = Object.keys(params).filter(k => k !== 'sign').sort();

  for (const key of sortedKeys) {
    const value = params[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          const sortedItemKeys = Object.keys(item).sort();
          for (const name of sortedItemKeys) {
            const val = (item as Record<string, unknown>)[name];
            if (typeof val === 'string' && val.trim() !== '') {
              chunks.push(val);
            }
          }
        }
      }
    } else if (typeof value === 'string' && value.trim() !== '') {
      chunks.push(value);
    }
  }

  chunks.push(apiKey);
  const signString = chunks.join(':');

  const encoder = new TextEncoder();
  const encoded = encoder.encode(signString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { plan, isUpgrade } = await req.json();

    if (!plan || !PLAN_PRICES[plan]) {
      return new Response(
        JSON.stringify({ error: `Invalid plan: "${plan}"` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let price = PLAN_PRICES[plan];
    let discountAmount = 0;

    // Check for existing purchase — apply upgrade credit
    const { data: purchase } = await supabase
      .from('purchases')
      .select('amount')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (purchase?.amount) {
      // Convert agorot to ILS for comparison
      const previousPaidILS = Math.round(purchase.amount / 100);
      if (previousPaidILS < price) {
        discountAmount = previousPaidILS;
        price = price - discountAmount;
      }
    }

    const orderId = `cf_${user.id.slice(0, 8)}_${plan}_${Date.now()}`;

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/allpay-webhook`;

    const paymentParams: Record<string, unknown> = {
      login: ALLPAY_LOGIN,
      order_id: orderId,
      currency: 'ILS',
      lang: 'HE',
      webhook_url: webhookUrl,
      success_url: `${SITE_URL}/#/thank-you?plan=${plan}`,
      backlink_url: `${SITE_URL}/#/pricing`,
      client_name: user.user_metadata?.full_name || user.email || 'Customer',
      client_email: user.email || 'no-email@clinic-flow.co.il',
      show_bit: 'true',
      show_applepay: 'true',
      inst: '3',
      inst_fixed: '0',
      add_field_1: user.id,
      add_field_2: plan,
      items: [
        {
          name: PLAN_NAMES[plan],
          price: String(price),
          qty: '1',
          vat: '1',
        },
      ],
    };

    paymentParams.sign = await computeSign(paymentParams, ALLPAY_KEY);

    const allpayRes = await fetch(
      'https://allpay.to/app/?show=getpayment&mode=api11',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentParams),
      },
    );

    const allpayData = await allpayRes.json();

    if (!allpayRes.ok || !allpayData.payment_url) {
      console.error('AllPay error:', allpayData);
      return new Response(
        JSON.stringify({ error: allpayData.error || 'שגיאה ביצירת תשלום' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        payment_url: allpayData.payment_url,
        finalAmount: price * 100,
        discountAmount: discountAmount * 100,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-allpay-payment error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
