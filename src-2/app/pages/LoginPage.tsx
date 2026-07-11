import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'motion/react';
import { PasswordInput } from '@/app/components/ui/password-input';
import { GoogleSignInButton } from '@/app/components/GoogleSignInButton';
import { Captcha, CaptchaHandle } from '@/app/components/Captcha';
import { mapAuthError } from '@/lib/auth-errors';
import { safeRedirect } from '@/lib/safe-redirect';
import { serverRateLimit, checkRateLimit } from '@/lib/rate-limit';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResetHint, setShowResetHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<CaptchaHandle>(null);

  // Where to send the user after login: honour a validated same-origin
  // ?redirect= (e.g. back to /payment?plan=...), else the normal flow.
  const redirect = searchParams.get('redirect');

  // Already signed in → don't show the login form; send them onward (same
  // destination logic as a fresh login). replace:true so Back doesn't return here.
  useEffect(() => {
    if (authLoading || !user) return;
    if (redirect) {
      navigate(safeRedirect(redirect), { replace: true });
    } else {
      navigate(user.user_metadata?.onboarded ? '/dashboard' : '/complete-profile', { replace: true });
    }
  }, [user, authLoading, redirect, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResetHint(false);
    setLoading(true);

    // Throttle login attempts (WEB-007 / UERR-028). Server-authoritative counter
    // keyed by email; best-effort per-tab check as a fallback. Keep the same
    // Hebrew copy the signup page uses.
    const rlKey = `login_${email.trim().toLowerCase()}`;
    try {
      const rl = await serverRateLimit(rlKey, 5, 60);
      const clientAllowed = checkRateLimit(rlKey, 5, 60);
      if (!rl.allowed || !clientAllowed) {
        setError('ניסיונות רבים מדי. אנא נסה/י שוב בעוד דקה.');
        setLoading(false);
        captchaRef.current?.reset();
        return;
      }
    } catch {
      // Never block login on a throttling-infra failure.
    }

    try {
      const data = await signIn(email, password, captchaToken);
      // Users who haven't finished onboarding are sent to complete it first.
      const onboarded = data?.user?.user_metadata?.onboarded;
      if (redirect) {
        navigate(safeRedirect(redirect));
      } else {
        navigate(onboarded ? '/dashboard' : '/complete-profile');
      }
    } catch (err: any) {
      setError(mapAuthError(err));
      // Nudge toward password reset on a credential failure.
      const s = String(err?.code || err?.message || '').toLowerCase();
      setShowResetHint(s.includes('invalid') || s.includes('credential') || s.includes('password'));
    } finally {
      setLoading(false);
      captchaRef.current?.reset(); // tokens are single-use
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-20 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1a2332] mb-2">כניסה</h1>
            <p className="text-[#6b7c93]">הזן/י את פרטיך כדי להיכנס לחשבונך</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
              {showResetHint && (
                <p className="text-red-600 text-sm mt-1">
                  שכחת/ה את הסיסמה?{' '}
                  <Link to="/reset-password" className="font-medium underline hover:no-underline">
                    איפוס סיסמה
                  </Link>
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#1a2332] mb-2">
                דוא"ל
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-3 text-base border border-[#e1e6ec] rounded-lg focus:outline-none focus:border-[#0d47a1] focus:ring-2 focus:ring-[#0d47a1]/20 transition"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[#1a2332] mb-2">
                סיסמה
              </label>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="md:col-span-2">
              <Captcha ref={captchaRef} onVerify={setCaptchaToken} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3.5 rounded-lg hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
            >
              {loading ? 'כניסה...' : 'כנס/י'}
            </button>
          </form>

          <GoogleSignInButton label="התחברות עם Google" onError={setError} />

          <div className="mt-4 text-center">
            <Link to="/reset-password" className="text-sm font-medium text-[#0d47a1] hover:underline transition">
              שכחתי סיסמה
            </Link>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[#6b7c93]">
              אין לך חשבון?{' '}
              <Link to="/signup" className="text-[#0d47a1] font-medium hover:underline">
                הירשם/י עכשיו
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
