import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'motion/react';
import { AlertCircle, Shield, Lock, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const PLAN_INFO: Record<string, { name: string; price: string; features: string[] }> = {
  basic: {
    name: 'חבילה בסיסית',
    price: '₪3,450',
    features: ['סיכומי ביקור מעוצבים', 'יצירת מסמכי PDF', 'ניהול יומן פגישות', 'ניהול חולים ורקע רפואי'],
  },
  professional: {
    name: 'חבילה מקצועית',
    price: '₪4,590',
    features: ['כל מה שבחבילה הבסיסית', 'דוח מעקב סטטיסטי', 'גרפים וניתוח נתונים', 'יומן אישי ותיוג רשומות', 'הערות דביקות', 'חיפוש וסינון מתקדם'],
  },
  full: {
    name: 'חבילת ניהול מלאה',
    price: '₪5,890',
    features: ['כל מה שבחבילה המקצועית', 'דוח הכנסות פיננסיים', 'הנפקת קבלות וחשבוניות', 'קבלה וחשבונית משולבת', 'עקבוי שיטות תשלום'],
  },
};

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const plan = searchParams.get('plan') || '';
  const planInfo = PLAN_INFO[plan];

  useEffect(() => {
    if (!loading && !user) navigate('/login?redirect=/payment?plan=' + plan);
  }, [user, loading, navigate, plan]);

  if (!plan || !planInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" dir="rtl">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1a2332]">חבילה לא נמצאה</h1>
          <Link to="/pricing" className="mt-4 inline-block px-6 py-2.5 bg-[#0d47a1] text-white rounded-xl">
            חזור לתמחור
          </Link>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!user) return;
    setProcessing(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan, userId: user.id, email: user.email },
      });

      if (fnError) {
        const detail = (fnError as any)?.context?.error || fnError.message || JSON.stringify(fnError);
        throw new Error(detail);
      }

      if (!data?.url) {
        throw new Error(data?.error || 'לא התקבל קישור לדף התשלום');
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'שגיאה בעיבוד התשלום');
      setProcessing(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8f4f8] pt-32 pb-20" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Plan summary */}
          <div className="bg-white rounded-2xl border border-[#e1e6ec] p-8 flex flex-col">
            <Link to="/pricing" className="flex items-center gap-1.5 text-sm text-[#6b7c93] hover:text-[#0d47a1] mb-6 w-fit">
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              חזרה לתמחור
            </Link>

            <div className="flex-1">
              <p className="text-sm font-medium text-[#6b7c93] mb-1">הזמנה</p>
              <h2 className="text-2xl font-bold text-[#1a2332] mb-1">{planInfo.name}</h2>
              <div className="text-4xl font-black text-[#0d47a1] mb-1">{planInfo.price}</div>
              <p className="text-sm text-[#6b7c93] mb-8">תשלום חד-פעמי • רישיון לנצח</p>

              <ul className="space-y-3">
                {planInfo.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#1a2332]">
                    <Check className="w-4 h-4 text-[#00838f] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#e1e6ec] flex items-center gap-2 text-xs text-[#6b7c93]">
              <Shield className="w-4 h-4 text-[#00838f]" />
              עסקה מאובטחת • ללא עלויות נסתרות
            </div>
          </div>

          {/* Checkout */}
          <div className="bg-white rounded-2xl border border-[#e1e6ec] p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#1a2332] mb-2">מעבר לתשלום מאובטח</h3>
              <p className="text-sm text-[#6b7c93] mb-6">
                תועבר לדף Stripe המאובטח להשלמת הרכישה.
              </p>

              <div className="bg-[#f5f7f9] rounded-xl p-4 mb-6">
                <p className="text-xs text-[#6b7c93] mb-1">הרכישה תירשם לחשבון</p>
                <p className="font-medium text-[#1a2332] text-sm">{user.email}</p>
              </div>

              <div className="border border-[#e1e6ec] rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7c93]">{planInfo.name}</span>
                  <span className="font-medium text-[#1a2332]">{planInfo.price}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[#e1e6ec] pt-2">
                  <span className="font-bold text-[#1a2332]">סה"כ לתשלום</span>
                  <span className="font-bold text-[#0d47a1]">{planInfo.price}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-bold py-4 rounded-xl hover:shadow-lg transition disabled:opacity-60 text-lg mb-3"
              >
                <Lock className="w-4 h-4" />
                {processing ? 'מעביר לדף תשלום...' : 'המשך לתשלום מאובטח'}
              </button>

              <p className="text-center text-xs text-[#6b7c93]">מוגן על ידי Stripe</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
