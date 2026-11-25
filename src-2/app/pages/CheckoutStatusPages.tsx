import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Seo } from '@/app/components/Seo';

const CHECKOUT_STATUS = {
  loading: ['בודקים את סטטוס התשלום', 'הבדיקה עשויה להימשך כמה רגעים.'],
  pending: ['ממתינים לאישור התשלום', 'אין צורך לשלם שוב. הדף יתעדכן אוטומטית.'],
  paid: ['התשלום אושר', 'הרישיון הופעל. אפשר להוריד את ClinicFlow מהאזור האישי.'],
  failed: ['התשלום לא אושר', 'אפשר לחזור לעמוד התמחור.'],
  review: ['ההזמנה בבדיקה', 'אם חויבתם, פנו לתמיכה לפני שתנסו לשלם שוב.'],
  unavailable: ['לא הצלחנו לאתר את ההזמנה', 'בדקו את הקישור או פנו לתמיכה אם חויבתם.'],
  signedOut: ['נדרשת התחברות', 'התחברו לחשבון שאיתו התחלתם את ההזמנה כדי לבדוק את הסטטוס.'],
} as const;

type Status = keyof typeof CHECKOUT_STATUS;

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const order = params.get('order');
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (loading) return;
    if (!order || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(order)) {
      setStatus('unavailable');
      return;
    }
    if (!user) {
      setStatus('signedOut');
      return;
    }

    let stopped = false;
    let timer: number | undefined;
    const check = async () => {
      const { data, error } = await supabase.from('orders').select('status').eq('id', order).maybeSingle();
      if (stopped) return;
      if (error) {
        setStatus('unavailable');
        timer = window.setTimeout(check, 4000);
        return;
      }
      switch (data?.status) {
        case 'PAID': setStatus('paid'); break;
        case 'FAILED':
        case 'CANCELLED': setStatus('failed'); break;
        case 'MANUAL_REVIEW':
        case 'REFUNDED': setStatus('review'); break;
        case 'PENDING':
          setStatus('pending');
          timer = window.setTimeout(check, 4000);
          break;
        default: setStatus('unavailable');
      }
    };
    setStatus('loading');
    void check();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [order, user, loading]);

  const [title, description] = CHECKOUT_STATUS[status];
  const returnPath = order ? `/checkout/success?order=${encodeURIComponent(order)}` : '/checkout/success';
  const action = status === 'signedOut' ? { to: `/login?redirect=${encodeURIComponent(returnPath)}`, label: 'התחברות' }
    : status === 'failed' ? { to: '/pricing', label: 'חזרה לתמחור' }
    : status === 'review' || status === 'unavailable' ? { to: '/contact', label: 'פנייה לתמיכה' }
    : { to: '/dashboard', label: 'המשך לאזור האישי' };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#f5f7f9] p-6">
      <Seo title="סטטוס תשלום | ClinicFlow" description="סטטוס ההזמנה והמשך הפעולה ב־ClinicFlow." canonicalPath="/checkout/success" noindex />
      <div className="bg-white rounded-2xl border p-8 max-w-lg text-center">
        <div role="status">
          <h1 className="text-2xl font-bold text-[#1a2332]">{title}</h1>
          <p className="mt-3 text-[#6b7c93]">{description}</p>
        </div>
        <Link className="inline-block mt-6 rounded-xl bg-[#0d47a1] px-6 py-3 text-white" to={action.to}>{action.label}</Link>
      </div>
    </div>
  );
}

export function CheckoutCancelPage() {
  const [params] = useSearchParams();
  const order = params.get('order');
  const statusPath = order ? `/checkout/success?order=${encodeURIComponent(order)}` : '/pricing';
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#f5f7f9] p-6">
      <Seo title="יציאה מדף התשלום | ClinicFlow" description="אפשר לבדוק את סטטוס ההזמנה לפני שמנסים לשלם שוב." canonicalPath="/checkout/cancel" noindex />
      <div className="bg-white rounded-2xl border p-8 max-w-lg text-center">
        <h1 className="text-2xl font-bold text-[#1a2332]">יצאתם מדף התשלום</h1>
        <p className="mt-3 text-[#6b7c93]">אפשר לבדוק את סטטוס ההזמנה לפני שמנסים לשלם שוב.</p>
        <Link className="inline-block mt-6 rounded-xl bg-[#0d47a1] px-6 py-3 text-white" to={statusPath}>
          {order ? 'בדיקת סטטוס ההזמנה' : 'חזרה לתמחור'}
        </Link>
      </div>
    </div>
  );
}
