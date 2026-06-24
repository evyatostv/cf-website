import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Trash2, ShieldAlert, X, Clock, AlertTriangle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  async function loadPending() {
    if (!user?.id) { setRequest(null); return; }
    const { data } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    setRequest((data as DeletionRequest) ?? null);
  }

  useEffect(() => {
    if (user) loadPending();
  }, [user]);

  async function submitDeletion() {
    if (!user?.email) return;
    setError(null);
    if (!password) { setError('יש להזין סיסמה לאישור'); return; }
    setBusy(true);
    try {
      // Re-authenticate: verify the password before scheduling a destructive action.
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password });
      if (authErr) { setError('הסיסמה שגויה'); setBusy(false); return; }

      const scheduledFor = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { error: insErr } = await supabase.from('deletion_requests').insert({
        user_id: user.id,
        user_email: user.email,
        scheduled_for: scheduledFor,
        status: 'pending',
      });
      if (insErr) { setError(insErr.message || 'אירעה שגיאה'); setBusy(false); return; }

      setPassword('');
      setConfirming(false);
      await loadPending();
    } catch (e) {
      setError((e as Error)?.message || 'אירעה שגיאה');
    } finally {
      setBusy(false);
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
      if (updErr) { setError(updErr.message || 'אירעה שגיאה'); return; }
      await loadPending();
    } finally {
      setBusy(false);
    }
  }

  if (request === undefined) return null; // still loading

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
            <p className="text-sm text-amber-800 mb-4">
              הנתונים שלך יימחקו ב־<strong>{when}</strong>. עד למועד זה ניתן לבטל את הבקשה.
              רשומות תשלום יישמרו (בצורה אנונימית) לצרכים חשבונאיים/חוקיים.
            </p>
            <button
              onClick={cancelDeletion}
              disabled={busy}
              className="bg-white border border-amber-400 text-amber-800 font-medium px-5 py-2.5 rounded-lg hover:bg-amber-100 transition disabled:opacity-60 min-h-[44px]"
            >
              {busy ? 'מבטל…' : 'ביטול בקשת המחיקה'}
            </button>
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
                <button onClick={() => { setConfirming(false); setPassword(''); setError(null); }} aria-label="סגור" className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-red-800 mb-3">
                להמשך, הזן את סיסמתך. הנתונים יימחקו בעוד {GRACE_DAYS} ימים.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הסיסמה שלך"
                autoComplete="current-password"
                className="w-full border border-red-300 rounded-lg px-3 py-2.5 mb-3 outline-none focus:ring-2 focus:ring-red-400 min-h-[44px]"
              />
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={submitDeletion}
                  disabled={busy}
                  className="bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-60 min-h-[44px]"
                >
                  {busy ? 'מאשר…' : 'אשר מחיקה'}
                </button>
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
