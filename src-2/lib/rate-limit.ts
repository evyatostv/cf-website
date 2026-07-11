// Rate limiting for auth actions (login / signup).
//
// WEB-007 / BE-014 / UERR-028: the old implementation was a per-tab in-memory
// counter — reset on reload, per-tab, and trivially bypassed. Real throttling
// has to live server-side. We now call a Supabase Postgres RPC (`check_rate_limit`)
// that atomically increments a per-identifier counter in a shared table, so the
// limit holds across reloads, tabs, and devices.
//
// ⚠️ COORDINATION NEEDED (outside src-2): this relies on a DB migration that
// creates the `auth_rate_limits` table and the `check_rate_limit(text,int,int)`
// RPC (SECURITY DEFINER, granted to anon). See the changelog note. Until that
// migration is applied, `serverRateLimit` fails OPEN (returns allowed) so login
// is never broken by a missing RPC — the in-memory `checkRateLimit` still gives
// best-effort per-tab protection as defense-in-depth.

import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Server-side (authoritative) throttling
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets (0 when allowed / unknown). */
  retryAfterSeconds: number;
}

/**
 * Atomically records an attempt for `identifier` and reports whether it is
 * within the limit, using a server-side Postgres counter.
 *
 * Fails OPEN (allowed) on transport/RPC errors so a backend hiccup or a
 * not-yet-deployed migration never locks legitimate users out — the caller can
 * still fall back to the client-side `checkRateLimit`.
 */
export async function serverRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowSeconds = 60
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_max_attempts: maxAttempts,
      p_window_seconds: windowSeconds,
    });

    if (error || !data) {
      // RPC missing / errored → fail open.
      return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
    }

    // The RPC returns a single row: { allowed, remaining, retry_after_seconds }.
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };

    return {
      allowed: Boolean(row.allowed),
      remaining: Math.max(0, Number(row.remaining ?? 0)),
      retryAfterSeconds: Math.max(0, Number(row.retry_after_seconds ?? 0)),
    };
  } catch {
    return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
  }
}

// ---------------------------------------------------------------------------
// Client-side (best-effort, defense-in-depth) throttling
// ---------------------------------------------------------------------------

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowSeconds: number = 60
): boolean {
  const now = Date.now();
  const key = identifier;

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 0, resetTime: now + windowSeconds * 1000 };
  }

  const entry = rateLimitStore[key];

  // Reset if window expired
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + windowSeconds * 1000;
  }

  // Check limit
  if (entry.count >= maxAttempts) {
    return false; // Rate limited
  }

  entry.count++;
  return true; // Allow
}

export function getRateLimitStatus(
  identifier: string,
  windowSeconds: number = 60
): { remaining: number; resetTime: number } {
  const entry = rateLimitStore[identifier];
  const now = Date.now();

  if (!entry) {
    return { remaining: 5, resetTime: now + windowSeconds * 1000 };
  }

  if (now > entry.resetTime) {
    return { remaining: 5, resetTime: now + windowSeconds * 1000 };
  }

  return {
    remaining: Math.max(0, 5 - entry.count),
    resetTime: entry.resetTime,
  };
}

export function clearRateLimit(identifier: string): void {
  delete rateLimitStore[identifier];
}
