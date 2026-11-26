import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { watchOrderStatus } from '@/lib/checkout-status';
import { usePageReturn } from '@/lib/use-page-return';
import { useAuth } from '@/lib/auth-context';
import { Seo } from '@/app/components/Seo';

const CHECKOUT_STATUS = {
  loading: ['בודקים את סטטוס התשלום', 'הבדיקה עשויה להימשך כמה רגעים.'],
  pending: ['ממתינים לאישור התשלום', 'אין צורך לשלם שוב. הדף יתעדכן אוטומטית.'],
  connection: ['הקשר עם השרת נקטע', 'נבדוק שוב כשהחיבור יתחדש. אם כבר שילמתם, אין צורך לשלם שוב.'],
  paid: ['התשלום אושר', 'הרישיון הופעל. אפשר להוריד את ClinicFlow מהאזור האישי.'],
  reversed: ['התשלום בוטל', 'הרישיון שנרכש בהזמנה זו אינו פעיל. לשאלות על החיוב אפשר לפנות לתמיכה.'],
  failed: ['התשלום לא אושר', 'אפשר לחזור לעמוד התמחור.'],
  review: ['ההזמנה בבדיקה', 'אם חויבתם, פנו לתמיכה לפני שתנסו לשלם שוב.'],
  unavailable: ['לא הצלחנו לאתר את ההזמנה', 'בדקו את הקישור או פנו לתמיכה אם חויבתם.'],
  signedOut: ['נדרשת התחברות', 'התחברו לחשבון שאיתו התחלתם את ההזמנה כדי לבדוק את הסטטוס.'],
} as const;

type Status = keyof typeof CHECKOUT_STATUS;

function validOrderId(order: string | null): order is string {
  return order !== null && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(order);
}

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const order = params.get('order');
  const { user, loading } = useAuth();
  const pageReturn = usePageReturn();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (loading) return;
    if (!validOrderId(order)) {
      setStatus('unavailable');
      return;
    }
    if (!user) {
      setStatus('signedOut');
      return;
    }

    setStatus('loading');
    return watchOrderStatus(
      () => supabase.from('orders').select('status').eq('id', order).maybeSingle(),
      setStatus,
    );
  }, [order, user, loading, pageReturn]);

  const [title, description] = CHECKOUT_STATUS[status];
  const returnPath = order ? `/checkout/success?order=${encodeURIComponent(order)}` : '/checkout/success';
  const action = status === 'signedOut' ? { to: `/login?redirect=${encodeURIComponent(returnPath)}`, label: 'התחברות' }
    : status === 'failed' ? { to: '/pricing', label: 'חזרה לתמחור' }
    : status === 'review' || status === 'reversed' || status === 'unavailable' ? { to: '/contact', label: 'פנייה לתמיכה' }
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
        {(status === 'pending' || status === 'connection') && (
          <p className="mt-4"><Link className="underline" to="/contact">שילמתם ועדיין ממתינים? פנו לתמיכה</Link></p>
        )}
      </div>
    </div>
  );
}

export function CheckoutCancelPage() {
  const [params] = useSearchParams();
  const order = params.get('order');
  const hasOrder = validOrderId(order);
  const statusPath = hasOrder ? `/checkout/success?order=${encodeURIComponent(order)}` : '/account/orders';
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#f5f7f9] p-6">
      <Seo title="יציאה מדף התשלום | ClinicFlow" description="אפשר לבדוק את סטטוס ההזמנה לפני שמנסים לשלם שוב." canonicalPath="/checkout/cancel" noindex />
      <div className="bg-white rounded-2xl border p-8 max-w-lg text-center">
        <h1 className="text-2xl font-bold text-[#1a2332]">יצאתם מדף התשלום</h1>
        <p className="mt-3 text-[#6b7c93]">{hasOrder ? 'אפשר לבדוק את סטטוס ההזמנה לפני שמנסים לשלם שוב.' : 'אפשר לבדוק בחשבון אם הרכישה מופיעה. אם ראיתם חיוב והרכישה חסרה, פנו לתמיכה לפני תשלום נוסף.'}</p>
        <Link className="inline-block mt-6 rounded-xl bg-[#0d47a1] px-6 py-3 text-white" to={statusPath}>
          {hasOrder ? 'בדיקת סטטוס ההזמנה' : 'ההזמנות והרכישות שלי'}
        </Link>
        <p className="mt-4"><Link className="underline" to="/contact">שאלה לגבי חיוב? פנו לתמיכה</Link></p>
      </div>
    </div>
  );
}
