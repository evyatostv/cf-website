import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck } from 'lucide-react';
import { CONTACT_EMAIL } from '@/app/config/site';

// Wrap protected content. If the user has 2FA enabled but the current session is
// only at aal1 (password/Google verified, but not the 2FA code yet), show the
// code challenge before rendering children. Fails CLOSED on error (UERR-030,
// security): if we can't verify the assurance level or list factors we must NOT
// render protected content — that would let a transient glitch bypass 2FA. The
// user sees a retry screen instead.
export function MfaGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'ok' | 'need' | 'error'>('checking');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);

  async function check() {
    setState('checking');
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      // Fail CLOSED: an AAL lookup error is unsafe to treat as "no 2FA needed".
      if (error || !data) { setState('error'); return; }
      if (data.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
        const { data: f, error: factorsError } = await supabase.auth.mfa.listFactors();
        // Fail CLOSED: if we can't read the factor list while 2FA is pending, block.
        if (factorsError) { setState('error'); return; }
        const totp = (f?.totp || []).find((x: any) => x.status === 'verified');
        if (totp) { setFactorId(totp.id); setState('need'); return; }
      }
      setState('ok');
    } catch {
      setState('error');
    }
  }

  useEffect(() => { check(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (error) throw error;
      setCode('');
      setState('ok');
    } catch {
      setError('קוד שגוי או שפג תוקפו. נסו שוב.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'checking') {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#e1e6ec] border-t-[#0d47a1] rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-20 pb-20" dir="rtl">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 bg-[#0d47a1]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-[#0d47a1]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a2332] mb-2">לא הצלחנו לאמת את זהותך</h1>
            <p className="text-[#6b7c93] mb-6">
              אירעה שגיאה בבדיקת האימות הדו-שלבי. מטעמי אבטחה לא ניתן להמשיך עד שהבדיקה תושלם. בדקו את החיבור לאינטרנט ונסו שוב.
            </p>
            <button
              type="button"
              onClick={() => check()}
              className="w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3.5 rounded-lg hover:shadow-lg transition min-h-[48px]"
            >
              נסה/י שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'need') {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-20 pb-20" dir="rtl">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 bg-[#0d47a1]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-[#0d47a1]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a2332] mb-2">אימות דו-שלבי</h1>
            <p className="text-[#6b7c93] mb-6">הזן/י את הקוד בן 6 הספרות מאפליקציית האימות שלך.</p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <form onSubmit={submit}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] font-mono text-xl border border-[#e1e6ec] rounded-lg px-3 py-3 mb-4 outline-none focus:ring-2 focus:ring-[#0d47a1]/30 min-h-[52px]"
                style={{ direction: 'ltr' }}
              />
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3.5 rounded-lg hover:shadow-lg transition disabled:opacity-60 min-h-[48px]"
              >
                {busy ? 'מאמת…' : 'אימות'}
              </button>
            </form>

            {/* Lost-device recovery. Supabase's TOTP MFA API has no self-serve
                backup codes, so recovery is a manual support flow. DEV TODO:
                add a server endpoint (service-role) to reset a locked-out
                user's MFA after identity verification. */}
            {!showRecovery ? (
              <button
                type="button"
                onClick={() => setShowRecovery(true)}
                className="mt-5 text-sm text-[#0d47a1] hover:underline"
              >
                איבדת את הטלפון / אפליקציית האימות?
              </button>
            ) : (
              <div className="mt-5 text-sm text-[#6b7c93] leading-relaxed border-t border-[#e1e6ec] pt-4 text-right">
                אם אין לך גישה לאפליקציית האימות, פנה/י אלינו לשחזור הגישה ונאמת את זהותך:
                <br />
                <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('שחזור אימות דו-שלבי')}`} className="font-medium text-[#0d47a1] hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
