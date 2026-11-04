import { createClient } from 'npm:@supabase/supabase-js@2';

const CATALOG: Record<string, { name: string; amount: number }> = {
  forever: { name: 'ClinicFlow — רישיון לצמיתות', amount: 149900 },
};
const json = (body: unknown, status = 200, headers: Record<string,string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok');
  const auth = req.headers.get('Authorization');
  if (!auth || !Deno.env.get('MAKE_PAYMENT_WEBHOOK_URL')) return json({ error: 'Payment service unavailable' }, 503);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const userDb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userDb.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);
  try {
    const { plan } = await req.json();
    const item = CATALOG[plan];
    if (!item) return json({ error: 'Invalid package' }, 400);
    const { data: profile } = await db.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
    const fullName = profile?.full_name ?? user.user_metadata?.full_name ?? '';
    const phone = profile?.phone ?? user.user_metadata?.phone ?? '';
    if (fullName.trim().split(/\s+/).filter(Boolean).length < 2 || !/^05\d{8}$/.test(phone.replace(/[\s-]/g, ''))) return json({ error: 'יש להשלים שם מלא ומספר נייד ישראלי לפני התשלום' }, 400);
    const { data: order, error } = await db.from('orders').insert({ customer_id: user.id, package_id: plan, amount: item.amount, currency: 'ILS', status: 'PENDING' }).select('id, package_id, amount, currency').single();
    if (error || !order) throw error || new Error('order creation failed');
    const base = Deno.env.get('SUPABASE_URL')! + '/functions/v1/grow-webhook';
    const siteUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || Deno.env.get('SITE_URL') || 'https://clinic-flow.co.il';
    const response = await fetch(Deno.env.get('MAKE_PAYMENT_WEBHOOK_URL')!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, packageId: order.package_id, packageName: item.name, amount: order.amount, currency: order.currency, customer: { email: user.email, fullName, phone: phone.replace(/[\s-]/g, '') }, notifyUrl: base, successUrl: `${siteUrl}/checkout/success?order=${order.id}`, cancelUrl: `${siteUrl}/checkout/cancel?order=${order.id}` }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload.paymentUrl !== 'string') {
      await db.from('orders').update({ status: 'FAILED' }).eq('id', order.id);
      return json({ error: 'לא ניתן ליצור קישור תשלום כרגע', orderId: order.id }, 502);
    }
    return json({ orderId: order.id, paymentUrl: payload.paymentUrl });
  } catch (err) { console.error('create-grow-payment', err); return json({ error: 'Payment initialization failed' }, 500); }
});

