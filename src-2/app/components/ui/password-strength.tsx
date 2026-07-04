import { evaluatePassword, MIN_LENGTH } from '@/lib/password';

/**
 * Strength meter + live requirements checklist for a "create password" flow.
 * Pure display — pass the current password value and (optionally) whether the
 * form was submitted so unmet rows can turn red.
 *
 * Design notes:
 *  - The meter is scored 1:1 with the Supabase policy (see lib/password.ts), so
 *    "חזקה / green" only appears when the backend would accept.
 *  - Requirements spell out "באנגלית" and show literal (a-z)/(A-Z) ranges — Hebrew
 *    has no case, which is the single biggest stuck-point for this audience.
 *  - Never color-only: every row also carries an icon shape (○ ✓ ✕).
 */

const LEVEL_WORDS = ['', 'חלשה', 'בינונית', 'טובה', 'חזקה'];
const LEVEL_COLORS = ['', '#c62828', '#b26a00', '#1565c0', '#2e7d32'];
const SEG_EMPTY = '#d6dce5';

type ReqKey = 'len' | 'lower' | 'upper' | 'digit';

const ROWS: { key: ReqKey; label: React.ReactNode }[] = [
  { key: 'len', label: <>{`לפחות ${MIN_LENGTH} תווים`}</> },
  { key: 'lower', label: <>אות קטנה באנגלית <bdi dir="ltr">(a-z)</bdi></> },
  { key: 'upper', label: <>אות גדולה באנגלית <bdi dir="ltr">(A-Z)</bdi></> },
  { key: 'digit', label: <>ספרה אחת <bdi dir="ltr">(0-9)</bdi></> },
];

function CheckIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}
function XIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6m0-6-6 6" />
    </svg>
  );
}
function CircleIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function PasswordStrength({ value, submitted = false }: { value: string; submitted?: boolean }) {
  const r = evaluatePassword(value);
  const met: Record<ReqKey, boolean> = { len: r.len, lower: r.lower, upper: r.upper, digit: r.digit };

  return (
    <div dir="rtl" className="mt-3">
      {/* strength meter — hidden until the user starts typing */}
      {!r.empty && (
        <div className="mb-4">
          <div className="flex flex-row-reverse gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[7px] flex-1 rounded-[4px] transition-colors duration-300"
                style={{ background: i < r.score ? LEVEL_COLORS[r.score] : SEG_EMPTY }}
              />
            ))}
          </div>
          <div className="mt-2 text-[13px] font-bold">
            <span className="text-[#6b7c93] font-semibold">חוזק הסיסמה: </span>
            <span role="status" aria-live="polite" style={{ color: LEVEL_COLORS[r.score] }}>
              {LEVEL_WORDS[r.score]}
            </span>
          </div>
        </div>
      )}

      {/* requirements checklist — always visible */}
      <p className="text-[13px] font-bold text-[#1a2332] mb-3">הסיסמה צריכה לכלול:</p>
      <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
        {ROWS.map(({ key, label }) => {
          const isMet = met[key];
          const state: 'met' | 'err' | 'unmet' | 'idle' = isMet
            ? 'met'
            : submitted
              ? 'err'
              : r.empty
                ? 'idle'
                : 'unmet';
          const textColor =
            state === 'met' ? '#6b7c93' : state === 'err' ? '#b3261e' : state === 'unmet' ? '#1a2332' : '#6b7c93';
          const weight = state === 'unmet' || state === 'err' ? 600 : 400;
          return (
            <li key={key} className="flex items-center gap-2.5 text-[14.5px] transition-colors">
              <span className="shrink-0 leading-none">
                {state === 'met' ? (
                  <CheckIcon color="#1b7a3d" />
                ) : state === 'err' ? (
                  <XIcon color="#b3261e" />
                ) : (
                  <CircleIcon color={state === 'unmet' ? '#9aa6b4' : '#c3ccd6'} />
                )}
              </span>
              <span style={{ color: textColor, fontWeight: weight }}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
