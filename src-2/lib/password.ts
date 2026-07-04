/**
 * Password policy for ClinicFlow — mirrors the Supabase Auth setting exactly.
 *
 * Supabase "Option B": require lowercase + uppercase + digit (NO mandatory symbol),
 * with a minimum length. Keeping this in one place means the UI (strength meter +
 * checklist) can never drift from what the backend actually accepts — no user is
 * ever shown "strong" and then rejected.
 *
 * If you change the Supabase password policy, change MIN_LENGTH / the checks here too.
 */

export const MIN_LENGTH = 8;

export interface PasswordEval {
  lower: boolean;
  upper: boolean;
  digit: boolean;
  len: boolean;
  /** how many of the three character classes are present (0–3) */
  classes: number;
  /** meter score 0–4: 0 empty, 1 weak/too-short, 2 fair, 3 good, 4 strong (== valid) */
  score: number;
  /** true only when the backend would accept it */
  valid: boolean;
  empty: boolean;
}

export function evaluatePassword(v: string): PasswordEval {
  const lower = /[a-z]/.test(v);
  const upper = /[A-Z]/.test(v);
  const digit = /[0-9]/.test(v);
  const len = v.length >= MIN_LENGTH;
  const classes = [lower, upper, digit].filter(Boolean).length;

  let score = 0;
  if (v.length === 0) score = 0;
  else if (!len) score = 1; // length is a hard gate — capped at "weak" until met
  else score = classes + 1; // 1→2 (fair), 2→3 (good), 3→4 (strong)

  return {
    lower,
    upper,
    digit,
    len,
    classes,
    score,
    valid: len && classes === 3,
    empty: v.length === 0,
  };
}

export function isPasswordValid(v: string): boolean {
  return evaluatePassword(v).valid;
}

/** Cryptographically-random index in [0, max). */
function randInt(max: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % max;
}

/**
 * Generate a memorable-but-valid password: two capitalised Latin words + two digits.
 * Guaranteed to satisfy evaluatePassword().valid (upper + lower + digit, length ≥ 8).
 * Memorable patterns beat random strings for a low-tech audience that needs to write it down.
 */
const WORDS = [
  'Tigel', 'Marom', 'Shani', 'Ravit', 'Nofar', 'Galim', 'Arbel', 'Doron',
  'Yahav', 'Erez', 'Talya', 'Omer', 'Shira', 'Roni', 'Adar', 'Barak',
  'Gefen', 'Lavi', 'Noga', 'Ofir', 'Rotem', 'Sivan', 'Amit', 'Nadav',
];

export function generatePassword(): string {
  let p = '';
  do {
    p = WORDS[randInt(WORDS.length)] + WORDS[randInt(WORDS.length)] + (10 + randInt(90));
  } while (!evaluatePassword(p).valid);
  return p;
}
