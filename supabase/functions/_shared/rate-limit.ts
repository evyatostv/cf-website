// _shared/rate-limit.ts
// Server-side rate limiting for ClinicFlow Supabase edge functions (Deno).
//
// Design: fixed-window counter kept in an in-memory Map, keyed by
//   `${functionName}:${clientIp}`. Each entry tracks a window start time and a
//   request count. When the window expires it resets.
//
// LIMITATION: Supabase Edge runs many isolates and can spin new ones up/down,
// so this Map is NOT shared across isolates — each isolate enforces the limit
// independently. The effective limit may therefore be higher than `max` under
// load, and state is lost when an isolate is recycled. This is still useful as
// a cheap first line of defense against bursts/abuse from a single IP hitting a
// warm isolate. For strict global limits, back this with Deno KV or a Postgres
// table; that is intentionally avoided here to keep deploys dependency-free.

interface WindowEntry {
  count: number;
  windowStart: number; // epoch ms when the current window began
}

// Module-level store: persists for the life of the isolate.
const store = new Map<string, WindowEntry>();

/** Best-effort client IP from common proxy headers. */
function getClientIp(req: Request): string {
  // x-forwarded-for may be a comma-separated list; the first entry is the client.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}

export interface RateLimitOptions {
  name: string; // logical function name, used as part of the key namespace
  max: number; // max requests allowed per window
  windowSec: number; // window length in seconds
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter?: number; // seconds until the window resets (only when !ok)
}

/**
 * Fixed-window rate limit check. Returns { ok: false, retryAfter } when the
 * caller has exceeded `max` requests within the current `windowSec` window.
 */
export async function checkRateLimit(
  req: Request,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const ip = getClientIp(req);
  const key = `${opts.name}:${ip}`;

  const entry = store.get(key);

  // No entry, or the previous window has fully elapsed → start a fresh window.
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  // Within the current window.
  if (entry.count < opts.max) {
    entry.count += 1;
    return { ok: true };
  }

  // Limit exceeded.
  const retryAfter = Math.max(
    1,
    Math.ceil((entry.windowStart + windowMs - now) / 1000),
  );
  return { ok: false, retryAfter };
}

/** Build a 429 Too Many Requests response with a Retry-After header. */
export function tooManyResponse(
  retryAfter: number | undefined,
  corsHeaders: Record<string, string>,
): Response {
  const seconds = retryAfter ?? 60;
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(seconds),
      },
    },
  );
}
