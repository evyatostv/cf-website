import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'motion/react';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1a2332] mb-2">כניסה</h1>
            <p className="text-[#6b7c93]">הזן את פרטיך כדי להיכנס לחשבונך</p>
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

            <div>
              <label className="block text-sm font-medium text-[#1a2332] mb-2">
                סיסמה
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#e1e6ec] rounded-lg focus:outline-none focus:border-[#0d47a1] transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'כניסה...' : 'כנס'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#6b7c93]">
              אין לך חשבון?{' '}
              <Link to="/signup" className="text-[#0d47a1] font-medium hover:underline">
                הירשם עכשיו
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
