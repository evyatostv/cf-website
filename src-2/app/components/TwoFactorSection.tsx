import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ShieldAlert, X } from 'lucide-react';

// Two-factor authentication (TOTP authenticator app) via Supabase MFA.
// Enable → scan QR / enter secret in an authenticator app → confirm a 6-digit
// code. Once enabled, login requires the code (enforced by <MfaGate>).
export function TwoFactorSection() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  const [enrolling, setEnrolling] = useState(false);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [enrollFactorId, setEnrollFactorId] = useState('');
  const [code, setCode] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const retriedRef = useRef(false);

  async function refresh() {
    setLoading(true);
    setLoadFailed(false);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      // Transient load failures happen (e.g. a not-yet-refreshed session). Retry
      // once silently; only if it STILL fails do we give up — and then we hide
      // the card entirely rather than showing a scary error, so the dashboard
      // stays clean (the 2FA state is simply unknown, not necessarily off).
      if (!retriedRef.current) {
        retriedRef.current = true;
        setTimeout(() => { refresh(); }, 2000);
        return; // keep the quiet loading spinner while we retry
      }
      setLoadFailed(true);
      setLoading(false);
      return;
    }
    retriedRef.current = false;
    // Only a VERIFIED factor counts as "2FA on". A lingering unverified factor
    // (abandoned enroll) must not show the card as active — that would present a
    // login challenge the user can never satisfy (soft lockout).
    const verified = (data?.totp || []).find((f: any) => f.status === 'verified');
    if (verified) {
      setEnabled(true);
      setFactorId(verified.id);
    } else {
      setEnabled(false);
      setFactorId(null);
    }
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function startEnroll() {
    setError('');
    setBusy(true);
    try {
      // Clean up any lingering unverified factors from an abandoned attempt.
      const { data: u } = await supabase.auth.getUser();
      const stale = (u?.user?.factors || []).filter(
        (f: any) => f.factor_type === 'totp' && f.status !== 'verified',
      );
      for (const f of stale) await supabase.auth.mfa.unenroll({ factorId: f.id });

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `ClinicFlow ${Date.now()}`,
      });
      if (error) throw error;
      setEnrollFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(true);
    } catch (e: any) {
      setError(e?.message || 'שגיאה בהפעלת אימות דו-שלבי');
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnroll() {
    setError('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollFactorId,
        code: code.trim(),
      });
      if (error) throw error;
      setEnrolling(false);
      setCode('');
      setQr('');
      setSecret('');
      await refresh();
    } catch {
      setError('הקוד שגוי או שפג תוקפו. נסו שוב.');
    } finally {
      setBusy(false);
    }
  }

  function cancelEnroll() {
    setEnrolling(false);
    setCode('');
    setQr('');
    setSecret('');
    setError('');
  }

  async function disable() {
    if (!factorId) return;
    setError('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'שגיאה בכיבוי אימות דו-שלבי');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div dir="rtl" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="w-6 h-6 border-[3px] border-[#e1e6ec] border-t-[#0d47a1] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Load failed after a silent retry: hide the card entirely ─────────────
  // We can't confirm the 2FA state, so rather than show a scary error we render
  // nothing. It reappears automatically on the next dashboard load.
  if (loadFailed) return null;

  // ── Enabled ──────────────────────────────────────────────────────────────
  if (enabled) {
    return (
      <div dir="rtl" className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">אימות דו-שלבי פעיל</h3>
            <p className="text-sm text-gray-600 mb-4">
              בכל כניסה תתבקש/י להזין קוד בן 6 ספרות מאפליקציית האימות שלך. שכבת אבטחה נוספת לחשבון.
            </p>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button
              onClick={disable}
              disabled={busy}
              className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-60 min-h-[44px]"
            >
              {busy ? 'מכבה…' : 'כיבוי אימות דו-שלבי'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Enrolling ────────────────────────────────────────────────────────────
  if (enrolling) {
    return (
      <div dir="rtl" className="bg-white rounded-2xl shadow-sm border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">הגדרת אימות דו-שלבי</h3>
          <button onClick={cancelEnroll} aria-label="סגור" className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ol className="text-sm text-gray-600 mb-4 space-y-1 list-decimal pr-5">
          <li>פתחו אפליקציית אימות (Google Authenticator, Authy וכו').</li>
          <li>סרקו את קוד ה-QR, או הזינו את המפתח ידנית.</li>
          <li>הזינו את הקוד בן 6 הספרות שהאפליקציה מציגה.</li>
        </ol>
        {qr && (
          <div className="flex justify-center mb-3">
            <img src={qr} alt="QR code" width={180} height={180} className="border border-gray-200 rounded-lg" />
          </div>
        )}
        {secret && (
          <p className="text-center text-xs text-gray-500 mb-4">
            מפתח ידני: <code className="font-mono text-gray-700" style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{secret}</code>
          </p>
        )}
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="w-full text-center tracking-[0.4em] font-mono text-lg border border-gray-300 rounded-lg px-3 py-2.5 mb-3 outline-none focus:ring-2 focus:ring-[#0d47a1]/30 min-h-[44px]"
          style={{ direction: 'ltr' }}
        />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={verifyEnroll}
            disabled={busy || code.length !== 6}
            className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium px-5 py-2.5 rounded-lg hover:shadow-lg transition disabled:opacity-60 min-h-[44px]"
          >
            {busy ? 'מאמת…' : 'אימות והפעלה'}
          </button>
          <button
            onClick={cancelEnroll}
            className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
          >
            ביטול
          </button>
        </div>
      </div>
    );
  }

  // ── Disabled (offer to enable) ────────────────────────────────────────────
  return (
    <div dir="rtl" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 text-[#0d47a1] shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">אימות דו-שלבי (2FA)</h3>
          <p className="text-sm text-gray-600 mb-4">
            הוסף/י שכבת הגנה: מלבד הסיסמה, בכל כניסה תתבקש/י להזין קוד חד-פעמי מאפליקציית אימות בטלפון.
          </p>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            onClick={startEnroll}
            disabled={busy}
            className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium px-5 py-2.5 rounded-lg hover:shadow-lg transition disabled:opacity-60 min-h-[44px]"
          >
            {busy ? 'רגע…' : 'הפעלת אימות דו-שלבי'}
          </button>
        </div>
      </div>
    </div>
  );
}
