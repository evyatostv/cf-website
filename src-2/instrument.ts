import * as Sentry from "@sentry/react";

/**
 * Privacy posture (privacy-by-default).
 *
 * ClinicFlow is a medical-adjacent product, so error/replay telemetry must NOT
 * carry PII/PHI. To enforce this:
 *  - sendDefaultPii is disabled (no auto IP/user/cookie/headers collection).
 *  - Session Replay masks all text + inputs and blocks all media so emails,
 *    form fields, and rendered content never leave the browser.
 *  - beforeSend scrubs the outgoing event: redacts email addresses, strips
 *    cookies and Authorization headers, and redacts known sensitive query/body
 *    keys (email, token, password, pin, phone, id_number/te'udat zehut).
 *  - beforeBreadcrumb drops/redacts breadcrumbs that contain email-like strings.
 * All hooks are null-safe and fail open (never throw) so telemetry still flows.
 */

// Matches the local-part@domain shape of email addresses.
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Query/body parameter keys considered sensitive (case-insensitive match).
const SENSITIVE_KEYS = [
  "email",
  "token",
  "password",
  "pin",
  "phone",
  "id_number",
  "teudat_zehut",
  "teudatzehut",
  "id",
];

const REDACTED = "[redacted]";

// Stateless email detection (avoids the stateful lastIndex of a /g regex).
function containsEmail(value: string): boolean {
  return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(value);
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((k) => lower === k || lower.includes(k));
}

// Recursively redact emails in strings and sensitive keys in objects/arrays.
function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;

  if (typeof value === "string") {
    return value.replace(EMAIL_REGEX, REDACTED);
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? REDACTED : scrubValue(val, depth + 1);
    }
    return out;
  }

  return value;
}

// Redact emails inside a free-form string (null-safe).
function scrubString(value: unknown): unknown {
  return typeof value === "string" ? value.replace(EMAIL_REGEX, REDACTED) : value;
}

Sentry.init({
  dsn: "https://e8c3eb0d82a37bcfdc86f6a8abdb7a3a@o4511219015024640.ingest.de.sentry.io/4511219016925264",
  environment: import.meta.env.MODE,
  sendDefaultPii: false,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.2 : 1.0,
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/clinic-flow\.co\.il/,
    /^https:\/\/dmuwxydmuylcbhcoagri\.supabase\.co/,
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  beforeSend(event) {
    try {
      // Redact emails in the top-level message.
      if (event.message) {
        event.message = scrubString(event.message) as string;
      }

      // Redact emails in exception values.
      const exceptionValues = event.exception?.values;
      if (Array.isArray(exceptionValues)) {
        for (const ex of exceptionValues) {
          if (ex && typeof ex.value === "string") {
            ex.value = scrubString(ex.value) as string;
          }
        }
      }

      const request = event.request;
      if (request) {
        // Strip cookies entirely.
        if (request.cookies) {
          request.cookies = REDACTED as unknown as typeof request.cookies;
        }

        // Strip/redact Authorization headers (case-insensitive).
        if (request.headers && typeof request.headers === "object") {
          const headers = request.headers as Record<string, unknown>;
          for (const headerKey of Object.keys(headers)) {
            if (headerKey.toLowerCase() === "authorization" || headerKey.toLowerCase() === "cookie") {
              headers[headerKey] = REDACTED;
            }
          }
        }

        // Redact sensitive query string keys + any embedded emails.
        if (request.query_string) {
          request.query_string = scrubValue(request.query_string) as typeof request.query_string;
        }

        // Redact sensitive body data keys + any embedded emails.
        if (request.data) {
          request.data = scrubValue(request.data) as typeof request.data;
        }
      }

      // Redact emails/sensitive keys in extra and contexts.
      if (event.extra) {
        event.extra = scrubValue(event.extra) as typeof event.extra;
      }
      if (event.contexts) {
        event.contexts = scrubValue(event.contexts) as typeof event.contexts;
      }
    } catch {
      // Fail open: never block telemetry because scrubbing threw.
    }
    return event;
  },
  beforeBreadcrumb(breadcrumb) {
    try {
      const hasEmail =
        (typeof breadcrumb.message === "string" && containsEmail(breadcrumb.message)) ||
        (!!breadcrumb.data &&
          typeof breadcrumb.data === "object" &&
          containsEmail(JSON.stringify(breadcrumb.data)));

      if (hasEmail) {
        // Drop noisy console/network breadcrumbs that leak emails; redact others.
        if (breadcrumb.category === "console" || breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
          return null;
        }
        if (typeof breadcrumb.message === "string") {
          breadcrumb.message = scrubString(breadcrumb.message) as string;
        }
        if (breadcrumb.data && typeof breadcrumb.data === "object") {
          breadcrumb.data = scrubValue(breadcrumb.data) as typeof breadcrumb.data;
        }
      }
    } catch {
      // Fail open: keep the breadcrumb as-is if redaction threw.
    }
    return breadcrumb;
  },
});
