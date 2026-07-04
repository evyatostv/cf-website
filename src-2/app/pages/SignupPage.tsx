import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';
import { motion } from 'motion/react';
import { PasswordInput } from '@/app/components/ui/password-input';
import { PasswordStrength } from '@/app/components/ui/password-strength';
import { evaluatePassword } from '@/lib/password';
import { GoogleSignInButton } from '@/app/components/GoogleSignInButton';
import { Captcha, CaptchaHandle } from '@/app/components/Captcha';
import { mapAuthError } from '@/lib/auth-errors';

export function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<CaptchaHandle>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);

    // Rate limiting: max 5 signup attempts per minute per IP/email
    if (!checkRateLimit(`signup_${email}`, 5, 60)) {
      setError('ניסיונות רבים מדי. אנא נסה/י שוב בעוד דקה.');
      return;
    }

    if (!fullName.trim()) {
      setError('נא הזן/י שם מלא');
      return;
    }

    if (!phone.trim()) {
      setError('נא הזן/י מספר טלפון');
      return;
    }

    if (!evaluatePassword(password).valid) {
      setError('הסיסמה עדיין לא עומדת בדרישות. יש להשלים את הסעיפים המסומנים.');
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
          captchaToken: captchaToken || undefined,
        },
      });

      if (signUpError) {
        setError(mapAuthError(signUpError));
        return;
      }
      if (!data.user) throw new Error('Signup failed');

      // If a session was returned (email confirmation disabled), go straight to
      // the onboarding step. Otherwise show the "confirm your email" success
      // screen — onboarding then runs on first login (LoginPage guard).
      if (data.session) {
        navigate('/complete-profile');
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
      captchaRef.current?.reset(); // tokens are single-use
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-20 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl p-10 max-w-md text-center"
          dir="rtl"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a2332] mb-3">כמעט שם, {fullName}!</h1>
          <p className="text-[#6b7c93] mb-2">
            שלחנו קישור אימות לכתובת <strong className="text-[#1a2332]">{email}</strong>.
          </p>
          <p className="text-[#6b7c93] mb-6">
            לחצו על הקישור שבמייל כדי להשלים את יצירת החשבון. אם המייל לא הגיע תוך כמה דקות, בדקו גם בתיקיית הספאם.
          </p>
          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-8 py-3 rounded-lg hover:shadow-lg transition font-medium"
          >
            כבר אימתתי — כניסה
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-20 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1a2332] mb-2">הרשמה</h1>
            <p className="text-[#6b7c93]">צור/י חשבון חדש כדי להתחיל</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-[#1a2332] mb-2">
                שם מלא
              </label>
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="w-full px-4 py-3 text-base border border-[#e1e6ec] rounded-lg focus:outline-none focus:border-[#0d47a1] focus:ring-2 focus:ring-[#0d47a1]/20 transition"
                placeholder="שם מלא"
              />
            </div>

            <div>
              <label htmlFor="signup-phone" className="block text-sm font-medium text-[#1a2332] mb-2">
                מספר טלפון
              </label>
              <input
                id="signup-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                inputMode="tel"
                className="w-full px-4 py-3 text-base border border-[#e1e6ec] rounded-lg focus:outline-none focus:border-[#0d47a1] focus:ring-2 focus:ring-[#0d47a1]/20 transition"
                placeholder="05X-XXX-XXXX"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="signup-email" className="block text-sm font-medium text-[#1a2332] mb-2">
                דוא"ל
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="block text-sm font-medium text-[#1a2332] mb-2">
                סיסמה
              </label>
              <PasswordInput
                id="signup-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (submitted) setSubmitted(false);
                }}
                required
                autoComplete="new-password"
                capsWarning
              />
            </div>

            <div>
              <label htmlFor="signup-password-confirm" className="block text-sm font-medium text-[#1a2332] mb-2">
                אימות סיסמה
              </label>
              <PasswordInput
                id="signup-password-confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                capsWarning
              />
              {confirmPassword.length > 0 && (
                <p
                  dir="rtl"
                  aria-live="polite"
                  className="mt-2 text-[13px] font-medium"
                  style={{ color: confirmPassword === password ? '#1b7a3d' : '#8a5a00' }}
                >
                  {confirmPassword === password ? 'מצוין, הסיסמאות זהות ✓' : 'הסיסמאות עדיין לא זהות — בדקו שוב.'}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <PasswordStrength value={password} submitted={submitted} />
            </div>

            <div className="md:col-span-2">
              <Captcha ref={captchaRef} onVerify={setCaptchaToken} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3.5 rounded-lg hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
            >
              {loading ? 'יוצר/ת חשבון...' : 'הירשם/י'}
            </button>
          </form>

          <GoogleSignInButton label="הרשמה עם Google" onError={setError} />

          <div className="mt-6 text-center">
            <p className="text-[#6b7c93]">
              יש לך כבר חשבון?{' '}
              <Link to="/login" className="text-[#0d47a1] font-medium hover:underline">
                כנס/י כאן
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
