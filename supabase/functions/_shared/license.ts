/**
 * ClinicFlow · license-key issuance.
 *
 * A license key is a readable, offline-friendly activation string of the form
 *   CF-<PLAN>-XXXX-XXXX-XXXX
 * where <PLAN> is the uppercased plan abbreviation (BASIC / PRO / FULL) and each
 * XXXX group is 4 crypto-random base32-ish chars (Crockford alphabet, no
 * ambiguous 0/O/1/I/L/U). It is generated ONCE per user at first purchase and
 * then reused for every webhook retry — see getOrCreateLicenseKey.
 */

// deno-lint-ignore no-explicit-any
type SupabaseAdmin = any;

/** Crockford-ish alphabet: no 0/O/1/I/L/U to keep keys human-readable. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Plan slug → short uppercase abbreviation embedded in the key. */
const PLAN_ABBREV: Record<string, string> = {
  basic: "BASIC",
  professional: "PRO",
  full: "FULL",
};

function planAbbrev(plan: string): string {
  if (PLAN_ABBREV[plan]) return PLAN_ABBREV[plan];
  const cleaned = (plan || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return cleaned || "GEN";
}

/** One random group of `len` chars drawn uniformly from ALPHABET. */
function randomGroup(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Generate a fresh readable license key for a plan, e.g. `CF-FULL-7Q2M-4K9X-A1D3`.
 * Uses crypto.getRandomValues; three 4-char groups → ~57 bits of entropy.
 */
export function generateLicenseKey(plan: string): string {
  return `CF-${planAbbrev(plan)}-${randomGroup(4)}-${randomGroup(4)}-${randomGroup(4)}`;
}

/**
 * Return the user's existing license key if one is already stored (idempotent —
 * a returning webhook NEVER regenerates), otherwise generate one, persist it on
 * `user_access`, and return it.
 *
 * Lookup is by `user_id` when a userId is given, else by `email`. The write
 * targets the same row grantAccess just upserted.
 */
export async function getOrCreateLicenseKey(
  supabaseAdmin: SupabaseAdmin,
  identity: { userId?: string | null; email?: string | null },
  plan: string,
): Promise<string> {
  const { userId, email } = identity;
  const byUser = !!userId;

  const applyFilter = (q: SupabaseAdmin) =>
    byUser ? q.eq("user_id", userId) : q.eq("email", email);

  // 1 · Existing key wins — never regenerate.
  const { data: existing } = await applyFilter(
    supabaseAdmin.from("user_access").select("license_key"),
  ).maybeSingle();

  if (existing?.license_key) {
    return existing.license_key as string;
  }

  // 2 · Generate + persist ATOMICALLY. BE-018: guard the UPDATE with
  // `.is("license_key", null)` so only the FIRST concurrent webhook actually
  // writes a key; a racing second webhook's UPDATE matches 0 rows (the column is
  // no longer null) and returns nothing. Both then re-read the persisted value,
  // so they converge on the SAME key instead of last-writer-wins minting two.
  const key = generateLicenseKey(plan);
  const { data: written, error } = await applyFilter(
    supabaseAdmin
      .from("user_access")
      .update({ license_key: key })
      .is("license_key", null),
  ).select("license_key");

  // Our write won iff a row came back with our key.
  const wonRace = Array.isArray(written) &&
    written.some((r: { license_key?: string }) => r?.license_key === key);
  if (wonRace && !error) {
    return key;
  }

  // We lost the race (0 rows updated) OR the write errored — re-read to pick up
  // whatever the winning writer persisted.
  const { data: reread } = await applyFilter(
    supabaseAdmin.from("user_access").select("license_key"),
  ).maybeSingle();
  if (reread?.license_key) return reread.license_key as string;

  // Nothing stored anywhere — return the generated key so the email still goes
  // out, but flag it (the row may be missing, or the column not yet migrated).
  if (error) console.error("getOrCreateLicenseKey: failed to persist key:", error);
  else console.warn("getOrCreateLicenseKey: no license_key persisted after update; returning generated key.");
  return key;
}
