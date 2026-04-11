import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/update-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d47a1] to-[#00838f] flex items-center justify-center pt-20 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#1a2332] mb-2">נשלח מייל איפוס</h2>
              <p className="text-[#6b7c93] mb-6">
                שלחנו לך קישור לאיפוס הסיסמה לכתובת <strong>{email}</strong>.<br />
                בדוק את תיבת הדואר שלך.
              </p>
              <Link to="/login" className="text-[#0d47a1] font-medium hover:underline">
                חזרה לכניסה
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#1a2332] mb-2">איפוס סיסמה</h1>
                <p className="text-[#6b7c93]">הזן את כתובת הדוא"ל שלך ונשלח לך קישור לאיפוס</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
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
