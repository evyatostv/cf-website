import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLPAY_KEY = Deno.env.get('ALLPAY_KEY')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service role to bypass RLS
);

const PLAN_AMOUNTS: Record<string, number> = {
  basic: 89900,
  professional: 99900,
  full: 129900,
};

/**
 * AllPay signature verification — same algorithm as request signing.
 * Applied exactly on the data received from AllPay, without type transformations.
 */
async function computeSign(params: Record<string, unknown>, apiKey: string): Promise<string> {
  function extractSortedValues(obj: unknown): string[] {
    if (Array.isArray(obj)) {
      const values: string[] = [];
      for (const item of obj) {
        values.push(...extractSortedValues(item));
      }
      return values;
    }
    if (obj !== null && typeof obj === 'object') {
      const values: string[] = [];
      const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
      for (const key of sortedKeys) {
        const val = (obj as Record<string, unknown>)[key];
        if (val === '' || val === null || val === undefined) continue;
        values.push(...extractSortedValues(val));
      }
      return values;
    }
    return [String(obj)];
  }

  const filtered: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(params)) {
    if (key === 'sign') continue;
    if (val === '' || val === null || val === undefined) continue;
    filtered[key] = val;
  }

  const values = extractSortedValues(filtered);
  values.push(apiKey);
  const signString = values.join(':');

  const encoder = new TextEncoder();
  const encoded = encoder.encode(signString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function grantAccess(
  plan: string,
  userId: string | null,
  email: string | null,
  paymentId: string,
  amount: number,
) {
  if (!plan || (!userId && !email)) {
    console.error('Missing plan or user info:', { plan, userId, email });
    return false;
  }

  const now = new Date().toISOString();

  // Upsert user_access
  const { data: existing } = await supabase
    .from('user_access')
    .select('id')
    .eq('user_id', userId || '')
    .maybeSingle();

  let accessError;
  if (existing) {
    const { error } = await supabase
      .from('user_access')
      .update({
        plan,
        is_active: true,
        expires_at: null,
        notes: `AllPay: ${paymentId}`,
        granted_at: now,
      })
      .eq('user_id', userId || '');
    accessError = error;
  } else {
    const { error } = await supabase
      .from('user_access')
      .insert({
        user_id: userId || null,
        email,
        plan,
        is_active: true,
        expires_at: null,
        notes: `AllPay: ${paymentId}`,
        granted_at: now,
      });
    accessError = error;
  }

  if (accessError) {
    console.error('Failed to update user_access:', accessError);
    return false;
  }

  // Record purchase — store full plan price for future upgrade credit
  const fullPlanAmount = PLAN_AMOUNTS[plan] || amount;

  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id: userId || null,
    email,
    plan,
    version: plan,
    amount: fullPlanAmount,
    payment_id: paymentId,
    discount_eligible: false,
    purchased_at: now,
  });

  if (purchaseError) {
    console.error('Failed to record purchase (non-fatal):', purchaseError);
  }

  console.log(`Access granted: user=${userId} email=${email} plan=${plan}`);
  return true;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();

    // Verify signature — use the data exactly as received
    const expectedSign = await computeSign(body, ALLPAY_KEY);
    if (body.sign !== expectedSign) {
      console.error('Webhook signature mismatch', {
        received: body.sign,
        expected: expectedSign,
      });
      return new Response('Invalid signature', { status: 403 });
    }

    // Only process successful payments
    if (body.status !== 1 && body.status !== '1') {
      console.log('Payment not successful, status:', body.status);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = body.add_field_1 || null;
    const plan = body.add_field_2 || null;
    const email = body.client_email || null;
    const orderId = body.order_id || '';
    const amount = typeof body.amount === 'number' ? body.amount * 100 : 0; // AllPay sends in ILS, convert to agorot

    const ok = await grantAccess(plan, userId, email, orderId, amount);
    if (!ok) {
      return new Response('DB error', { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('allpay-webhook error:', err.message);
    return new Response('Internal error', { status: 500 });
  }
});
