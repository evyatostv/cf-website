import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateLicenseKey } from '../_shared/license.ts';
import { recordAuditEvent } from '../_shared/audit.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const secret = Deno.env.get('MAKE_CALLBACK_SECRET');
  const supplied = req.headers.get('x-make-callback-secret');
  if (!secret || !supplied || supplied.length !== secret.length || supplied.split('').reduce((difference, char, index) => (
    difference | (char.charCodeAt(0) ^ secret.charCodeAt(index))
  ), 0) !== 0) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => null);
  const orderId = body?.orderId;
  const transactionId = typeof body?.transactionId === 'string' ? body.transactionId.trim() : '';
  const providerStatus = typeof body?.status === 'string' ? body.status.trim().toLowerCase() : '';
  const amount = typeof body?.amount === 'string' && /^\d+$/.test(body.amount) ? Number(body.amount) : body?.amount;
  const currency = typeof body?.currency === 'string' ? body.currency.trim().toUpperCase() : '';
  if (
    typeof orderId !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(orderId) ||
    !transactionId || !providerStatus || !Number.isInteger(amount) || amount < 0 || amount > 2_147_483_647 || !currency
  ) return json({ error: 'Invalid callback' }, 400);

  let status: 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
  if (['success', 'paid', 'approved', 'completed'].includes(providerStatus)) status = 'PAID';
  else if (['cancelled', 'canceled'].includes(providerStatus)) status = 'CANCELLED';
  else if (['failed', 'declined', 'rejected'].includes(providerStatus)) status = 'FAILED';
  else if (providerStatus === 'refunded') status = 'REFUNDED';
  else if (['pending', 'processing'].includes(providerStatus)) return json({ ok: true, pending: true });
  else return json({ error: 'Unsupported callback status' }, 400);

  const { data, error } = status === 'REFUNDED'
    ? await db.rpc('record_grow_refund', { p_order_id: orderId, p_transaction_id: transactionId, p_amount: amount, p_currency: currency })
    : await db.rpc('fulfill_grow_order', {
    p_order_id: orderId,
    p_transaction_id: transactionId,
    p_status: status,
    p_amount: amount,
    p_currency: currency,
    p_payload: { orderId, transactionId, status: providerStatus, amount, currency },
    p_license_key: generateLicenseKey('forever'),
  });
  if (error) {
    console.error('grow-webhook fulfillment failed', error.code);
    await recordAuditEvent(db, { eventType: 'payment_callback', outcome: 'failure', orderId, provider: 'grow', amount, currency, correlationId: transactionId, metadata: { reason: 'fulfillment_error' } });
    return json({ error: 'Webhook processing failed' }, 500);
  }
  if (data === 'NOT_FOUND') return json({ error: 'Order not found' }, 404);
  if (data === 'CONFLICT') return json({ error: 'Order requires review' }, 409);
  if (data === 'DUPLICATE') return json({ ok: true, duplicate: true });
  if (data === 'MANUAL_REVIEW') {
    await recordAuditEvent(db, { eventType: 'payment_callback', outcome: 'blocked', orderId, provider: 'grow', amount, currency, correlationId: transactionId, metadata: { reason: 'manual_review' } });
    return json({ ok: true, manualReview: true });
  }
  await recordAuditEvent(db, { eventType: 'payment_callback', outcome: data === 'PAID' || data === 'REFUNDED' ? 'success' : 'failure', orderId, provider: 'grow', amount, currency, correlationId: transactionId, metadata: { status } });
  return json({ ok: true, licenseActivated: data === 'PAID' });
});
