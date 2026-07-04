import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

// Google's official 4-color "G" mark.
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * "התחברות עם Google" button + an "או" divider. Uses the existing Supabase
 * auth (signInWithGoogle) — no new auth system. On success Supabase redirects
 * to /dashboard; on failure we surface the message via onError.
 * Hebrew copy is gender-neutral so it addresses both male and female users.
 */
export function GoogleSignInButton({
  label = 'התחברות עם Google',
  onError,
}: {
  label?: string;
  onError?: (message: string) => void;
}) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Browser redirects to Google; nothing else runs on success.
    } catch (err: any) {
      onError?.(err?.message || 'שגיאה בהתחברות עם Google');
      setLoading(false);
    }
  };

  return (
    <div dir="rtl">
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#e1e6ec]" />
        <span className="text-sm text-[#6b7c93]">או</span>
        <div className="h-px flex-1 bg-[#e1e6ec]" />
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-[#e1e6ec] rounded-lg py-3 font-medium text-[#1a2332] hover:bg-[#f5f7f9] transition disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
      >
        <GoogleIcon />
        {loading ? 'מתחבר/ת...' : label}
      </button>
    </div>
  );
}
