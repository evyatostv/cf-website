import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'motion/react';
import { AlertCircle, Shield, ArrowLeft, Check, Lock, CreditCard } from 'lucide-react';
import { supabase, logPolicyAcceptance } from '@/lib/supabase';

const PLAN_INFO: Record<string, { name: string; price: string; amount: number; features: string[] }> = {
  basic: {
    name: 'חבילה בסיסית',
    price: '₪899',
    amount: 89900,
    features: ['סיכומי ביקור מעוצבים', 'יצירת מסמכי PDF', 'ניהול יומן פגישות', 'ניהול חולים ורקע רפואי'],
  },
  professional: {
    name: 'חבילה מקצועית',
    price: '₪999',
    amount: 99900,
    features: ['כל מה שבחבילה הבסיסית', 'דוח מעקב סטטיסטי', 'גרפים וניתוח נתונים', 'יומן אישי ותיוג רשומות', 'הערות דביקות', 'חיפוש וסינון מתקדם'],
  },
  full: {
    name: 'חבילת ניהול מלאה',
    price: '₪1,299',
    amount: 129900,
    features: ['כל מה שבחבילה המקצועית', 'דוח הכנסות פיננסיים', 'הנפקת קבלות וחשבוניות', 'קבלה וחשבונית משולבת', 'מעקב שיטות תשלום'],
  },
};

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsLogged, setTermsLogged] = useState(false);

  const plan = searchParams.get('plan') || '';
  const planInfo = PLAN_INFO[plan];

  useEffect(() => {
    if (!loading && !user) navigate('/login?redirect=/payment?plan=' + plan);
  }, [user, loading, navigate, plan]);

  const handleTermsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setTermsAccepted(checked);
    if (checked && !termsLogged && user) {
      await logPolicyAcceptance(user.id, user.email!, plan);
      setTermsLogged(true);
    }
  };

  const handlePayment = async () => {
    if (!user || !planInfo) return;

    setProcessing(true);
    setError('');

    try {
      const { data: refreshData } = await supabase.auth.refreshSession();
      const token = refreshData.session?.access_token;

      if (!token) {
        setError('פג תוקף ההתחברות — אנא התחבר מחדש');
        setProcessing(false);
        return;
      }

      const res = await fetch(
        'https://dmuwxydmuylcbhcoagri.supabase.co/functions/v1/create-allpay-payment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdXd4eWRtdXlsY2JoY29hZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjAyMDYsImV4cCI6MjA4NDk5NjIwNn0.GETQeDKZk9FV41B7HCN95guPEkyWhJSQ8VYb_SNGfWY',
          },
          body: JSON.stringify({ plan }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.payment_url) {
        setError(data.error || 'שגיאה ביצירת תשלום');
        setProcessing(false);
        return;
      }

      // Redirect to AllPay payment page
      window.location.href = data.payment_url;
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת תשלום');
      setProcessing(false);
    }
  };

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
          <div className="bg-white rounded-2xl border border-[#e1e6ec] p-5 sm:p-8 flex flex-col">
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

          {/* Payment action */}
          <div className="bg-white rounded-2xl border border-[#e1e6ec] p-5 sm:p-8 flex flex-col justify-between relative">
            {processing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-[#0d47a1] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#1a2332] font-semibold text-sm">מעביר לדף תשלום מאובטח...</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-[#1a2332] mb-2">תשלום מאובטח</h3>
              <p className="text-sm text-[#6b7c93] mb-6">תועבר לדף תשלום מאובטח להשלמת הרכישה.</p>

              <div className="bg-[#f5f7f9] rounded-xl p-4 mb-5">
                <p className="text-xs text-[#6b7c93] mb-1">הרכישה תירשם לחשבון</p>
                <p className="font-medium text-[#1a2332] text-sm">{user.email}</p>
              </div>

              <div className="border border-[#e1e6ec] rounded-xl p-4 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7c93]">{planInfo.name}</span>
                  <span className="font-medium text-[#1a2332]">{planInfo.price}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[#e1e6ec] pt-2 mt-2">
                  <span className="font-bold text-[#1a2332]">סה"כ לתשלום</span>
                  <span className="font-bold text-[#0d47a1]">{planInfo.price}</span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="flex items-center justify-center gap-3 mb-5 py-3 bg-[#f5f7f9] rounded-xl">
                <CreditCard className="w-5 h-5 text-[#6b7c93]" />
                <span className="text-xs text-[#6b7c93]">Visa • Mastercard • AmEx • Apple Pay • Bit</span>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-center">
                <p className="text-xs text-blue-700">ניתן לשלם בתשלומים (עד 3)</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div>
              {/* Terms checkbox */}
              <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={handleTermsChange}
                  className="mt-0.5 w-4 h-4 accent-[#0d47a1] flex-shrink-0 cursor-pointer"
                />
                <span className="text-xs text-[#4a5568] leading-relaxed">
                  קראתי ואני מסכים/ה{" "}
                  <Link to="/terms" target="_blank" className="text-[#0d47a1] hover:underline">לתנאי השימוש</Link>
                  {", "}
                  <Link to="/privacy" target="_blank" className="text-[#0d47a1] hover:underline">מדיניות הפרטיות</Link>
                  {", "}
                  <Link to="/disclaimer" target="_blank" className="text-[#0d47a1] hover:underline">הסרת האחריות על נתונים</Link>
                  {" ו"}
                  <Link to="/refund" target="_blank" className="text-[#0d47a1] hover:underline">מדיניות ההחזרים</Link>
                  {" של ClinicFlow."}
                </span>
              </label>

              <button
                onClick={handlePayment}
                disabled={processing || !termsAccepted}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-bold py-4 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-3"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    מעביר לתשלום...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {`שלם ${planInfo.price}`}
                  </>
                )}
              </button>
              <p className="text-center text-xs text-[#6b7c93]">מוגן על ידי AllPay • תשלום מאובטח SSL</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
