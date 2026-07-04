import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getOrCreateLicenseKey } from '../_shared/license.ts';
import { sendOnce } from '../_shared/email-once.ts';
import { sendTemplate } from '../_shared/send-template.ts';
import {
  formatAgorot,
  planLabel,
  vatBreakdown,
} from '../_shared/receipt.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service role to bypass RLS
);

const SITE_URL = 'https://clinic-flow.co.il';
const DOWNLOAD_URL = `${SITE_URL}/download`;
const ORDERS_URL = `${SITE_URL}/account/orders`;
const RETRY_URL = `${SITE_URL}/checkout/retry`;

/**
 * BE-020: resolve a recipient email from a userId via a service-role lookup on
 * user_access when the payment object carries no receipt/client email. Returns
 * null if nothing can be found (never throws — email is best-effort).
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

/** Best guess at a display name when Stripe carries none. */
function nameFromEmail(email: string | null | undefined): string {
  if (!email) return 'לקוח יקר';
  const local = email.split('@')[0] || '';
  return local || 'לקוח יקר';
}

/**
 * Read the user's CURRENT plan before grantAccess overwrites it. Used to detect
 * upgrades and to decide whether a license key already exists.
 */
async function readPriorAccess(
  userId: string | null,
  email: string | null,
): Promise<{ plan: string | null; hasLicense: boolean } | null> {
  try {
    let query = supabase.from('user_access').select('plan, license_key');
    query = userId
      ? query.eq('user_id', userId)
      : query.eq('email', email || '');
    const { data } = await query.maybeSingle();
    if (!data) return null;
    return { plan: data.plan ?? null, hasLicense: !!data.license_key };
  } catch (err) {
    console.error('readPriorAccess failed (non-fatal):', err);
    return null;
  }
}

async function grantAccess(
  plan: string,
  userId: string | null,
  email: string | null,
  sourceId: string,
  amount: number = 0,
) {
  if (!plan || (!userId && !email)) {
    console.error('Missing plan or user info:', { plan, userId, email });
    return false;
  }

  const now = new Date().toISOString();

  // Try update first (existing user upgrading). BE-001: branch the existence
  // check by the identity column that is actually present — NEVER filter the
  // uuid `user_id` column with '' (that matches nothing and forces a duplicate
  // INSERT on every email-only webhook retry). When there is no userId we match
  // the row by email instead.
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
      .update({ plan, is_active: true, expires_at: null, notes: `Stripe: ${sourceId}`, granted_at: now })
      .eq('id', existing.id);
    accessError = error;
  } else {
    const { error } = await supabase
      .from('user_access')
      .insert({ user_id: userId || null, email, plan, is_active: true, expires_at: null, notes: `Stripe: ${sourceId}`, granted_at: now });
    accessError = error;
  }

  if (accessError) {
    console.error('Failed to update user_access:', accessError);
    return false;
  }

  // Record purchase — store full plan price (not discounted amount) for future upgrade credit
  const PLAN_AMOUNTS: Record<string, number> = {
    basic: 89900,
    professional: 99900,
    full: 129900,
  };
  const fullPlanAmount = PLAN_AMOUNTS[plan] || amount;

  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id: userId || null,
    email: email,
    plan,
    version: plan,
    amount: fullPlanAmount,
    payment_id: sourceId,
    discount_eligible: false,
    purchased_at: now,
  });

  if (purchaseError) {
    console.error('Failed to record purchase (non-fatal):', purchaseError);
  }

  console.log(`Access granted: user=${userId} email=${email} plan=${plan} amount=${amount}`);
  return true;
}

/**
 * Best-effort purchase emails, sent AFTER grantAccess succeeds. NOTHING in here
 * may throw or change the webhook's HTTP response — a mail failure must never
 * cause Stripe to retry or re-grant. Every send is idempotent (sendOnce) so a
 * webhook retry never double-sends.
 */
async function sendPurchaseEmails(opts: {
  plan: string;
  userId: string | null;
  email: string | null;
  orderId: string;
  amount: number; // agorot, VAT-inclusive charged total
  isUpgrade: boolean;
  fromPlan: string | null;
  hadLicense: boolean;
  discountAmount: number; // agorot credit applied on upgrade
}): Promise<void> {
  const {
    plan, userId, email, orderId, amount,
    isUpgrade, fromPlan, hadLicense, discountAmount,
  } = opts;

  if (!email) {
    console.log('No recipient email on payment — skipping purchase emails.');
    return;
  }

  try {
    const name = nameFromEmail(email);
    const label = planLabel(plan);
    const receipt = vatBreakdown(amount);

    if (isUpgrade) {
      // UPGRADE → upgrade-confirmation (only price DIFFERENCE was charged).
      await sendOnce(supabase, {
        paymentId: orderId,
        template: 'upgrade-confirmation',
        to: email,
        props: {
          name,
          fromPlan: fromPlan ? planLabel(fromPlan) : 'ClinicFlow',
          toPlan: label,
          credit: discountAmount ? formatAgorot(-Math.abs(discountAmount)) : '₪0',
          difference: formatAgorot(amount),
          whatsNewUrl: `${SITE_URL}/whats-new`,
        },
      });

      // Only issue a license on upgrade if the user has none yet.
      if (!hadLicense) {
        const licenseKey = await getOrCreateLicenseKey(
          supabase,
          { userId, email },
          plan,
        );
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

    const licenseKey = await getOrCreateLicenseKey(
      supabase,
      { userId, email },
      plan,
    );
    await sendOnce(supabase, {
      paymentId: orderId,
      template: 'license-delivery',
      to: email,
      props: { name, plan: label, licenseKey, downloadUrl: DOWNLOAD_URL },
    });
  } catch (err) {
    // Absolute backstop — email is best-effort, never fails the webhook.
    console.error('sendPurchaseEmails failed (non-fatal):', err);
  }
}

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
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Webhook signature verification failed:', msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  // Handle PaymentIntent (embedded Payment Element flow — primary)
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const plan = pi.metadata?.plan;
    const userId = pi.metadata?.userId || null;
    const email = pi.receipt_email;
    const amount = pi.amount; // in agorot
    const isUpgrade = pi.metadata?.isUpgrade === 'true';
    const discountAmount = Number(pi.metadata?.discountAmount || 0); // agorot

    // Snapshot prior plan/license BEFORE grantAccess overwrites the row.
    const prior = await readPriorAccess(userId, email);

    const ok = await grantAccess(plan!, userId, email, pi.id, amount);
    if (!ok) {
      return new Response('DB error', { status: 500 });
    }

    // Best-effort emails — must not affect the 200-OK flow.
    await sendPurchaseEmails({
      plan: plan!,
      userId,
      email,
      orderId: pi.id,
      amount,
      isUpgrade: isUpgrade || (!!prior?.plan && prior.plan !== plan),
      fromPlan: prior?.plan ?? null,
      hadLicense: prior?.hasLicense ?? false,
      discountAmount,
    });
  }

  // Handle Checkout Session (legacy flow)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan;
    const userId = session.metadata?.userId || null;
    const email = session.customer_email;
    const amount = session.amount_total || 0;
    const isUpgrade = session.metadata?.isUpgrade === 'true';
    const discountAmount = Number(session.metadata?.discountAmount || 0);

    const prior = await readPriorAccess(userId, email);

    await grantAccess(plan!, userId, email, session.id, amount);

    await sendPurchaseEmails({
      plan: plan!,
      userId,
      email,
      orderId: session.id,
      amount,
      isUpgrade: isUpgrade || (!!prior?.plan && prior.plan !== plan),
      fromPlan: prior?.plan ?? null,
      hadLicense: prior?.hasLicense ?? false,
      discountAmount,
    });
  }

  // Handle payment failure — notify the customer with a retry link.
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const plan = pi.metadata?.plan || '';
    const amount = pi.amount; // agorot
    // BE-020: fall back to a userId→email lookup when receipt_email is absent, so
    // a failed payment still notifies the customer with a retry link.
    const email = await resolveEmail(pi.metadata?.userId || null, pi.receipt_email ?? null);
    if (email) {
      try {
        await sendTemplate(
          'payment-failed',
          email,
          {
            name: nameFromEmail(email),
            plan: planLabel(plan),
            amount: formatAgorot(amount),
            retryUrl: RETRY_URL,
          },
          { idempotencyKey: `${pi.id}:payment-failed` },
        );
      } catch (err) {
        console.error('payment-failed email failed (non-fatal):', err);
      }
    }
  }

  // Handle refund — send the refund confirmation.
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const email = charge.receipt_email || charge.billing_details?.email || null;
    const plan = charge.metadata?.plan || '';
    // Prefer the actually-refunded amount when present.
    const refundedAgorot = charge.amount_refunded || charge.amount || 0;
    if (email) {
      try {
        await sendTemplate(
          'refund-confirmation',
          email,
          {
            name: nameFromEmail(email),
            plan: planLabel(plan),
            refundId: charge.id,
            amount: formatAgorot(refundedAgorot),
          },
          { idempotencyKey: `${charge.id}:refund-confirmation` },
        );
      } catch (err) {
        console.error('refund-confirmation email failed (non-fatal):', err);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
