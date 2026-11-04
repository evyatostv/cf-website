import { createClient } from 'npm:@supabase/supabase-js@2';
import { getOrCreateLicenseKey } from '../_shared/license.ts';

const CATALOG: Record<string, number> = { forever: 149900 };
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const secret = Deno.env.get('MAKE_CALLBACK_SECRET');
  const supplied = req.headers.get('x-make-callback-secret') || new URL(req.url).searchParams.get('secret');
  if (!secret || !supplied || supplied.length !== secret.length || [...supplied].reduce((n, c, i) => n | c.charCodeAt(0) ^ secret.charCodeAt(i), 0) !== 0) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await req.json();
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    const transactionId = typeof body.transactionId === 'string' ? body.transactionId : '';
    const status = String(body.status || '').toLowerCase();
    const amount = Number(body.amount);
    const currency = String(body.currency || '').toUpperCase();
    if (!orderId || !transactionId || !Number.isFinite(amount) || !currency) return json({ error: 'Invalid callback' }, 400);
    const { data: order } = await db.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return json({ error: 'Order not found' }, 404);
    if (order.status === 'PAID') return json({ ok: true, duplicate: true });
    const expected = CATALOG[order.package_id];
    const successful = ['success', 'paid', 'approved', 'completed'].includes(status);
    if (amount !== order.amount || currency !== order.currency || amount !== expected) {
      await db.from('orders').update({ status: 'MANUAL_REVIEW', external_transaction_id: transactionId, provider_payload: body }).eq('id', orderId);
      return json({ ok: true, manualReview: true });
    }
    if (!successful) { await db.from('orders').update({ status: status.includes('cancel') ? 'CANCELLED' : 'FAILED', external_transaction_id: transactionId, provider_payload: body }).eq('id', orderId); return json({ ok: true }); }
    const { data: claimed } = await db.from('orders').update({ status: 'PAID', external_transaction_id: transactionId, provider_payload: body, paid_at: new Date().toISOString() }).eq('id', orderId).eq('status', 'PENDING').select('*').maybeSingle();
    if (!claimed) return json({ ok: true, duplicate: true });
    const { data: authUser } = await db.auth.admin.getUserById(order.customer_id);
    const email = authUser.user?.email ?? null;
    const key = await getOrCreateLicenseKey(db, { userId: order.customer_id, email }, order.package_id);
    await db.from('user_access').upsert({ user_id: order.customer_id, email, plan: order.package_id, is_active: true, expires_at: null, granted_at: new Date().toISOString(), license_key: key }, { onConflict: 'user_id' });
    await db.from('purchases').upsert({ user_id: order.customer_id, email, version: order.package_id, plan: order.package_id, amount: order.amount, payment_id: transactionId, discount_eligible: false }, { onConflict: 'payment_id', ignoreDuplicates: true });
    return json({ ok: true, licenseActivated: true });
  } catch (err) { console.error('grow-webhook', err); return json({ error: 'Webhook processing failed' }, 500); }
});

