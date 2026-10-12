import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { serverRateLimit, checkRateLimit } from '@/lib/rate-limit';
import { motion } from 'motion/react';
import { PasswordInput } from '@/app/components/ui/password-input';
import { PasswordStrength } from '@/app/components/ui/password-strength';
import { evaluatePassword } from '@/lib/password';
import { mapAuthError } from '@/lib/auth-errors';
import { Sparkles, ShieldCheck, CheckCircle2, KeyRound, AlertCircle, ArrowLeft, Check, Lock, UserCheck } from 'lucide-react';

export function BetaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Mode: 'register' | 'login'
  const [mode, setMode] = useState<'register' | 'login'>('register');

  // Form fields
  const [passcode, setPasscode] = useState(() => searchParams.get('code') || searchParams.get('passcode') || '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // If already logged in, check if they already have full plan or want to claim it
  const [existingUserClaiming, setExistingUserClaiming] = useState(false);

  const cleanPasscode = passcode.trim().toUpperCase();
  const isPasscodeFormatValid = Boolean(
    cleanPasscode &&
    ['CLINICFLOWBETA', 'CLINIC-FLOW-BETA', 'CLINICFLOW-BETA', 'CLINIC-BETA-2026', 'CLINIC-BETA', 'CF-BETA'].includes(cleanPasscode)
  );

  // Auto-claim if returning from email confirmation
  useEffect(() => {
    if (!authLoading && user) {
      const storedBetaCode = localStorage.getItem('cf_beta_code');
      if (storedBetaCode) {
        setExistingUserClaiming(true);
        (async () => {
          try {
            const { data, error: rpcError } = await supabase.rpc('claim_beta_access', { passcode: storedBetaCode });
            if (!rpcError && data?.ok) {
              localStorage.removeItem('cf_beta_code');
              navigate('/dashboard', { replace: true });
            }
          } catch {
            // non-fatal
          } finally {
            setExistingUserClaiming(false);
          }
        })();
      }
    }
  }, [user, authLoading, navigate]);

  const handleClaimForLoggedInUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    try {
      const { data, error: rpcErr } = await supabase.rpc('claim_beta_access', {
        passcode: cleanPasscode,
      });

      if (rpcErr || !data?.ok) {
        setError(data?.error || rpcErr?.message || 'קוד גישה שגוי או פג תוקף.');
        setLoading(false);
        return;
      }

      await supabase.auth.updateUser({
        data: { onboarded: true },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'אירעה שגיאה בחיבור לשרת.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);

    if (!cleanPasscode) {
      setError('נא להזין קוד גישה לבטא');
      return;
    }

    if (!fullName.trim()) {
      setError('נא להזין שם מלא');
      return;
    }

    if (!email.trim()) {
      setError('נא להזין כתובת אימייל');
      return;
    }

    if (!phone.trim()) {
      setError('נא להזין מספר טלפון');
      return;
    }

    if (!evaluatePassword(password).valid) {
      setError('הסיסמה עדיין לא עומדת בדרישות האבטחה.');
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    // Rate limiting check
    const rlKey = `beta_signup_${email.trim().toLowerCase()}`;
    const rl = await serverRateLimit(rlKey, 5, 60);
    if (!rl.allowed || !checkRateLimit(rlKey, 5, 60)) {
      setError('ניסיונות רבים מדי. אנא נסה/י שוב בעוד דקה.');
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up user with metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            onboarded: true,
          },
        },
      });

      if (signUpError) {
        setError(mapAuthError(signUpError));
        setLoading(false);
        return;
      }

      // 2. If session established directly (no email confirmation needed)
      if (data?.session) {
        const { data: claimData, error: claimError } = await supabase.rpc('claim_beta_access', {
          passcode: cleanPasscode,
        });

        if (claimError || !claimData?.ok) {
          setError(claimData?.error || claimError?.message || 'ההרשמה הצליחה אך קוד הבטא שגוי.');
          setLoading(false);
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1200);
        return;
      }

      // 3. Email confirmation required: store passcode in localStorage to claim immediately after email click
      localStorage.setItem('cf_beta_code', cleanPasscode);
      setEmailSent(true);
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);

    if (!cleanPasscode) {
      setError('נא להזין קוד גישה לבטא');
      return;
    }

    if (!email.trim() || !password) {
      setError('נא להזין אימייל וסיסמה');
      return;
    }

    setLoading(true);

    try {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr) {
        setError(mapAuthError(signInErr));
        setLoading(false);
        return;
      }

      if (signInData?.session) {
        const { data: claimData, error: claimError } = await supabase.rpc('claim_beta_access', {
          passcode: cleanPasscode,
        });

        if (claimError || !claimData?.ok) {
          setError(claimData?.error || claimError?.message || 'ההתחברות הצליחה, אך קוד הבטא שגוי.');
          setLoading(false);
          return;
        }

        await supabase.auth.updateUser({
          data: { onboarded: true },
        });

        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      }
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Screen when email verification is sent
  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-24 pb-20 px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-xl border border-[#e1e6ec] p-8 md:p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-blue-50 text-[#0d47a1] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a2332] mb-3">כמעט סיימנו, {fullName}!</h1>
          <p className="text-[#4b5563] text-base mb-4 leading-relaxed">
            שלחנו קישור אימות לכתובת <strong className="text-[#1a2332]">{email}</strong>.
          </p>
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 mb-6 text-sm text-[#166534] text-right">
            <p className="font-semibold mb-1">🎁 רישיון Full שמור עבורך:</p>
            <p>ברגע שלוחצים על הקישור שבמייל, חשבונך יופעל אוטומטית עם רישיון Full מלא ללא כל עלות.</p>
          </div>
          <Link
            to="/login?redirect=/dashboard"
            className="w-full inline-flex items-center justify-center bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white py-3.5 px-6 rounded-xl font-medium shadow-md hover:shadow-lg transition"
          >
            אישרתי את המייל — כניסה למערכת
          </Link>
        </motion.div>
      </div>
    );
  }

  // Success celebration state
  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-24 pb-20 px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-[#e1e6ec] p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a2332] mb-2">ברוך הבא לתוכנית הבטא!</h2>
          <p className="text-sm text-[#4b5563] mb-6">
            חשבונך הוגדר בהצלחה עם רישיון <strong>Full (מלא)</strong>. מעביר אותך ללוח הבקרה ולהורדת התוכנה...
          </p>
          <div className="w-8 h-8 border-3 border-[#0d47a1] border-t-transparent rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-20 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-[#0284c7]" />
            תוכנית הבטא הבלעדית של ClinicFlow
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-3">
            הצטרפות לנסייני הבטא • רישיון Full מלא
          </h1>
          <p className="text-[#64748b] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            קבלו גישה מלאה לכל יכולות ClinicFlow (ללא הגבלת זמן, ללא תשלום וללא כרטיס אשראי) בתמורה למשוב מקצועי.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Benefits & Highlights */}
          <div className="lg:col-span-5 order-2 lg:order-1 space-y-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e2e8f0] shadow-sm">
              <h3 className="text-lg font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0d47a1]" />
                מה כוללת גישת הבטא?
              </h3>
              <ul className="space-y-3.5 text-sm text-[#334155]">
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0f172a]">רישיון Full קבוע:</span> גישה מלאה לכל המודולים הרפואיים והפיננסיים.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0f172a]">ללא עלות וללא התחייבות:</span> עקיפה מוחלטת של מסך התשלום, ללא כרטיס אשראי.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0f172a]">הורדה מיידית:</span> קבלת קובצי ההתקנה העדכניים ל-Windows ול-Mac מיד בסיום.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0f172a]">ערוץ תמיכה ישיר:</span> קשר ישיר עם צוות הפיתוח להצעת שיפורים ובקשות פיצ'רים.
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#0d47a1]/5 to-[#00838f]/5 rounded-3xl p-6 border border-[#0d47a1]/15 text-xs text-[#475569] leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-[#0d47a1] mb-1.5 text-sm">
                <Lock className="w-4 h-4" />
                אבטחת מידע ופרטיות רפואית
              </div>
              כל הנתונים הרפואיים מוצפנים מקומית במחשב שלך בלבד (Zero-Knowledge Architecture). המערכת עובדת באופן מקומי מלא.
            </div>
          </div>

          {/* Right Column: Form Container */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e2e8f0] shadow-xl">
              {/* If user is already logged in */}
              {user ? (
                <div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-6">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-[#0369a1] font-medium">הנך מחובר למערכת</p>
                      <p className="text-sm font-semibold text-[#0f172a]">{user.email}</p>
                    </div>
                  </div>

                  <form onSubmit={handleClaimForLoggedInUser} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#1e293b] mb-1.5">
                        קוד גישה סודי לבטא
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          placeholder="הזן קוד בטא (למשל: clinicflowbeta)"
                          required
                          dir="ltr"
                          className="w-full px-4 py-3 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-center font-mono font-bold tracking-wider text-lg text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                        />
                        <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                      </div>
                      {isPasscodeFormatValid && (
                        <p className="text-xs text-green-600 mt-1.5 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> קוד בטא תקין ומאושר
                        </p>
                      )}
                    </div>

                    {error && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white py-3.5 px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>הפעל רישיון Full לחשבון שלי</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* User is NOT logged in */
                <div>
                  {/* Mode Tabs */}
                  <div className="flex bg-[#f1f5f9] p-1 rounded-2xl mb-6">
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setError(''); }}
                      className={`flex-1 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition cursor-pointer ${
                        mode === 'register'
                          ? 'bg-white text-[#0f172a] shadow-sm'
                          : 'text-[#64748b] hover:text-[#0f172a]'
                      }`}
                    >
                      הרשמת נסיין חדש
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); }}
                      className={`flex-1 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition cursor-pointer ${
                        mode === 'login'
                          ? 'bg-white text-[#0f172a] shadow-sm'
                          : 'text-[#64748b] hover:text-[#0f172a]'
                      }`}
                    >
                      יש לי כבר חשבון קיים
                    </button>
                  </div>

                  {/* Mode: Register */}
                  {mode === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                      {/* Passcode Field */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs md:text-sm font-semibold text-[#1e293b]">
                            קוד גישה סודי לבטא *
                          </label>
                          {isPasscodeFormatValid && (
                            <span className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" /> קוד תקין
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="למשל: clinicflowbeta"
                            required
                            dir="ltr"
                            className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl font-mono font-bold tracking-wider text-base text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                          />
                          <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                      </div>

                      {/* Full Name & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                            שם מלא *
                          </label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="ד״ר ישראל ישראלי"
                            required
                            className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                            מספר טלפון *
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="050-1234567"
                            required
                            dir="ltr"
                            className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                          כתובת אימייל *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="doctor@example.com"
                          required
                          dir="ltr"
                          className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                        />
                      </div>

                      {/* Passwords */}
                      <div>
                        <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                          סיסמה למערכת *
                        </label>
                        <PasswordInput
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="לפחות 8 תווים, אותיות ומספרים"
                          required
                          className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                        />
                        <PasswordStrength value={password} submitted={submitted} />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                          אימות סיסמה *
                        </label>
                        <PasswordInput
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="הזן שוב את הסיסמה"
                          required
                          className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                        />
                      </div>

                      {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white py-3.5 px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>יצירת חשבון וקבלת רישיון Full</span>
                            <ArrowLeft className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Mode: Login existing account */}
                  {mode === 'login' && (
                    <form onSubmit={handleLoginAndClaim} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                          קוד גישה סודי לבטא *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="למשל: clinicflowbeta"
                            required
                            dir="ltr"
                            className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl font-mono font-bold tracking-wider text-base text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                          />
                          <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                          כתובת אימייל *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="doctor@example.com"
                          required
                          dir="ltr"
                          className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                          סיסמה *
                        </label>
                        <PasswordInput
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="הסיסמה הקיימת שלך"
                          required
                          className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition"
                        />
                      </div>

                      {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white py-3.5 px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>התחבר והפעל רישיון Full</span>
                            <ArrowLeft className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
