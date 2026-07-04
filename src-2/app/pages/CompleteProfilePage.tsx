import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '@/lib/auth-errors';
import { motion } from 'motion/react';

// Parse an OAuth error returned in the callback URL. Supabase puts errors in the
// hash fragment (#error=...&error_description=...) and sometimes the query string.
function readOAuthError(): string | null {
  const parse = (s: string) => {
    const p = new URLSearchParams(s.startsWith('#') || s.startsWith('?') ? s.slice(1) : s);
    return p.get('error_description') || p.get('error');
  };
  return parse(window.location.hash) || parse(window.location.search);
}

// Post-signup onboarding, shown once after the account is created (both email and
// Google). The account already exists here, so abandoning this step never loses it.
// We collect:
//   • name / phone — only if missing (Google never gives a phone)
//   • profession, clinic size — light business segmentation (2 taps)
//   • how they heard about us — optional attribution
// These describe the practitioner's BUSINESS, not patients, so they stay clean
// under Amendment 13. A "skip" still marks the user onboarded so we never nag.

const PROFESSIONS = [
  { value: 'doctor', label: 'רופא/ה' },
  { value: 'dentist', label: 'רופא/ת שיניים' },
  { value: 'vet', label: 'וטרינר/ית' },
  { value: 'psychologist', label: 'פסיכולוג/ית' },
  { value: 'psychiatrist', label: 'פסיכיאטר/ית' },
  { value: 'physiotherapist', label: 'פיזיותרפיסט/ית' },
  { value: 'occupational_therapist', label: 'מרפא/ה בעיסוק' },
  { value: 'speech_therapist', label: 'קלינאי/ת תקשורת' },
  { value: 'dietitian', label: 'דיאטן/ית' },
  { value: 'alternative', label: 'רפואה משלימה' },
  { value: 'aesthetics', label: 'קוסמטיקה / רפואה אסתטית' },
  { value: 'other', label: 'אחר' },
];

const CLINIC_SIZES = [
  { value: 'solo', label: 'רק אני' },
  { value: '2-5', label: '2–5 אנשי צוות' },
  { value: '6plus', label: '6 ומעלה' },
];

const HEARD_ABOUT = [
  { value: 'google', label: 'חיפוש בגוגל' },
  { value: 'referral', label: 'המלצה מחבר/ה או קולגה' },
  { value: 'social', label: 'רשתות חברתיות' },
  { value: 'ad', label: 'פרסומת' },
  { value: 'other', label: 'אחר' },
];

const inputCls =
  'w-full px-4 py-3 text-base border border-[#e1e6ec] rounded-lg focus:outline-none focus:border-[#0d47a1] focus:ring-2 focus:ring-[#0d47a1]/20 transition';

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [profession, setProfession] = useState('');
  const [clinicSize, setClinicSize] = useState('');
  const [heardAbout, setHeardAbout] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Catch a failed / denied Google OAuth callback (UERR-022): Google returns
  // ?error=access_denied (or in the hash). Show a Hebrew banner + retry instead
  // of silently bouncing to /login with no explanation.
  useEffect(() => {
    const err = readOAuthError();
    if (err) setOauthError(mapAuthError(err));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (oauthError) return; // don't redirect away from the error message
    if (!user) {
      navigate('/login');
      return;
    }
    const meta = (user.user_metadata as Record<string, any>) || {};
    if (meta.onboarded) {
      // Already completed onboarding — nothing to do.
      navigate('/dashboard');
      return;
    }
    const name = meta.full_name || meta.name || '';
    setFullName(name);
    setPhone(meta.phone || '');
    setNeedsName(!name);
    setNeedsPhone(!meta.phone);
    setReady(true);
  }, [user, loading, navigate, oauthError]);

  // Persist whatever we have. `onboarded` is always set so we never re-prompt.
  // Auth metadata is the source of truth (it drives the guard above); the
  // profiles-table mirror is best-effort so a not-yet-applied migration or a
  // transient DB error never blocks the user from finishing onboarding.
  const persist = async (fields: Record<string, any>) => {
    const { error: updErr } = await supabase.auth.updateUser({
      data: { ...fields, onboarded: true },
    });
    if (updErr) throw updErr;
    if (user) {
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ ...fields, onboarded: true })
        .eq('id', user.id);
      if (profErr) console.error('Failed to mirror profile to profiles table:', profErr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (needsName && !fullName.trim()) {
      setError('נא הזן/י שם מלא');
      return;
    }
    if (needsPhone && !phone.trim()) {
      setError('נא הזן/י מספר טלפון');
      return;
    }
    setSaving(true);
    try {
      await persist({
        full_name: fullName,
        phone,
        profession: profession || null,
        clinic_size: clinicSize || null,
        heard_about: heardAbout || null,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'שגיאה בשמירת הפרטים');
    } finally {
      setSaving(false);
    }
  };

  // Skip still records name/phone (they may be required elsewhere) and marks
  // onboarded so the user isn't asked again — the segmentation is simply left blank.
  const handleSkip = async () => {
    setError('');
    if (needsName && !fullName.trim()) {
      setError('נא הזן/י שם מלא לפני שממשיכים');
      return;
    }
    if (needsPhone && !phone.trim()) {
      setError('נא הזן/י מספר טלפון לפני שממשיכים');
      return;
    }
    setSaving(true);
    try {
      await persist({ full_name: fullName, phone });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'שגיאה בשמירת הפרטים');
    } finally {
      setSaving(false);
    }
  };

  if (oauthError) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-20 pb-20" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-[#1a2332] mb-2">ההתחברות עם Google נכשלה</h1>
          <p className="text-[#6b7c93] mb-6">{oauthError}</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-block bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-8 py-3 rounded-lg hover:shadow-lg transition font-medium"
          >
            חזרה להתחברות
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#e1e6ec] border-t-[#0d47a1] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center pt-20 pb-20" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-[#1a2332] mb-2">כמעט סיימנו</h1>
            <p className="text-[#6b7c93]">
              עוד כמה פרטים קצרים כדי שנתאים את ClinicFlow לתחום שלך.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {needsName && (
              <div>
                <label htmlFor="cp-name" className="block text-sm font-medium text-[#1a2332] mb-2">
                  שם מלא
                </label>
                <input
                  id="cp-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className={inputCls}
                  placeholder="שם מלא"
                />
              </div>
            )}

            {needsPhone && (
              <div>
                <label htmlFor="cp-phone" className="block text-sm font-medium text-[#1a2332] mb-2">
                  מספר טלפון
                </label>
                <input
                  id="cp-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  className={inputCls}
                  placeholder="05X-XXX-XXXX"
                />
              </div>
            )}

            <div>
              <label htmlFor="cp-profession" className="block text-sm font-medium text-[#1a2332] mb-2">
                תחום העיסוק
              </label>
              <select
                id="cp-profession"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className={inputCls}
              >
                <option value="">בחר/י תחום…</option>
                {PROFESSIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cp-clinic-size" className="block text-sm font-medium text-[#1a2332] mb-2">
                גודל המרפאה
              </label>
              <select
                id="cp-clinic-size"
                value={clinicSize}
                onChange={(e) => setClinicSize(e.target.value)}
                className={inputCls}
              >
                <option value="">בחר/י…</option>
                {CLINIC_SIZES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cp-heard" className="block text-sm font-medium text-[#1a2332] mb-2">
                איך הגעת אלינו? <span className="text-[#9aa7b8] font-normal">(לא חובה)</span>
              </label>
              <select
                id="cp-heard"
                value={heardAbout}
                onChange={(e) => setHeardAbout(e.target.value)}
                className={inputCls}
              >
                <option value="">בחר/י…</option>
                {HEARD_ABOUT.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3.5 rounded-lg hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
            >
              {saving ? 'שומר/ת...' : 'סיום והמשך'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="mt-3 w-full text-sm text-[#6b7c93] hover:text-[#0d47a1] transition disabled:opacity-60"
          >
            דלג/י לעכשיו
          </button>

          <p className="mt-5 text-center text-xs text-[#9aa7b8] leading-relaxed">
            המידע משמש רק כדי להתאים לך את המערכת. איננו אוספים מידע על מטופלים —
            הנתונים הרפואיים נשארים במחשב שלך בלבד.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
