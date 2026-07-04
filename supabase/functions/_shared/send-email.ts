/**
 * ClinicFlow · Resend send pipeline (Deno / Supabase Edge Functions).
 *
 * The single choke-point through which every transactional & lifecycle email
 * leaves the system. Wiring functions render a template to HTML (see
 * ./render.ts + ./email-registry.ts) and hand it to `sendEmail`.
 *
 * Env: RESEND_API_KEY  (set with `supabase secrets set RESEND_API_KEY=...`)
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Verified sender. Requires clinic-flow.co.il to be verified in Resend. */
export const DEFAULT_FROM = "ClinicFlow <info@clinic-flow.co.il>";
/** Replies to any transactional email land in the shared support inbox. */
export const DEFAULT_REPLY_TO = "info@clinic-flow.co.il";

export interface SendEmailParams {
  /** One or more recipient addresses. */
  to: string | string[];
  /** Subject line (Hebrew). Prefer registry.subject for consistency. */
  subject: string;
  /** Rendered HTML body. */
  html: string;
  /** Optional plaintext fallback (improves deliverability). */
  text?: string;
  /** Override sender. Defaults to DEFAULT_FROM. */
  from?: string;
  /** Override reply-to. Defaults to DEFAULT_REPLY_TO. */
  replyTo?: string;
  /**
   * Resend tags — surfaced in the Resend dashboard for analytics/filtering.
   * e.g. [{ name: "template", value: "license-delivery" }]
   */
  tags?: Array<{ name: string; value: string }>;
  /**
   * Optional idempotency key. When set, Resend guarantees a duplicate POST with
   * the same key (within 24h) sends the email only once — critical for webhook
   * retries (Stripe/Supabase deliver at-least-once).
   */
  idempotencyKey?: string;
  /**
   * List-Unsubscribe header value for lifecycle/marketing mail (§4 legal).
   * Pass the raw header value, e.g. "<https://clinic-flow.co.il/unsubscribe>"
   * or "<mailto:unsubscribe@…>, <https://…>". When set, a matching
   * `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header is added so
   * Gmail/Outlook render a native one-click unsubscribe button (RFC 8058).
   * Transactional mail (auth, receipts, license, security) must NOT set this.
   */
  listUnsubscribe?: string;
}

export interface SendEmailResult {
  /** Resend message id. */
  id: string;
}

/**
 * POST an email to Resend. Returns the Resend message id; throws on non-2xx or
 * a missing API key so callers can log/alert.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("sendEmail: RESEND_API_KEY is not set");
  }

  const {
    to,
    subject,
    html,
    text,
    from = DEFAULT_FROM,
    replyTo = DEFAULT_REPLY_TO,
    tags,
    idempotencyKey,
    listUnsubscribe,
  } = params;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const body: Record<string, unknown> = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    reply_to: replyTo,
  };
  if (text) body.text = text;
  if (tags && tags.length) body.tags = tags;
  if (listUnsubscribe) {
    // Resend forwards custom RFC-822 headers via the `headers` body field.
    // List-Unsubscribe + List-Unsubscribe-Post enables Gmail/Outlook one-click.
    body.headers = {
      "List-Unsubscribe": listUnsubscribe,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = typeof data === "object" ? JSON.stringify(data) : String(data);
    throw new Error(`sendEmail: Resend responded ${res.status} — ${detail}`);
  }

  return { id: (data as { id: string }).id };
}
