import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { usePayment, getPlanDetails } from '@/lib/payment-context';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { processPayment } = usePayment();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const plan = searchParams.get('plan');
  const planDetails = plan ? getPlanDetails(plan) : null;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (!plan || !planDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8f4f8] flex items-center justify-center pt-20">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1a2332]">תוכנית לא חוקית</h1>
          <p className="text-[#6b7c93] mt-2">בחר תוכנית תקפה</p>
          <button
            onClick={() => navigate('/pricing')}
            className="mt-4 px-6 py-2 bg-[#0d47a1] text-white rounded-lg"
          >
            חזור לתמחור
          </button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!user) return;
    setProcessing(true);
    setError('');

    try {
      await processPayment(plan, user.email || '', user.id);
      navigate('/thank-you');
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8f4f8] flex items-center justify-center pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto px-6"
      >
        {/* BIG PAYMENT PAGE TEXT */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl md:text-8xl font-black text-[#0d47a1] opacity-20 mb-8">
              PAYMENT PAGE
            </h1>
            <p className="text-3xl font-bold text-[#0d47a1] mb-2">
              זו דף התשלום
            </p>
            <p className="text-[#6b7c93] text-lg">
              (בקרוב יוחלף בעמוד תשלום אמיתי)
            </p>
          </motion.div>
        </div>

        {/* Payment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#1a2332] mb-2">
              {planDetails.name}
            </h2>
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-5xl font-bold text-[#0d47a1]">
                ₪{planDetails.price}
              </span>
              <span className="text-[#6b7c93]">/ חודש</span>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-[#f5f7f9] rounded-xl p-6 mb-8">
            <h3 className="font-bold text-[#1a2332] mb-4">כלול בתוכנית:</h3>
            <ul className="space-y-3">
              {planDetails.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-[#1a2332]">
                  <span className="w-2 h-2 bg-[#0d47a1] rounded-full"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Payment Details (Placeholder) */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
            <p className="text-center text-yellow-800 font-bold text-lg mb-4">
              ⚠️ דף תשלום זמני ⚠️
            </p>
            <div className="bg-white p-4 rounded border border-yellow-300 mb-4">
              <p className="text-center text-[#6b7c93] text-sm">
                כאן יופיע דף התשלום שלך עם שדות כרטיס אשראי וכו'
              </p>
            </div>
            <p className="text-center text-yellow-700 text-sm">
              לעת עתה, לחץ על "אשר תשלום" כדי לסיים את תהליך הקנייה (בדיקה בלבד)
            </p>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-bold py-4 rounded-lg hover:shadow-lg transition disabled:opacity-50"
          >
            {processing ? 'מעבד תשלום...' : 'אשר תשלום'}
          </button>

          {/* Back Button */}
          <button
            onClick={() => navigate('/pricing')}
            className="w-full mt-4 bg-white text-[#0d47a1] border-2 border-[#0d47a1] font-bold py-3 rounded-lg hover:bg-[#f5f7f9] transition"
          >
            חזור לתמחור
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
