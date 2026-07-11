import { createClient } from 'npm:@supabase/supabase-js@2';
import { getOrCreateLicenseKey } from '../_shared/license.ts';
import { sendOnce } from '../_shared/email-once.ts';
import { sendTemplate } from '../_shared/send-template.ts';
import {
  formatAgorot,
  planLabel,
  vatBreakdown,
} from '../_shared/receipt.ts';

const ALLPAY_KEY = Deno.env.get('ALLPAY_KEY')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service role to bypass RLS
);

const SITE_URL = 'https://clinic-flow.co.il';
const DOWNLOAD_URL = `${SITE_URL}/download`;
const ORDERS_URL = `${SITE_URL}/account/orders`;
const RETRY_URL = `${SITE_URL}/checkout/retry`;

const PLAN_AMOUNTS: Record<string, number> = {
  basic: 89900,
  professional: 99900,
  full: 129900,
};

/**
 * BE-020: resolve a recipient email from a userId via a service-role lookup on
 * user_access when the webhook body carries no client_email. Best-effort; never
 * throws.
 */
async function resolveEmail(
  userId: string | null,
  fallback: string | null,
): Promise<string | null> {
  if (fallback) return fallback;
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from('user_access')
      .select('email')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.email ?? null;
  } catch (err) {
    console.error('resolveEmail failed (non-fatal):', err);
    return null;
  }
}

/** Best guess at a display name when AllPay carries none. */
function nameFromEmail(email: string | null | undefined): string {
  if (!email) return 'לקוח יקר';
  const local = email.split('@')[0] || '';
  return local || 'לקוח יקר';
}

/**
 * Read the user's CURRENT plan/license BEFORE grantAccess overwrites the row —
 * lets us detect upgrades and whether a license key already exists.
 */
async function readPriorAccess(
  userId: string | null,
  email: string | null,
): Promise<{ plan: string | null; hasLicense: boolean } | null> {
  try {
    let query = supabase.from('user_access').select('plan, license_key');
    query = userId ? query.eq('user_id', userId) : query.eq('email', email || '');
    const { data } = await query.maybeSingle();
    if (!data) return null;
    return { plan: data.plan ?? null, hasLicense: !!data.license_key };
  } catch (err) {
    console.error('readPriorAccess failed (non-fatal):', err);
    return null;
  }
}

/**
 * Best-effort purchase emails, sent AFTER grantAccess succeeds. Nothing here may
 * throw or change the webhook's HTTP response. Idempotent via sendOnce so a
 * webhook retry never double-sends.
 */
async function sendPurchaseEmails(opts: {
  plan: string;
  userId: string | null;
  email: string | null;
  orderId: string;
  amount: number; // agorot, VAT-inclusive
  isUpgrade: boolean;
  fromPlan: string | null;
  hadLicense: boolean;
}): Promise<void> {
  const { plan, userId, email, orderId, amount, isUpgrade, fromPlan, hadLicense } = opts;

  if (!email) {
    console.log('No recipient email on AllPay payment — skipping purchase emails.');
    return;
  }

  try {
    const name = nameFromEmail(email);
    const label = planLabel(plan);
    const receipt = vatBreakdown(amount);

    if (isUpgrade) {
      // AllPay carries no explicit discount/credit field on the webhook, so the
      // charged `amount` IS the difference paid; credit is unknown → ₪0.
      await sendOnce(supabase, {
        paymentId: orderId,
        template: 'upgrade-confirmation',
        to: email,
        props: {
          name,
          fromPlan: fromPlan ? planLabel(fromPlan) : 'ClinicFlow',
          toPlan: label,
          credit: '₪0',
          difference: formatAgorot(amount),
          whatsNewUrl: `${SITE_URL}/whats-new`,
        },
      });

      if (!hadLicense) {
        const licenseKey = await getOrCreateLicenseKey(supabase, { userId, email }, plan);
        await sendOnce(supabase, {
          paymentId: orderId,
          template: 'license-delivery',
          to: email,
          props: { name, plan: label, licenseKey, downloadUrl: DOWNLOAD_URL },
        });
      }
      return;
    }

    // NEW PURCHASE → order-confirmation THEN license-delivery.
    await sendOnce(supabase, {
      paymentId: orderId,
      template: 'order-confirmation',
      to: email,
      props: {
        name,
        plan: label,
        orderId,
        amount: receipt.amount,
        vat: receipt.vat,
        total: receipt.total,
        ordersUrl: ORDERS_URL,
      },
    });

    const licenseKey = await getOrCreateLicenseKey(supabase, { userId, email }, plan);
    await sendOnce(supabase, {
      paymentId: orderId,
      template: 'license-delivery',
      to: email,
      props: { name, plan: label, licenseKey, downloadUrl: DOWNLOAD_URL },
    });
  } catch (err) {
    console.error('sendPurchaseEmails failed (non-fatal):', err);
  }
}

/**
 * AllPay signature verification — same algorithm as request signing.
 * Applied exactly on the data received from AllPay, without type transformations.
 */
/**
 * AllPay signature verification — follows official Node.js algorithm.
 * Webhook peculiarities: `items` arrives as a JSON string (not array), and
 * numbers/strings are mixed. We parse items into an array when applicable.
 */
async function computeSign(params: Record<string, unknown>, apiKey: string): Promise<string> {
  const chunks: string[] = [];

  const sortedKeys = Object.keys(params).filter(k => k !== 'sign').sort();

  for (const key of sortedKeys) {
    let value = params[key];

    // Try parsing strings that look like JSON arrays back into actual arrays
    if (typeof value === 'string' && value.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) value = parsed;
      } catch {
        // keep as string if not valid JSON
      }
    }

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

  // Upsert user_access. BE-001: branch the existence check by the identity column
  // that is actually present — NEVER filter the uuid `user_id` column with ''
  // (that matches nothing and forces a duplicate INSERT on every email-only
  // webhook retry). When there is no userId we match the row by email instead.
  // NOTE (dev): a UNIQUE constraint on user_access — UNIQUE(user_id) plus a
  // partial UNIQUE(email) WHERE user_id IS NULL — is still required as a
  // migration to make this race-proof at the DB level. This code-side guard
  // converges the common case but cannot fully prevent a concurrent double-insert.
  const findExisting = supabase.from('user_access').select('id');
  const { data: existing } = await (userId
    ? findExisting.eq('user_id', userId)
    : findExisting.eq('email', email || '')
  ).maybeSingle();

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
      .eq('id', existing.id);
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
    console.log('Webhook received:', JSON.stringify(body));

    // Verify payment authenticity by calling AllPay's paymentstatus API
    // with our own signature (which we know works — we sign requests the same way).
    const ALLPAY_LOGIN = Deno.env.get('ALLPAY_LOGIN')!;
    const statusParams: Record<string, unknown> = {
      login: ALLPAY_LOGIN,
      order_id: body.order_id,
    };
    statusParams.sign = await computeSign(statusParams, ALLPAY_KEY);

    const statusRes = await fetch(
      'https://allpay.to/app/?show=paymentstatus&mode=api11',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusParams),
      },
    );
    const statusData = await statusRes.json();
    console.log('Payment status verification:', JSON.stringify(statusData));

    if (!statusRes.ok || statusData.status !== 1) {
      console.error('Payment not verified as successful:', statusData);
      return new Response('Payment not confirmed', { status: 403 });
    }
    console.log('Payment verified OK via status API');

    // Only process successful payments
    if (body.status !== 1 && body.status !== '1') {
      console.log('Payment not successful, status:', body.status);

      // AllPay api11 status codes: 1 = success (paid), 2 = failed/declined,
      // 0/other = created/pending/intermediate. Only a DEFINITIVE decline (2)
      // should trigger a payment-failed email — pending/intermediate states must
      // NOT, to avoid nagging a customer whose payment may still complete.
      // (Best-effort; never affects the 200-OK response.)
      const statusCode = Number(body.status);
      // BE-020: fall back to a userId→email lookup when client_email is absent.
      const email = await resolveEmail(body.add_field_1 || null, body.client_email || null);
      if (statusCode === 2 && email) {
        try {
          const plan = body.add_field_2 || '';
          const amount = typeof body.amount === 'number' ? body.amount * 100 : 0;
          await sendTemplate(
            'payment-failed',
            email,
            {
              name: nameFromEmail(email),
              plan: planLabel(plan),
              amount: formatAgorot(amount),
              retryUrl: RETRY_URL,
            },
            { idempotencyKey: `${body.order_id || ''}:payment-failed` },
          );
        } catch (err) {
          console.error('payment-failed email failed (non-fatal):', err);
        }
      }
      // NOTE: any status we can't classify as a real decline is left alone — no
      // email — per the conservative "if ambiguous, do not send" rule.
      // TODO: AllPay refund flow not available — AllPay sends no refund webhook,
      // so refund-confirmation cannot be wired here (unlike Stripe charge.refunded).

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // SECURITY (BE-008 fix): the paymentstatus call above proved THIS order_id is
    // a real, successfully-paid order. But we must NOT trust the plan/user carried
    // in the webhook body — an attacker could replay a legitimate order_id with an
    // altered add_field_2 (plan) or add_field_1 (userId) to have grantAccess()
    // award any plan to any user. Instead we derive the plan from the verified
    // order_id itself (we mint it as `cf_<uid8>_<plan>_<ts>` in create-allpay-
    // payment) and bind the grant to the original buyer via the embedded uid
    // prefix. This closes the hole without depending on AllPay's inbound-signature
    // stringification (which, verified naively, would reject real webhooks).
    const orderId = body.order_id || '';
    const orderMatch = /^cf_([0-9a-f]+)_(basic|professional|full)_\d+$/.exec(orderId);
    if (!orderMatch) {
      console.error('Refusing to grant — unrecognized order_id format:', orderId);
      return new Response('Bad order reference', { status: 400 });
    }
    const trustedUidPrefix = orderMatch[1];
    const plan = orderMatch[2]; // trusted: from the verified, paid order_id

    const userId = body.add_field_1 || null;
    const email = body.client_email || null;

    // The account we grant to must match the buyer encoded in the paid order_id.
    // A legit payment always passes (userId === add_field_1 whose first 8 chars
    // ARE this prefix); a replay that swaps in another userId is rejected.
    if (userId && !userId.startsWith(trustedUidPrefix)) {
      console.error('Refusing to grant — userId does not match paid order:', { orderId, userId });
      return new Response('User mismatch', { status: 403 });
    }

    // Amount is used ONLY for the receipt email; the stored purchase amount is the
    // canonical plan price (PLAN_AMOUNTS, see grantAccess), so a tampered body
    // amount can't inflate/deflate what we record — at worst it skews one receipt.
    const amount = typeof body.amount === 'number' ? body.amount * 100 : 0; // ILS → agorot

    // Snapshot prior plan/license BEFORE grantAccess overwrites the row.
    const prior = await readPriorAccess(userId, email);

    const ok = await grantAccess(plan, userId, email, orderId, amount);
    if (!ok) {
      return new Response('DB error', { status: 500 });
    }

    // Best-effort purchase emails — must not affect the 200-OK flow.
    await sendPurchaseEmails({
      plan,
      userId,
      email,
      orderId,
      amount,
      isUpgrade: !!prior?.plan && prior.plan !== plan,
      fromPlan: prior?.plan ?? null,
      hadLicense: prior?.hasLicense ?? false,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('allpay-webhook error:', msg);
    return new Response('Internal error', { status: 500 });
  }
});
