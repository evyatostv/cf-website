import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'motion/react';
import { AlertCircle, Shield, ArrowLeft, Check, Lock } from 'lucide-react';
import { supabase, logPolicyAcceptance } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PLAN_INFO: Record<string, { name: string; price: string; amount: number; features: string[] }> = {
  basic: {
    name: 'חבילה בסיסית',
    price: '₪759',
    amount: 75900,
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
    features: ['כל מה שבחבילה המקצועית', 'דוח הכנסות פיננסיים', 'הנפקת קבלות וחשבוניות', 'קבלה וחשבונית משולבת', 'עקבוי שיטות תשלום'],
  },
};

// Inner component — has access to Stripe context
function CheckoutForm({ planInfo, userEmail, userId, plan, discountAmount, finalAmount }: { planInfo: typeof PLAN_INFO[string]; userEmail: string; userId: string; plan: string; discountAmount: number; finalAmount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsLogged, setTermsLogged] = useState(false);

  const handleTermsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setTermsAccepted(checked);
    if (checked && !termsLogged) {
      await logPolicyAcceptance(userId, userEmail, plan);
      setTermsLogged(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'שגיאה בעיבוד פרטי התשלום');
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/thank-you`,
        receipt_email: userEmail,
      },
    });

    // confirmPayment only rejects on immediate errors (redirect happens on success)
    if (confirmError) {
      setError(confirmError.message || 'שגיאה בעיבוד התשלום');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
      <div>
        <h3 className="text-lg font-bold text-[#1a2332] mb-2">פרטי תשלום</h3>
        <p className="text-sm text-[#6b7c93] mb-5">הזן את פרטי כרטיס האשראי שלך.</p>

        <div className="bg-[#f5f7f9] rounded-xl p-4 mb-5">
          <p className="text-xs text-[#6b7c93] mb-1">הרכישה תירשם לחשבון</p>
          <p className="font-medium text-[#1a2332] text-sm">{userEmail}</p>
        </div>

        <div className="border border-[#e1e6ec] rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#6b7c93]">{planInfo.name}</span>
            <span className="font-medium text-[#1a2332]">{planInfo.price}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>הנחת שדרוג (50%)</span>
              <span>-₪{Math.round(discountAmount / 100).toLocaleString('he-IL')}</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-[#e1e6ec] pt-2">
            <span className="font-bold text-[#1a2332]">סה"כ לתשלום</span>
            <span className="font-bold text-[#0d47a1]">
              {discountAmount > 0
                ? `₪${Math.round(finalAmount / 100).toLocaleString('he-IL')}`
                : planInfo.price}
            </span>
          </div>
        </div>

        {/* Stripe Payment Element */}
        <div className="mb-5">
          <PaymentElement
            options={{
              layout: 'tabs',
              defaultValues: { billingDetails: { email: userEmail } },
            }}
          />
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
          type="submit"
          disabled={!stripe || processing || !termsAccepted}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-bold py-4 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-3"
        >
          <Lock className="w-4 h-4" />
          {processing ? 'מעבד תשלום...' : `שלם ${discountAmount > 0 ? `₪${Math.round(finalAmount / 100).toLocaleString('he-IL')}` : planInfo.price}`}
        </button>
        <p className="text-center text-xs text-[#6b7c93]">מוגן על ידי Stripe</p>
      </div>
    </form>
  );
}

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [initError, setInitError] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const plan = searchParams.get('plan') || '';
  const isUpgrade = searchParams.get('upgrade') === 'true';
  const planInfo = PLAN_INFO[plan];

  useEffect(() => {
    if (!loading && !user) navigate('/login?redirect=/payment?plan=' + plan);
  }, [user, loading, navigate, plan]);

  const createIntent = useCallback(async () => {
    if (!user || !planInfo) return;

    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { plan, isUpgrade },
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
    });

    if (error || !data?.clientSecret) {
      setInitError((error as any)?.context?.error || error?.message || 'שגיאה ביצירת סשן תשלום');
      return;
    }

    setClientSecret(data.clientSecret);
    setDiscountAmount(data.discountAmount || 0);
    setFinalAmount(data.finalAmount || planInfo.amount);
  }, [user, plan, planInfo]);

  useEffect(() => {
    createIntent();
  }, [createIntent]);

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
          <div className="bg-white rounded-2xl border border-[#e1e6ec] p-8 flex flex-col">
            <Link to="/pricing" className="flex items-center gap-1.5 text-sm text-[#6b7c93] hover:text-[#0d47a1] mb-6 w-fit">
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              חזרה לתמחור
            </Link>

            <div className="flex-1">
              <p className="text-sm font-medium text-[#6b7c93] mb-1">הזמנה</p>
              <h2 className="text-2xl font-bold text-[#1a2332] mb-1">{planInfo.name}</h2>
              {isUpgrade && discountAmount > 0 ? (
                <div className="mb-1">
                  <span className="text-2xl line-through text-[#6b7c93] ml-2">{planInfo.price}</span>
                  <span className="text-4xl font-black text-[#0d47a1]">
                    ₪{Math.round(finalAmount / 100).toLocaleString('he-IL')}
                  </span>
                  <div className="mt-1 inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1 mr-2">
                    <span className="text-green-700 text-xs font-semibold">
                      חיסכון ₪{Math.round(discountAmount / 100).toLocaleString('he-IL')} (50% הנחת שדרוג)
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
          <div className="bg-white rounded-2xl border border-[#e1e6ec] p-8">
            {initError ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                <p className="text-[#1a2332] font-semibold mb-2">משהו השתבש</p>
                <p className="text-[#6b7c93] text-sm mb-6">לא הצלחנו לאתחל את דף התשלום. אנא צרו קשר ונסייע לכם לרכוש.</p>
                <Link
                  to="/contact"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl text-sm font-medium"
                >
                  צרו קשר
                </Link>
              </div>
            ) : !clientSecret ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-[#0d47a1] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  locale: 'he',
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#0d47a1',
                      colorBackground: '#ffffff',
                      colorText: '#1a2332',
                      colorDanger: '#ef4444',
                      fontFamily: 'inherit',
                      borderRadius: '12px',
                    },
                  },
                }}
              >
                <CheckoutForm planInfo={planInfo} userEmail={user.email!} userId={user.id} plan={plan} discountAmount={discountAmount} finalAmount={finalAmount} />
              </Elements>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
