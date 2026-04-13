import { useEffect, useState } from 'react';
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
  const [paymentUrl, setPaymentUrl] = useState('');
  const [initError, setInitError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsLogged, setTermsLogged] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const plan = searchParams.get('plan') || '';
  const isUpgrade = searchParams.get('upgrade') === 'true';
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

  const handleStartPayment = async () => {
    if (!user || !planInfo) return;

    setProcessing(true);
    setInitError('');

    try {
      const { data: refreshData } = await supabase.auth.refreshSession();
      const token = refreshData.session?.access_token;

      if (!token) {
        setInitError('פג תוקף ההתחברות — אנא התחבר מחדש');
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
          body: JSON.stringify({ plan, isUpgrade }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.payment_url) {
        setInitError(data.error || 'שגיאה ביצירת תשלום');
        setProcessing(false);
        return;
      }

      setPaymentUrl(data.payment_url);
      setDiscountAmount(data.discountAmount || 0);
      setFinalAmount(data.finalAmount || planInfo.amount);
      setPaymentStarted(true);
      setProcessing(false);
    } catch (err: any) {
      setInitError(err.message || 'שגיאה ביצירת תשלום');
      setProcessing(false);
    }
  };

  // Load AllPay Hosted Fields SDK
  useEffect(() => {
    if (!paymentUrl) return;

    const existing = document.getElementById('allpay-hf-sdk');
    if (existing) return;

    const script = document.createElement('script');
    script.id = 'allpay-hf-sdk';
    script.src = 'https://allpay.to/js/allpay-hf.js';
    script.onload = () => {
      // @ts-ignore — AllpayPayment is loaded from the SDK
      window.__allpayInstance = new window.AllpayPayment({
        iframeId: 'allpay-iframe',
        onSuccess: () => {
          navigate('/thank-you?plan=' + plan);
        },
        onError: (error_n: number, error_msg: string) => {
          setInitError(`שגיאה בתשלום: ${error_msg} (${error_n})`);
        },
      });
    };
    document.head.appendChild(script);

    return () => {
      // @ts-ignore
      delete window.__allpayInstance;
    };
  }, [paymentUrl, navigate, plan]);

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
              {discountAmount > 0 ? (
                <div className="mb-1">
                  <span className="text-2xl line-through text-[#6b7c93] ml-2">{planInfo.price}</span>
                  <span className="text-4xl font-black text-[#0d47a1]">
                    ₪{Math.round(finalAmount / 100).toLocaleString('he-IL')}
                  </span>
                  <div className="mt-1 inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1 mr-2">
                    <span className="text-green-700 text-xs font-semibold">
                      זיכוי שדרוג ₪{Math.round(discountAmount / 100).toLocaleString('he-IL')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-4xl font-black text-[#0d47a1] mb-1">{planInfo.price}</div>
              )}
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

          {/* Payment form */}
          <div className="bg-white rounded-2xl border border-[#e1e6ec] p-5 sm:p-8 flex flex-col justify-between relative">
            {processing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-[#0d47a1] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#1a2332] font-semibold text-sm">טוען טופס תשלום...</p>
              </div>
            )}

            {initError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{initError}</p>
              </div>
            )}

            {!paymentStarted ? (
              /* Pre-payment: show info + terms + pay button */
              <>
                <div>
                  <h3 className="text-lg font-bold text-[#1a2332] mb-2">תשלום מאובטח</h3>
                  <p className="text-sm text-[#6b7c93] mb-6">הזן את פרטי התשלום כדי להשלים את הרכישה.</p>

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

                  <div className="flex items-center justify-center gap-3 mb-4 py-3 bg-[#f5f7f9] rounded-xl">
                    <img src="https://allpay.to/hfields/visa.svg" alt="Visa" className="h-6" />
                    <img src="https://allpay.to/hfields/mastercard.svg" alt="Mastercard" className="h-6" />
                    <img src="https://allpay.to/hfields/amex.svg" alt="AmEx" className="h-6" />
                    <img src="https://allpay.to/hfields/diners.svg" alt="Diners" className="h-6" />
                    <img src="https://allpay.to/hfields/apple-pay.svg" alt="Apple Pay" className="h-6 bg-black rounded px-1" />
                    <img src="https://allpay.to/hfields/bit-cyan.svg" alt="Bit" className="h-6 bg-[#03353b] rounded px-1" />
                  </div>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 mb-5 py-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#6b7c93]">
                      <Lock className="w-3.5 h-3.5 text-green-600" />
                      <span>SSL 256-bit</span>
                    </div>
                    <div className="w-px h-4 bg-[#e1e6ec]" />
                    <div className="flex items-center gap-1.5 text-xs text-[#6b7c93]">
                      <Shield className="w-3.5 h-3.5 text-green-600" />
                      <span>PCI-DSS</span>
                    </div>
                    <div className="w-px h-4 bg-[#e1e6ec]" />
                    <div className="flex items-center gap-1.5 text-xs text-[#6b7c93]">
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span>מאובטח</span>
                    </div>
                  </div>

                  <p className="text-center text-xs text-[#6b7c93] mb-5">עד 3 תשלומים ללא ריבית</p>
                </div>

                <div>
                  <label className="flex items-start gap-3 mb-5 cursor-pointer">
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
                    onClick={handleStartPayment}
                    disabled={processing || !termsAccepted}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-bold py-4 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-3"
                  >
                    <Lock className="w-4 h-4" />
                    {`שלם ${planInfo.price}`}
                  </button>
                  <p className="text-center text-xs text-[#6b7c93]">תשלום מאובטח SSL</p>
                </div>
              </>
            ) : (
              /* Hosted Fields: AllPay iframe */
              <>
                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-[#1a2332] mb-4">הזן פרטי תשלום</h3>
                  <iframe
                    id="allpay-iframe"
                    src={paymentUrl}
                    allow="payment *"
                    className="flex-1 w-full min-h-[400px] border-0 rounded-xl"
                  />
                </div>

                <button
                  onClick={() => {
                    // @ts-ignore
                    if (window.__allpayInstance) window.__allpayInstance.pay();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-bold py-4 rounded-xl hover:shadow-lg transition text-lg mt-4"
                >
                  <Lock className="w-4 h-4" />
                  {`שלם ${planInfo.price}`}
                </button>
                <p className="text-center text-xs text-[#6b7c93] mt-2">תשלום מאובטח SSL</p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
