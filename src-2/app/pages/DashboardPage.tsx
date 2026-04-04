import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { getUserAccess, UserAccess, PLAN_LABELS } from '@/lib/supabase';
import { motion } from 'motion/react';
import { Download, LogOut, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [access, setAccess] = useState<UserAccess | null | undefined>(undefined);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      getUserAccess(user.id).then(setAccess);
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (loading || access === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8f4f8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d47a1]"></div>
          <p className="mt-4 text-[#6b7c93]">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isTrialExpired =
    access?.plan === 'trial' &&
    access?.expires_at &&
    new Date(access.expires_at) < new Date();

  const hasActiveAccess = access?.is_active && !isTrialExpired;
  const planLabel = access ? PLAN_LABELS[access.plan] ?? access.plan : null;

  const trialDaysLeft =
    access?.plan === 'trial' && access.expires_at && !isTrialExpired
      ? Math.ceil((new Date(access.expires_at).getTime() - Date.now()) / 86400000)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8f4f8] pt-32 pb-20" dir="rtl">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold text-[#1a2332]">
                שלום, {user.user_metadata?.full_name || user.email}
              </h1>
              <p className="text-[#6b7c93] mt-1">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#1a2332] rounded-lg hover:bg-[#f5f7f9] transition border border-[#e1e6ec]"
            >
              <LogOut className="w-4 h-4" />
              <span>התנתק</span>
            </button>
          </div>

          {/* Access Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-6"
          >
            {!access ? (
              /* No access row at all — pending */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-[#1a2332] mb-2">ממתין לאישור</h2>
                <p className="text-[#6b7c93] max-w-sm mx-auto">
                  החשבון שלך נוצר בהצלחה. ברגע שהרכישה תאושר תוכל/י להפעיל את האפליקציה.
                </p>
                <p className="text-sm text-[#6b7c93] mt-3">
                  שאלות? פנה/י אלינו בדוא"ל{' '}
                  <a href="mailto:info@clinicflow.co.il" className="text-[#0d47a1] hover:underline">
                    info@clinicflow.co.il
                  </a>
                </p>
              </div>
            ) : !access.is_active ? (
              /* Access row exists but not active */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-[#1a2332] mb-2">גישה מושהית</h2>
                <p className="text-[#6b7c93]">
                  הגישה שלך הושהתה. לפרטים נוספים צור/י קשר.
                </p>
              </div>
            ) : isTrialExpired ? (
              /* Trial expired */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-[#1a2332] mb-2">תקופת הניסיון הסתיימה</h2>
                <p className="text-[#6b7c93] mb-4">
                  הניסיון החינמי שלך הסתיים. רכוש רישיון כדי להמשיך להשתמש באפליקציה.
                </p>
                <a
                  href="/pricing"
                  className="inline-block bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-8 py-3 rounded-lg hover:shadow-lg transition"
                >
                  לבחירת חבילה
                </a>
              </div>
            ) : (
              /* Active access */
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1a2332]">גישה פעילה</h2>
                    {trialDaysLeft !== null && (
                      <p className="text-sm text-amber-600 font-medium">
                        ניסיון חינם — {trialDaysLeft} ימים נותרו
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-[#0d47a1] to-[#00838f] rounded-xl p-5 text-white">
                    <p className="text-sm opacity-80 mb-1">החבילה שלך</p>
                    <p className="text-xl font-bold">{planLabel}</p>
                  </div>
                  <div className="bg-[#f5f7f9] rounded-xl p-5">
                    <p className="text-sm text-[#6b7c93] mb-1">
                      {access.plan === 'trial' ? 'תוקף' : 'סוג רישיון'}
                    </p>
                    <p className="text-xl font-bold text-[#1a2332]">
                      {access.plan === 'trial' && access.expires_at
                        ? new Date(access.expires_at).toLocaleDateString('he-IL')
                        : 'לנצח'}
                    </p>
                  </div>
                </div>

                <a
                  href="#download"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-6 py-4 rounded-xl hover:shadow-lg transition w-full font-medium text-lg"
                >
                  <Download className="w-5 h-5" />
                  <span>הורד את האפליקציה</span>
                </a>

                {access.plan === 'trial' && (
                  <p className="text-center text-sm text-[#6b7c93] mt-4">
                    רוצה לשדרג לרישיון מלא?{' '}
                    <a href="/pricing" className="text-[#0d47a1] hover:underline font-medium">
                      ראה חבילות
                    </a>
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Help text */}
          <p className="text-center text-sm text-[#6b7c93]">
            שאלות? כתוב לנו ל‑
            <a href="mailto:info@clinicflow.co.il" className="text-[#0d47a1] hover:underline">
              info@clinicflow.co.il
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
