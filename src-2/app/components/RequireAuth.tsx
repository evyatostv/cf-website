import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { MfaGate } from '@/app/components/MfaGate';

// Central client-side guard for protected routes. Consolidates the checks that
// were previously scattered (and inconsistent) across pages:
//   - not logged in       → /login?redirect=<here>
//   - not onboarded        → /complete-profile      (requireOnboarded)
//   - 2FA enabled but aal1 → TOTP challenge           (requireMfa, via MfaGate)
// NOTE: this is UX/routing only. The real backstop is Supabase RLS + edge-function
// JWT/AAL checks — a determined attacker with a stolen token isn't stopped here.
export function RequireAuth({
  children,
  requireOnboarded = false,
  requireMfa = false,
}: {
  children: React.ReactNode;
  requireOnboarded?: boolean;
  requireMfa?: boolean;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const needsOnboarding = requireOnboarded && !!user && !user.user_metadata?.onboarded;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const here = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(here)}`, { replace: true });
      return;
    }
    if (needsOnboarding) {
      navigate('/complete-profile', { replace: true });
    }
  }, [user, loading, needsOnboarding, navigate, location.pathname, location.search]);

  // Hold rendering while resolving / redirecting so protected content never flashes.
  if (loading || !user || needsOnboarding) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#e1e6ec] border-t-[#0d47a1] rounded-full animate-spin" />
      </div>
    );
  }

  return requireMfa ? <MfaGate>{children}</MfaGate> : <>{children}</>;
}
