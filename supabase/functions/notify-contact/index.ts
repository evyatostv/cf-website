import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendTemplate } from "../_shared/send-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") || "contact@clinic-flow.co.il";

/**
 * Deterministic-ish support ticket id: `SUP-XXXXXXXX`, derived from the row's
 * created_at + email. Because it's a pure function of stable row fields, a
 * DB-webhook retry produces the SAME id (stable on retries, and — with Resend
 * idempotency below — dedupes the auto-reply). Falls back to a random-ish slice
 * if the hash API is unavailable.
 */
async function makeTicketId(seed: string): Promise<string> {
  try {
    const bytes = new TextEncoder().encode(seed);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `SUP-${hex.slice(0, 8).toUpperCase()}`;
  } catch {
    return `SUP-${Math.abs(hashString(seed)).toString(16).slice(0, 8).toUpperCase()}`;
  }
}

/** Tiny non-crypto string hash — only used as a fallback for makeTicketId. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * BE-005: HTML-escape user-supplied text before interpolating it into the
 * notification email HTML. Prevents HTML/attribute injection from the contact
 * form (name/email/phone/message are all attacker-controllable).
 */
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Basic RFC-ish email shape check — used to gate `reply_to` and mailto links. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

/** BE-006: format created_at safely — never let an invalid Date throw/render "Invalid Date". */
function formatCreatedAt(value: unknown): string {
  if (!value) return "—";
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString("he-IL");
  } catch {
    return d.toISOString();
  }
}

serve(async (req) => {
  // This function is called by a Supabase Database Webhook on INSERT into contact_messages

  // BE-006: guard req.json() — a malformed body must be a clean 400, not a crash.
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = (payload as { record?: Record<string, unknown> })?.record;

  if (!record || typeof record !== "object") {
    return new Response(JSON.stringify({ error: "No record" }), { status: 400 });
  }

  const { name, email, phone, message, created_at } = record as {
    name?: unknown; email?: unknown; phone?: unknown; message?: unknown; created_at?: unknown;
  };

  // BE-006: require the minimum fields a contact message must carry. Reject
  // early rather than sending an empty/garbage notification email.
  const nameStr = typeof name === "string" ? name.trim() : "";
  const messageStr = typeof message === "string" ? message.trim() : "";
  if (!nameStr || !messageStr) {
    return new Response(
      JSON.stringify({ error: "Missing required fields (name, message)" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const emailValid = isValidEmail(email);
  const emailStr = emailValid ? String(email).trim() : "";

  // BE-005: every interpolated value is HTML-escaped; the mailto link only
  // renders when the email passed validation.
  const emailCell = emailValid
    ? `<a href="mailto:${escapeHtml(emailStr)}">${escapeHtml(emailStr)}</a>`
    : escapeHtml(email ? String(email) : "—");

  const emailHtml = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0d47a1;">פנייה חדשה מאתר ClinicFlow</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #1a2332;">שם:</td>
          <td style="padding: 8px 12px;">${escapeHtml(nameStr)}</td>
        </tr>
        <tr style="background: #f5f7f9;">
          <td style="padding: 8px 12px; font-weight: bold; color: #1a2332;">אימייל:</td>
          <td style="padding: 8px 12px;">${emailCell}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #1a2332;">טלפון:</td>
          <td style="padding: 8px 12px;">${phone ? escapeHtml(phone) : "—"}</td>
        </tr>
        <tr style="background: #f5f7f9;">
          <td style="padding: 8px 12px; font-weight: bold; color: #1a2332;">נשלח ב:</td>
          <td style="padding: 8px 12px;">${escapeHtml(formatCreatedAt(created_at))}</td>
        </tr>
      </table>
      <div style="margin-top: 16px; padding: 16px; background: #f5f7f9; border-radius: 8px; border-right: 4px solid #0d47a1;">
        <p style="margin: 0; color: #1a2332; white-space: pre-wrap;">${escapeHtml(messageStr)}</p>
      </div>
    </div>
  `;

  // ── 1 · Internal notification to the team ──────────────────────────────────
  // NOTE: This still goes out from the UNVERIFIED `onboarding@resend.dev`.
  // TODO(resend-domain): once the Resend domain (clinic-flow.co.il) is verified,
  // move this internal send off `onboarding@resend.dev` to the verified
  // `info@clinic-flow.co.il` (ideally by routing it through `sendTemplate` /
  // `_shared/send-email.ts` too, so ALL outbound mail shares one from-address).
  // BE-006: derive a stable idempotency key from the row so a DB-webhook retry
  // does not send the internal notification twice (Resend honours Idempotency-Key).
  const internalTicketId = await makeTicketId(`internal|${created_at ?? ""}|${emailStr}|${nameStr}`);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
      // Resend dedupes sends carrying the same Idempotency-Key for 24h.
      "Idempotency-Key": `contact-internal:${internalTicketId}`,
    },
    body: JSON.stringify({
      from: "ClinicFlow <onboarding@resend.dev>",
      to: [NOTIFY_EMAIL],
      subject: `פנייה חדשה מ-${nameStr}`,
      html: emailHtml,
      // BE-005: only set reply_to when the sender email is valid — an invalid
      // value here can be silently dropped by Resend or break the header.
      ...(emailValid ? { reply_to: emailStr } : {}),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Resend error:", data);
    return new Response(JSON.stringify({ error: data }), { status: 500 });
  }

  // ── 2 · User-facing auto-reply via the proven sendTemplate seam ────────────
  // This goes through `sendTemplate` → `_shared/send-email.ts`, which uses the
  // verified-intended `info@clinic-flow.co.il` (registry `from`). Best-effort:
  // a failure here must NEVER fail the internal notification above nor the 200
  // response below. The ticketId is deterministic-ish (stable on retries) and is
  // also passed to Resend as an idempotencyKey so a DB-webhook retry does not
  // send the auto-reply twice.
  //
  // Dedupe note: we have no cheap way to detect that a previous invocation for
  // this exact row already sent the auto-reply (no per-row marker on
  // contact_messages), so we lean on Resend idempotency keyed by the stable
  // ticketId. If stronger dedupe is ever required, add a `contact_reply_sent_at`
  // column to contact_messages and guard on it here.
  if (emailValid) {
    try {
      const ticketId = await makeTicketId(`${created_at ?? ""}|${emailStr}`);
      const messagePreview = messageStr.slice(0, 100);
      await sendTemplate(
        "contact-received",
        emailStr,
        {
          name: nameStr,
          messagePreview,
          ticketId,
        },
        { idempotencyKey: `contact-received:${ticketId}` },
      );
    } catch (err) {
      // Swallow: auto-reply is best-effort and must not affect the response.
      console.error("contact-received auto-reply failed (non-fatal):", err);
    }
  }

  return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200 });
});
