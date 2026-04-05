import { useSearchParams, Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'motion/react';
import { Download, CheckCircle2, ArrowLeft } from 'lucide-react';

export function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get('session_id');

  // Stripe only redirects here on success, so session_id present = paid
  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-[#6b7c93] mb-2">לא נמצאה הזמנה.</p>
          <Link to="/pricing" className="text-[#0d47a1] hover:underline">חזרה לתמחור</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center pt-28 pb-20" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg mx-auto px-4"
      >
        {/* Success icon */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.2 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6"
          >
            <CheckCircle2 className="w-14 h-14 text-green-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-[#1a2332] mb-3"
          >
            תודה על הרכישה!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[#6b7c93]"
          >
            הרישיון שלך הופעל. תוכל/י להוריד ולהשתמש באפליקציה עכשיו.
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6"
        >
          <h2 className="font-bold text-[#1a2332] mb-4">פרטי ההזמנה</h2>
          <div className="space-y-3 mb-6">
            {user?.email && (
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7c93]">דוא"ל</span>
                <span className="font-medium text-[#1a2332]">{user.email}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7c93]">מזהה הזמנה</span>
              <span className="font-mono text-xs text-[#1a2332] truncate max-w-[180px]">{sessionId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7c93]">סטטוס</span>
              <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium text-xs">✓ שולם</span>
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-blue-50 rounded-xl p-5 mb-6">
            <h3 className="font-bold text-[#1a2332] text-sm mb-3">הצעדים הבאים:</h3>
            <ol className="space-y-2">
              {[
                'הורד את יישום ClinicFlow מהכפתור למטה',
                'פתח את היישום והזן את הדוא"ל וסיסמה שלך',
                'היישום יופעל אוטומטית עם הרישיון שלך',
              ].map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-[#1a2332]">
                  <span className="w-5 h-5 rounded-full bg-[#0d47a1] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <a
            href="https://github.com/evyatostv/ClinicFlow/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-bold py-4 rounded-xl hover:shadow-lg transition mb-3"
          >
            <Download className="w-5 h-5" />
            הורד את האפליקציה (Windows)
          </a>

          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full text-[#0d47a1] border-2 border-[#0d47a1] font-medium py-3 rounded-xl hover:bg-[#f5f7f9] transition text-sm"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            עבור ל-Dashboard
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-[#6b7c93]"
        >
          שאלות?{' '}
          <a href="mailto:info@clinicflow.co.il" className="text-[#0d47a1] hover:underline">
            info@clinicflow.co.il
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
