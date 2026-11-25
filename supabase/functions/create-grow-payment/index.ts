import { createClient } from 'npm:@supabase/supabase-js@2';
import { inactivePaymentProvider } from '../_shared/payment-provider.ts';
import { recordAuditEvent } from '../_shared/audit.ts';

import { BUCKET, INSTALLER_PATHS } from '../_shared/installers.ts';

const PACKAGE = { id: 'forever', name: 'ClinicFlow — רישיון לצמיתות', amount: 149900 };
const SITE_URL = new URL(Deno.env.get('NEXT_PUBLIC_APP_URL') || Deno.env.get('SITE_URL') || 'https://www.clinic-flow.co.il');
const ALLOWED_ORIGINS = new Set([
  SITE_URL.origin,
  'https://clinic-flow.co.il',
  'https://www.clinic-flow.co.il',
  'https://cf-website-flame.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
]);

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const inactive = inactivePaymentProvider('grow', Object.fromEntries(headers));
  if (inactive) return inactive;

  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'Unauthorized' }, 401);
  const webhookUrl = Deno.env.get('MAKE_PAYMENT_WEBHOOK_URL');
  if (!webhookUrl) return json({ error: 'Payment service unavailable' }, 503);

  const notifyUrl = URL.parse(Deno.env.get('MAKE_GROW_NOTIFY_URL') || '');
  if (!notifyUrl || notifyUrl.protocol !== 'https:' || !/^hook(?:\.[a-z0-9-]+)?\.make\.com$/.test(notifyUrl.hostname)
      || notifyUrl.username || notifyUrl.password || notifyUrl.port || notifyUrl.pathname.length < 2
      || notifyUrl.href === URL.parse(webhookUrl)?.href) {
    return json({ error: 'שירות התשלום אינו זמין כרגע. אפשר לנסות שוב מאוחר יותר.', code: 'PAYMENT_NOTIFICATION_UNAVAILABLE' }, 503);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const userDb = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });

  try {
    const { data: { user }, error: authError } = await userDb.auth.getUser();
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const input = await req.json().catch(() => null);
    if (input?.plan !== PACKAGE.id) return json({ error: 'Invalid package' }, 400);

    let fullName = input.contact?.fullName;
    let rawPhone = input.contact?.phone;
    if (input.contact === undefined) {
      const { data: profile, error: profileError } = await db.from('profiles')
        .select('full_name, phone').eq('id', user.id).maybeSingle();
      if (profileError) throw profileError;
      fullName = profile?.full_name || user.user_metadata?.full_name;
      rawPhone = profile?.phone || user.user_metadata?.phone;
    }
    const phone = typeof rawPhone === 'string'
      ? rawPhone.replace(/[\s()-]/g, '').replace(/^(?:\+972|00972)/, '0')
      : '';
    if (
      typeof fullName !== 'string' || fullName.length > 150 || fullName.trim().split(/\s+/).length < 2 ||
      !/^05\d{8}$/.test(phone)
    ) {
      await recordAuditEvent(db, { eventType: 'checkout_contact_validation', outcome: 'blocked', userId: user.id, provider: 'grow', metadata: { reason: 'contact_required' } });
      return json({ error: 'יש להזין שם מלא ומספר נייד ישראלי לפני התשלום', code: 'CHECKOUT_CONTACT_REQUIRED' }, 400);
    }

    const os = input.os;
    if (typeof os !== 'string' || !Object.hasOwn(INSTALLER_PATHS, os)) {
      return json({ error: 'יש לבחור את מערכת ההפעלה של מחשב היעד לפני התשלום.' }, 400);
    }
    const { data: installer, error: installerError } = await db.storage.from(BUCKET).info(INSTALLER_PATHS[os]);
    if (installerError || !(Number(installer?.size ?? installer?.metadata?.size) > 0)) {
      await recordAuditEvent(db, { eventType: 'checkout_start', outcome: 'blocked', provider: 'grow', metadata: { reason: 'installer_unavailable', os } });
      return json({ error: 'קובץ ההתקנה למערכת שבחרת אינו זמין כרגע. אפשר לנסות שוב מאוחר יותר או לפנות לתמיכה.', code: 'INSTALLER_UNAVAILABLE' }, 503);
    }

    const targetSeat = input.targetSeat;
    if (targetSeat !== undefined && (!Number.isSafeInteger(targetSeat) || targetSeat < 2 || targetSeat > 2147483647)) {
      return json({ error: 'מספר המחשב לרכישה אינו תקין.' }, 400);
    }
    const { data: order, error } = targetSeat !== undefined
      ? await db.rpc('open_additional_grow_order', { p_customer_id: user.id, p_target_seat: targetSeat })
      : await db.rpc('open_grow_order', {
      p_customer_id: user.id, p_package_id: PACKAGE.id, p_amount: PACKAGE.amount,
    });
    if (error) throw error;
    if (order?.result === 'SEATS_CHANGED') {
      return json({ error: 'מספר הרישיונות השתנה או שהרישיון אינו פעיל. יש לחזור לאזור האישי ולבדוק את מספר המחשבים לפני רכישה נוספת.' }, 409);
    }
    if (order?.result === 'DELETION_PENDING') {
      return json({ error: 'יש בקשה פתוחה למחיקת החשבון. בטלו אותה באזור האישי לפני הרכישה.' }, 409);
    }
    if (order?.result === 'ACTIVE_LICENSE') {
      await recordAuditEvent(db, { eventType: 'checkout_start', outcome: 'blocked', userId: user.id, provider: 'grow', amount: PACKAGE.amount, currency: 'ILS', metadata: { reason: 'active_license' } });
      return json({ error: 'כבר יש לך רישיון פעיל. אפשר להמשיך לאזור האישי.', code: 'LICENSE_ALREADY_ACTIVE' }, 409);
    }
    if (order?.result === 'ALREADY_PAID') {
      return json({ error: 'כבר נרשם תשלום לחשבון. אם הרישיון עדיין לא פעיל, פנו לתמיכה.' }, 409);
    }
    if (order?.result === 'MANUAL_REVIEW') {
      return json({ error: 'תשלום קודם נמצא בבדיקה. פנו לתמיכה לפני שתנסו לשלם שוב.' }, 409);
    }
    if (order?.result === 'PENDING') {
      if (order.payment_url) return json({ orderId: order.id, paymentUrl: order.payment_url });
      return json({ error: 'יש הזמנה פתוחה. נסו שוב בעוד רגע או פנו לתמיכה אם הקישור אינו זמין.', orderId: order.id, code: 'ORDER_LINK_PENDING' }, 409);
    }
    if (order?.result !== 'NEW') throw new Error('Order creation failed');

    const successUrl = new URL('/checkout/success', SITE_URL);
    successUrl.searchParams.set('order', order.id);
    const cancelUrl = new URL('/checkout/cancel', SITE_URL);
    cancelUrl.searchParams.set('order', order.id);
    let response: Response;
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id, packageId: order.package_id, packageName: PACKAGE.name,
          amount: order.amount, price: order.amount / 100, currency: 'ILS',
          customer: { email: user.email, fullName: fullName.trim(), phone },
          customerName: fullName.trim(), customerEmail: user.email, customerPhone: phone,
          notifyUrl: notifyUrl.href,
          successUrl: successUrl.href, cancelUrl: cancelUrl.href,
        }),
        signal: AbortSignal.timeout(25_000),
      });
    } catch {
      await recordAuditEvent(db, { eventType: 'checkout_start', outcome: 'failure', userId: user.id, orderId: order.id, provider: 'grow', metadata: { reason: 'provider_unreachable' } });
      return json({ error: 'טרם התקבל קישור להזמנה. אפשר לבדוק את מצבה או לפנות לתמיכה.', code: 'ORDER_LINK_PENDING', orderId: order.id }, 503);
    }
    const payload = await response.json().catch(() => null);
    let paymentUrl: URL | null = null;
    if (typeof payload?.paymentUrl === 'string') {
      try {
        paymentUrl = new URL(payload.paymentUrl);
      } catch {
        // An invalid provider response follows the reconciliation path below.
      }
    }
    if (!response.ok || !paymentUrl || paymentUrl.protocol !== 'https:' || paymentUrl.username || paymentUrl.password) {
      // The provider may have created a link even when its response is unusable.
      // Keep the order for reconciliation instead of creating a second link.
      await recordAuditEvent(db, { eventType: 'checkout_start', outcome: 'failure', userId: user.id, orderId: order.id, provider: 'grow', metadata: { reason: 'invalid_provider_response' } });
      return json({ error: 'לא ניתן ליצור קישור תשלום כרגע', code: 'ORDER_LINK_PENDING', orderId: order.id }, 502);
    }

    const { data: savedOrder, error: saveError } = await db.from('orders').update({ payment_url: paymentUrl.href })
      .eq('id', order.id).eq('status', 'PENDING').select('id').maybeSingle();
    if (saveError) throw saveError;
    if (!savedOrder) return json({ error: 'מצב ההזמנה השתנה. בדקו את סטטוס התשלום לפני ניסיון נוסף.' }, 409);
    await recordAuditEvent(db, { eventType: 'checkout_start', outcome: 'pending', userId: user.id, orderId: order.id, provider: 'grow', amount: order.amount, currency: 'ILS' });
    return json({ orderId: order.id, paymentUrl: paymentUrl.href });
  } catch (err) {
    console.error('create-grow-payment', err instanceof Error ? err.name : 'Database error');
    return json({ error: 'Payment initialization failed' }, 500);
  }
});
