import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '@/lib/auth-errors';
import { downloadUserData } from '@/lib/data-export';
import { Trash2, ShieldAlert, X, Clock, AlertTriangle, Download } from 'lucide-react';

type DeletionRequest = {
  id: string;
  user_id: string;
  user_email: string;
  requested_at: string;
  scheduled_for: string;
  status: string;
};

const GRACE_DAYS = 7;

export function DeleteAccountSection() {
  const { user } = useAuth();
  const [request, setRequest] = useState<DeletionRequest | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [dlBusy, setDlBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  async function handleDownloadData() {
    if (!user) return;
    setDlBusy(true);
    setError(null);
    try {
      await downloadUserData(user);
    } catch {
      setError('הורדת המידע נכשלה. נסו שוב.');
    } finally {
      setDlBusy(false);
    }
  }

  // Deleting requires re-authentication. If the account has a Google identity we
  // re-auth via Google (most reliable — a Google user may not have or remember a
  // password even when an 'email' identity also exists on the same address).
  // Pure email/password accounts re-enter their password. We read every source of
  // provider info (app_metadata + linked identities) so mixed accounts are caught.
  const providerSet = new Set<string>([
    ...(((user?.app_metadata?.providers as string[] | undefined) ?? [])),
    ...(user?.app_metadata?.provider ? [String(user.app_metadata.provider)] : []),
    ...((user?.identities ?? []).map((i: any) => i.provider as string)),
  ]);
  const useGoogleReauth = providerSet.has('google');
  const PENDING_KEY = 'cf_pending_delete_at';

  async function loadPending() {
    if (!user?.id) { setRequest(null); return; }
    const { data, error: loadErr } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (loadErr) {
      // Don't silently show the delete UI as if nothing is pending — a load
      // failure could hide an existing scheduled deletion (UERR-029).
      setLoadError(true);
      setRequest(null);
      return;
    }
    setLoadError(false);
    setRequest((data as DeletionRequest) ?? null);
  }

  useEffect(() => {
    if (user) loadPending();
  }, [user]);

  // Insert the scheduled deletion once identity is (re-)verified. Self-contained
  // (takes uid/email) so it also works from the auth listener after re-login.
  async function scheduleDeletion(uid: string, email: string): Promise<boolean> {
    const scheduledFor = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error: insErr } = await supabase.from('deletion_requests').insert({
      user_id: uid,
      user_email: email,
      scheduled_for: scheduledFor,
      status: 'pending',
    });
    if (insErr) { setError(mapAuthError(insErr)); return false; }
    setPassword('');
    setConfirming(false);
    const { data } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('user_id', uid)
      .eq('status', 'pending')
      .maybeSingle();
    setRequest((data as DeletionRequest) ?? null);
    return true;
  }

  // Complete a Google re-login deletion on RETURN — mount-based, NOT event-based.
  // DashboardPage only mounts this component after the session resolves, so a live
  // SIGNED_IN event fires before we're listening and would be missed. Instead:
  // when we come back with a fresh pending flag AND a NEWER last_sign_in_at than
  // when we left, the user genuinely re-authenticated → finish the deletion. If
  // they cancelled the Google login, last_sign_in_at is unchanged → nothing happens.
  useEffect(() => {
    if (!user) return;
    let flag: { ts: number; prevSignIn?: string } | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) flag = JSON.parse(raw);
    } catch {}
    if (!flag) return;

    const fresh = Date.now() - flag.ts < 5 * 60 * 1000;
    const reAuthed = !!user.last_sign_in_at && user.last_sign_in_at !== flag.prevSignIn;
    if (fresh && reAuthed) {
      try { sessionStorage.removeItem(PENDING_KEY); } catch {}
      setBusy(true);
      scheduleDeletion(user.id, user.email || '').finally(() => setBusy(false));
    } else if (fresh && !reAuthed) {
      // Came back without re-authenticating → they cancelled the Google login.
      // Give explicit feedback instead of silently doing nothing (UERR-029).
      try { sessionStorage.removeItem(PENDING_KEY); } catch {}
      setError('האימות בוטל — החשבון לא נמחק.');
    } else if (!fresh) {
      try { sessionStorage.removeItem(PENDING_KEY); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Password accounts: re-enter the password (this IS logging in again).
  async function submitDeletionPassword() {
    if (!user?.id || !user?.email) return;
    setError(null);
    if (!password) { setError('יש להזין סיסמה לאישור'); return; }
    setBusy(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password });
      if (authErr) { setError('הסיסמה שגויה'); setBusy(false); return; }
      await scheduleDeletion(user.id, user.email);
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  // Google accounts: log in again with Google; the return effect above completes
  // it. We stash the current last_sign_in_at so we can confirm a real re-login.
  async function startReloginDelete() {
    setError(null);
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ts: Date.now(), prevSignIn: user?.last_sign_in_at }));
    } catch {}
    const { error: oErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { prompt: 'login' },
      },
    });
    if (oErr) {
      setError(mapAuthError(oErr));
      try { sessionStorage.removeItem(PENDING_KEY); } catch {}
    }
  }

  async function cancelDeletion() {
    if (!request) return;
    setBusy(true);
    setError(null);
    try {
      const { error: updErr } = await supabase
        .from('deletion_requests')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('id', request.id);
      if (updErr) { setError(mapAuthError(updErr)); return; }
      await loadPending();
    } finally {
      setBusy(false);
    }
  }

  if (request === undefined) return null; // still loading

  // Couldn't determine whether a deletion is already pending — don't show the
  // delete flow (it might hide an existing scheduled deletion). Offer a retry.
  if (loadError) {
    return (
      <div dir="rtl" className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">לא ניתן לטעון את סטטוס מחיקת החשבון</h3>
            <p className="text-sm text-gray-600 mb-4">בדקו את החיבור לאינטרנט ונסו שוב.</p>
            <button
              onClick={() => { setRequest(undefined); loadPending(); }}
              disabled={busy}
              className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-60 min-h-[44px]"
            >
              נסה/י שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending deletion: show status + cancel ───────────────────────────────
  if (request) {
    const when = new Date(request.scheduled_for).toLocaleDateString('he-IL', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    return (
      <div dir="rtl" className="bg-amber-50 rounded-2xl border border-amber-300 p-6">
        <div className="flex items-start gap-3">
          <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 mb-1">מחיקת הנתונים מתוזמנת</h3>
            <p className="text-sm text-amber-800 mb-2">
              הנתונים שלך יימחקו אוטומטית ב־<strong>{when}</strong>. עד למועד זה ניתן לבטל את הבקשה.
              רשומות תשלום יישמרו (בצורה אנונימית) לצרכים חשבונאיים/חוקיים.
            </p>
            <p className="text-sm text-amber-800 mb-4">
              מומלץ <strong>להוריד עותק של המידע שלך</strong> לפני המחיקה.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadData}
                disabled={dlBusy}
                className="inline-flex items-center gap-2 bg-white border border-amber-400 text-amber-800 font-medium px-5 py-2.5 rounded-lg hover:bg-amber-100 transition disabled:opacity-60 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                {dlBusy ? 'מכין/ה קובץ…' : 'הורדת המידע שלי'}
              </button>
              <button
                onClick={cancelDeletion}
                disabled={busy}
                className="bg-white border border-amber-400 text-amber-800 font-medium px-5 py-2.5 rounded-lg hover:bg-amber-100 transition disabled:opacity-60 min-h-[44px]"
              >
                {busy ? 'מבטל/ת…' : 'ביטול בקשת המחיקה'}
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── No pending request: the delete flow ──────────────────────────────────
  return (
    <div dir="rtl" className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">מחיקת הנתונים שלי</h3>
          <p className="text-sm text-gray-600 mb-4">
            מחיקת חשבונך והנתונים האישיים שלנו עליך (התחברות, רישוי וגישה, פניות).
            הפעולה מתבצעת לאחר <strong>{GRACE_DAYS} ימים</strong>, וניתן לבטלה בהתחברות מחדש עד אז.
            הנתונים הרפואיים של המרפאה שמורים מקומית במחשב שלך בלבד ואינם נמחקים מכאן.
          </p>

          {!confirming ? (
            <button
              onClick={() => { setConfirming(true); setError(null); }}
              className="inline-flex items-center gap-2 bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-red-700 transition min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              מחיקת הנתונים שלי
            </button>
          ) : (
            <div className="border border-red-200 rounded-xl p-4 bg-red-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-800 font-semibold">
                  <AlertTriangle className="w-5 h-5" />
                  אישור מחיקה
                </div>
                <button onClick={() => { setConfirming(false); setPassword(''); setError(null); }} aria-label="סגור/י" className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-red-800 mb-3">
                {useGoogleReauth
                  ? <>לאישור המחיקה יש <strong>להתחבר מחדש עם Google</strong>. הנתונים יימחקו בעוד {GRACE_DAYS} ימים.</>
                  : <>להמשך, הזן/י את סיסמתך (התחברות מחדש). הנתונים יימחקו בעוד {GRACE_DAYS} ימים.</>}
              </p>
              {!useGoogleReauth && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הסיסמה שלך"
                  autoComplete="current-password"
                  className="w-full border border-red-300 rounded-lg px-3 py-2.5 mb-3 outline-none focus:ring-2 focus:ring-red-400 min-h-[44px]"
                />
              )}
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
              <div className="flex gap-2">
                {useGoogleReauth ? (
                  <button
                    onClick={startReloginDelete}
                    disabled={busy}
                    className="bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-60 min-h-[44px]"
                  >
                    {busy ? 'ממתין/ה…' : 'התחבר/י מחדש עם Google ואשר/י מחיקה'}
                  </button>
                ) : (
                  <button
                    onClick={submitDeletionPassword}
                    disabled={busy}
                    className="bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-60 min-h-[44px]"
                  >
                    {busy ? 'מאשר/ת…' : 'אשר/י מחיקה'}
                  </button>
                )}
                <button
                  onClick={() => { setConfirming(false); setPassword(''); setError(null); }}
                  className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
