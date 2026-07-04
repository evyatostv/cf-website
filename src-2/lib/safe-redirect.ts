// Validate a `redirect` query param before navigating to it after login.
// Only same-origin, path-only redirects are allowed — this blocks open-redirect
// attacks (e.g. //evil.com, https://evil.com, javascript:...).
export function safeRedirect(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // keep raw if it isn't valid percent-encoding
  }
  // Must be a root-relative path, and NOT a protocol-relative "//host" URL.
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  // Reject control chars / whitespace that could smuggle a scheme.
  if (/[\s\\]/.test(value) || value.toLowerCase().includes('javascript:')) {
    return fallback;
  }
  return value;
}
