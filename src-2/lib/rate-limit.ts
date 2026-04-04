// Simple in-memory rate limiting for development
// In production, use Supabase edge functions or middleware

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
