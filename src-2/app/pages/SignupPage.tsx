import { useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';
import { motion } from 'motion/react';
import { PasswordInput } from '@/app/components/ui/password-input';

export function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Rate limiting: max 5 signup attempts per minute per IP/email
    if (!checkRateLimit(`signup_${email}`, 5, 60)) {
      setError('ניסיונות רבים מדי. אנא נסה שוב בעוד דקה.');
      return;
    }

    if (!fullName.trim()) {
      setError('נא הזן שם מלא');
      return;
    }

    if (!phone.trim()) {
      setError('נא הזן מספר טלפון');
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להיות באורך 6 תווים לפחות');
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
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('כתובת האימייל הזו כבר רשומה. נסה/י להתחבר.');
        } else {
          setError(signUpError.message || 'שגיאה בהרשמה');
        }
        return;
      }
      if (!data.user) throw new Error('Signup failed');

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d47a1] to-[#00838f] flex items-center justify-center pt-20 pb-20">
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
          <h1 className="text-2xl font-bold text-[#1a2332] mb-3">ברוכים הבאים, {fullName}!</h1>
          <p className="text-[#6b7c93] mb-2">החשבון שלך נוצר בהצלחה.</p>
          <p className="text-[#6b7c93] mb-6">
            לאחר אישור הרכישה תוכל/י להיכנס לדשבורד ולהוריד את האפליקציה.
          </p>
          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-8 py-3 rounded-lg hover:shadow-lg transition font-medium"
          >
            כניסה לדשבורד
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d47a1] to-[#00838f] flex items-center justify-center pt-20 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1a2332] mb-2">הרשמה</h1>
            <p className="text-[#6b7c93]">צור חשבון חדש כדי להתחיל</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2332] mb-2">
                שם מלא
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#e1e6ec] rounded-lg focus:outline-none focus:border-[#0d47a1] transition"
                placeholder="שם מלא"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2332] mb-2">
                מספר טלפון
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#e1e6ec] rounded-lg focus:outline-none focus:border-[#0d47a1] transition"
                placeholder="05X-XXX-XXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2332] mb-2">
                דוא"ל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#e1e6ec] rounded-lg focus:outline-none focus:border-[#0d47a1] transition"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2332] mb-2">
                סיסמה
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2332] mb-2">
                אימות סיסמה
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'יוצר חשבון...' : 'הרשם'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#6b7c93]">
              יש לך כבר חשבון?{' '}
              <Link to="/login" className="text-[#0d47a1] font-medium hover:underline">
                כנס כאן
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
