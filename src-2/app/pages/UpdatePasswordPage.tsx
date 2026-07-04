import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { PasswordInput } from '@/app/components/ui/password-input';
import { PasswordStrength } from '@/app/components/ui/password-strength';
import { evaluatePassword } from '@/lib/password';

/**
 * Landing page for the password-reset email link. Supabase parses the recovery
 * token from the URL and establishes a temporary session (PASSWORD_RECOVERY),
 * after which supabase.auth.updateUser({ password }) sets the new password.
 */
export function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // The recovery session may already be parsed from the URL, or arrive via the event.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);

    if (!evaluatePassword(password).valid) {
      setError('הסיסמה עדיין לא עומדת בדרישות. יש להשלים את הסעיפים המסומנים.');
      return;
    }
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'אירעה שגיאה בעדכון הסיסמה. נסו שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-20 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8" dir="rtl">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#1a2332] mb-2">הסיסמה עודכנה</h2>
              <p className="text-[#6b7c93] mb-6">הסיסמה החדשה נשמרה בהצלחה. אפשר להיכנס עם הסיסמה החדשה.</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-block bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-8 py-3 rounded-lg hover:shadow-lg transition font-medium min-h-[48px]"
              >
                כניסה לחשבון
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#1a2332] mb-2">בחירת סיסמה חדשה</h1>
                <p className="text-[#6b7c93]">כמעט סיימנו — קִבעו סיסמה חדשה לחשבון שלכם.</p>
              </div>

              {!ready && !error && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[#8a5a00] text-sm">
                    כדי לאפס סיסמה יש לפתוח את הקישור מהמייל שקיבלתם. אם הגעתם לכאן ישירות, בקשו קישור חדש מדף{' '}
                    <Link to="/reset-password" className="font-semibold hover:underline">איפוס הסיסמה</Link>.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-[#1a2332] mb-2">
                    סיסמה חדשה
                  </label>
                  <PasswordInput
                    id="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    capsWarning
                  />
                  <PasswordStrength value={password} submitted={submitted} />
                </div>

                <div>
                  <label htmlFor="new-password-confirm" className="block text-sm font-medium text-[#1a2332] mb-2">
                    אימות סיסמה
                  </label>
                  <PasswordInput
                    id="new-password-confirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    capsWarning
                  />
                  {confirm.length > 0 && (
                    <p
                      aria-live="polite"
                      className="mt-2 text-[13px] font-medium"
                      style={{ color: confirm === password ? '#1b7a3d' : '#8a5a00' }}
                    >
                      {confirm === password ? 'מצוין, הסיסמאות זהות ✓' : 'הסיסמאות עדיין לא זהות — בדקו שוב.'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !ready}
                  className="w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3.5 rounded-lg hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
                >
                  {loading ? 'שומר/ת...' : 'שמירת הסיסמה החדשה'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-[#6b7c93] hover:text-[#0d47a1] text-sm transition">
                  חזרה לכניסה
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
