import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { usePayment } from '@/lib/payment-context';
import { motion } from 'motion/react';
import { Download, CheckCircle2 } from 'lucide-react';

export function ThankYouPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isPaymentComplete, paymentId, selectedPlan } = usePayment();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    // Redirect if no payment was made
    if (!loading && !isPaymentComplete) {
      navigate('/pricing');
    }
  }, [user, loading, isPaymentComplete, navigate]);

  if (!user || !isPaymentComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto px-6"
      >
        {/* Success Animation */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-8"
          >
            <CheckCircle2 className="w-24 h-24 text-green-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl font-bold text-[#1a2332] mb-4"
          >
            תודה על הקנייה!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-[#6b7c93] mb-8"
          >
            הרישיון שלך הופעל בהצלחה
          </motion.p>
        </div>

        {/* Confirmation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8"
        >
          {/* Order Details */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1a2332] mb-6">פרטי ההזמנה</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-[#e1e6ec]">
                <span className="text-[#6b7c93]">דוא"ל</span>
                <span className="font-medium text-[#1a2332]">{user.email}</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-[#e1e6ec]">
                <span className="text-[#6b7c93]">תוכנית</span>
                <span className="font-medium text-[#1a2332] capitalize">{selectedPlan}</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-[#e1e6ec]">
                <span className="text-[#6b7c93]">מזהה התשלום</span>
                <span className="font-mono text-sm text-[#1a2332]">{paymentId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#6b7c93]">סטטוס</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium text-sm">
                  ✓ שולם
                </span>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-[#1a2332] mb-4">הצעדים הבאים:</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="font-bold text-[#0d47a1]">1.</span>
                <span className="text-[#1a2332]">הורד את יישום ClinicFlow</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#0d47a1]">2.</span>
                <span className="text-[#1a2332]">פתח את היישום והזן את הדוא"ל וסיסמה שלך</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#0d47a1]">3.</span>
                <span className="text-[#1a2332]">היישום יופעל אוטומטית ותוכל להתחיל להשתמש</span>
              </li>
            </ol>
          </div>

          {/* Download Button */}
          <a
            href="#download"
            className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-bold py-4 rounded-lg hover:shadow-lg transition mb-4"
          >
            <Download className="w-6 h-6" />
            <span>הורד את היישום עכשיו</span>
          </a>

          {/* Go to Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-[#0d47a1] border-2 border-[#0d47a1] font-bold py-3 rounded-lg hover:bg-[#f5f7f9] transition"
          >
            עבור ל- Dashboard
          </button>
        </motion.div>

        {/* Email Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-[#6b7c93] text-sm">
            דוא"ל אישור נשלח ל- <span className="font-medium">{user.email}</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
