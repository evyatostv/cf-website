// Central Supabase/auth error → Hebrew message map.
//
// Supabase (and its edge functions) return English messages/codes. The whole
// site is Hebrew RTL, so every auth / payment / delete error is routed through
// mapAuthError() to get a friendly Hebrew string, with a Hebrew fallback for
// anything we don't explicitly recognise.

const HEBREW_FALLBACK = 'אירעה שגיאה. נסו שוב מאוחר יותר.';

// Keyed by a lowercased substring found in Supabase's `code` or `message`.
// Order matters only in that the first match wins.
const RULES: Array<{ match: (s: string) => boolean; he: string }> = [
  {
    match: (s) => s.includes('invalid login credentials') || s.includes('invalid_credentials'),
    he: 'האימייל או הסיסמה שגויים.',
  },
  {
    match: (s) => s.includes('email not confirmed') || s.includes('email_not_confirmed'),
    he: 'האימייל עדיין לא אומת. בדקו את תיבת הדואר (וגם בספאם) ולחצו על הקישור ששלחנו.',
  },
  {
    match: (s) => s.includes('user already registered') || s.includes('already registered') || s.includes('user_already_exists'),
    he: 'כתובת האימייל הזו כבר רשומה. נסו להתחבר.',
  },
  {
    match: (s) => s.includes('password should be') || s.includes('weak_password') || s.includes('password is too'),
    he: 'הסיסמה חלשה מדי. בחרו סיסמה חזקה יותר.',
  },
  {
    match: (s) => s.includes('rate limit') || s.includes('too many requests') || s.includes('over_request_rate_limit') || s.includes('too_many'),
    he: 'יותר מדי ניסיונות. אנא המתינו רגע ונסו שוב.',
  },
  {
    match: (s) => s.includes('captcha'),
    he: 'אימות ה-CAPTCHA נכשל. רעננו את הדף ונסו שוב.',
  },
  {
    match: (s) => s.includes('jwt') || s.includes('token has expired') || (s.includes('session') && s.includes('expired')) || s.includes('session_expired'),
    he: 'פג תוקף ההתחברות — אנא התחברו מחדש.',
  },
  {
    match: (s) => s.includes('invalid or expired') || s.includes('otp_expired') || s.includes('token_expired'),
    he: 'הקישור פג תוקף או אינו תקין. בקשו קישור חדש.',
  },
  {
    match: (s) => s.includes('not found') || s.includes('user_not_found'),
    he: 'לא נמצא חשבון תואם.',
  },
  {
    match: (s) => s.includes('network') || s.includes('failed to fetch') || s.includes('fetch failed'),
    he: 'בעיית תקשורת. בדקו את החיבור לאינטרנט ונסו שוב.',
  },
  {
    match: (s) => s.includes('access_denied') || s.includes('consent') || s.includes('cancelled') || s.includes('canceled'),
    he: 'ההתחברות בוטלה. נסו שוב.',
  },
];

/**
 * Map a Supabase / edge-function error (or a raw string) to a Hebrew message.
 * Accepts anything: an Error, a Supabase error object ({ message, code }), a
 * plain string, or a nullish value.
 */
export function mapAuthError(err: unknown): string {
  if (!err) return HEBREW_FALLBACK;

  let raw = '';
  if (typeof err === 'string') {
    raw = err;
  } else if (typeof err === 'object') {
    const e = err as { message?: unknown; code?: unknown; error_description?: unknown; error?: unknown };
    raw = [e.code, e.message, e.error_description, e.error]
      .filter((v) => typeof v === 'string')
      .join(' ');
  }

  const s = raw.toLowerCase().trim();
  if (!s) return HEBREW_FALLBACK;

  for (const rule of RULES) {
    if (rule.match(s)) return rule.he;
  }

  // If the message already looks Hebrew, trust it (edge functions sometimes
  // return Hebrew directly). Otherwise fall back so we never show English.
  if (/[֐-׿]/.test(raw)) return raw;
  return HEBREW_FALLBACK;
}
