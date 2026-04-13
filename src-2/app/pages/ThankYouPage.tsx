import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'motion/react';
import { Download, CheckCircle2, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, PLAN_LABELS } from '@/lib/supabase';

export function ThankYouPage() {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    // Poll user_access — webhook may take a few seconds to grant access
    let attempts = 0;
    const maxAttempts = 10;

    const check = async () => {
      const { data } = await supabase
        .from('user_access')
        .select('plan, is_active, granted_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.is_active && data.plan) {
        // Verify access was granted recently (within last 10 minutes)
        const grantedAt = new Date(data.granted_at).getTime();
        const now = Date.now();
        if (now - grantedAt < 10 * 60 * 1000) {
          setPlan(data.plan);
          setLoading(false);
          return;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(check, 2000);
      } else {
        setLoading(false);
      }
    };

    check();
  }, [user, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28 pb-20" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0d47a1] mx-auto mb-4 animate-spin" />
          <p className="text-[#6b7c93]">מאמת את התשלום...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28 pb-20" dir="rtl">
        <div className="w-full max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-100">
            <div className="text-center mb-6">
              <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#1a2332] mb-2">התשלום עדיין לא אומת</h1>
              <p className="text-[#6b7c93]">
                ייתכן שהתשלום עדיין מעובד, או שחל עיכוב באישור.
              </p>
            </div>

            <div className="bg-[#f5f7f9] rounded-xl p-5 mb-6">
              <h3 className="font-bold text-[#1a2332] text-sm mb-3">מה לעשות עכשיו:</h3>
              <ol className="space-y-2.5">
                <li className="flex gap-2.5 text-sm text-[#1a2332]">
                  <span className="w-5 h-5 rounded-full bg-[#0d47a1] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">1</span>
                  <span>המתן 1-2 דקות ולחץ "רענון" — אישור התשלום לוקח לפעמים זמן</span>
                </li>
                <li className="flex gap-2.5 text-sm text-[#1a2332]">
                  <span className="w-5 h-5 rounded-full bg-[#0d47a1] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">2</span>
                  <span>בדוק ב-Dashboard אם החבילה שלך פעילה</span>
                </li>
                <li className="flex gap-2.5 text-sm text-[#1a2332]">
                  <span className="w-5 h-5 rounded-full bg-[#0d47a1] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">3</span>
                  <span>אם לא חויבת — חזור לעמוד התמחור ונסה שוב</span>
                </li>
                <li className="flex gap-2.5 text-sm text-[#1a2332]">
                  <span className="w-5 h-5 rounded-full bg-[#0d47a1] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">4</span>
                  <span>אם חויבת אך החבילה לא הופעלה — צור קשר עם התמיכה</span>
                </li>
              </ol>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                רענון ובדיקה מחדש
              </button>
              <Link
                to="/dashboard"
                className="w-full text-center px-6 py-3 border-2 border-[#0d47a1] text-[#0d47a1] rounded-xl font-medium hover:bg-[#f5f7f9] transition"
              >
                עבור ל-Dashboard
              </Link>
              <Link
                to="/pricing"
                className="w-full text-center px-6 py-2 text-sm text-[#6b7c93] hover:text-[#0d47a1]"
              >
                חזרה לעמוד התמחור
              </Link>
            </div>

            <div className="border-t border-[#e1e6ec] pt-4 text-center">
              <p className="text-xs text-[#6b7c93] mb-2">זקוק לעזרה?</p>
              <a
                href="mailto:contact@clinic-flow.co.il?subject=תשלום לא אומת"
                className="text-sm text-[#0d47a1] font-medium hover:underline"
              >
                contact@clinic-flow.co.il
              </a>
              <p className="text-[10px] text-[#6b7c93] mt-2">
                כלול את הזמן המדויק של הרכישה והאימייל שלך
              </p>
            </div>
          </div>
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
              <span className="text-[#6b7c93]">חבילה</span>
              <span className="font-medium text-[#1a2332]">{PLAN_LABELS[plan] || plan}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7c93]">סטטוס</span>
              <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium text-xs">✓ שולם</span>
            </div>
          </div>

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
            הורד את האפליקציה (Windows / macOS)
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
          <a href="mailto:contact@clinic-flow.co.il" className="text-[#0d47a1] hover:underline">
            contact@clinic-flow.co.il
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
