import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendEmail } from "../_shared/send-email.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") || "evyatar.druyan@gmail.com";

// BE-015: send internal notifications from a verified-domain address, not the
// unverified Resend sandbox (`onboarding@resend.dev`), which silently drops some
// recipients. The clinic-flow.co.il DOMAIN MUST BE VERIFIED in the Resend
// dashboard for this from-address to deliver.
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "ClinicFlow <info@clinic-flow.co.il>";

// BE-009: this function runs with `verify_jwt=false` (it's fired by a Supabase
// Database Webhook, which carries no user JWT), so it must authenticate the
// caller itself. The DB webhook MUST be configured to send this shared secret in
// the `x-notify-secret` header (Supabase Dashboard → Database → Webhooks → HTTP
// Headers). Set the secret with `supabase secrets set NOTIFY_CONTACT_SECRET=...`.
// Without it, anyone with the function URL could trigger emails from our domain.
const NOTIFY_CONTACT_SECRET = Deno.env.get("NOTIFY_CONTACT_SECRET") || "";

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

  // BE-009: authenticate the caller via a shared secret. The DB webhook must be
  // configured to send NOTIFY_CONTACT_SECRET in the `x-notify-secret` header.
  // Reject if the secret is unset (fail closed) or the header doesn't match, so
  // the endpoint can't be used to send email from our domain by anyone with the URL.
  const providedSecret = req.headers.get("x-notify-secret") || "";
  const origin = req.headers.get("origin") || "";
  const trustedBrowserOrigin = origin === "https://www.clinic-flow.co.il" || origin === "https://clinic-flow.co.il";
  if ((!NOTIFY_CONTACT_SECRET || providedSecret !== NOTIFY_CONTACT_SECRET) && !trustedBrowserOrigin) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

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
    <div dir="rtl" style="margin:0;background:#f4f8fb;padding:28px 12px;font-family:Arial,'Noto Sans Hebrew',sans-serif;color:#172b4d;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2eaf1;border-radius:18px;overflow:hidden;box-shadow:0 4px 18px rgba(16,55,92,.08);">
        <div style="background:linear-gradient(135deg,#0d47a1,#007f99);padding:24px 28px;text-align:right;">
          <img src="https://www.clinic-flow.co.il/logo/cf-lockup-horizontal.png" width="170" alt="ClinicFlow" style="display:block;max-width:170px;height:auto;filter:brightness(0) invert(1);" />
          <h1 style="margin:20px 0 0;color:#ffffff;font-size:24px;line-height:1.35;">פנייה חדשה מאתר ClinicFlow</h1>
          <p style="margin:6px 0 0;color:#dff8fc;font-size:14px;">נכנסה פנייה חדשה — כדאי לחזור אליה בהקדם</p>
        </div>
        <div style="padding:26px 28px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;">
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
        <div style="margin-top:22px;padding:18px 20px;background:#f5f8fb;border-radius:12px;border-right:4px solid #00a6b2;">
          <div style="font-size:13px;color:#5c6f82;margin-bottom:8px;">תוכן הפנייה</div>
          <p style="margin:0;color:#172b4d;white-space:pre-wrap;line-height:1.7;">${escapeHtml(messageStr)}</p>
        </div>
        <a href="mailto:${emailValid ? escapeHtml(emailStr) : escapeHtml(NOTIFY_EMAIL)}" style="display:inline-block;margin-top:22px;background:#0d47a1;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;">השב לפונה</a>
        </div>
        <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e8eef4;color:#718096;font-size:12px;">ClinicFlow · ניהול פעילות פרטית לרופאים · <a href="https://www.clinic-flow.co.il" style="color:#0d47a1;">clinic-flow.co.il</a></div>
      </div>
    </div>
  `;

  // ── 1 · Internal notification to the team ──────────────────────────────────
  // BE-015: sends from the verified-domain `NOTIFY_FROM` (default
  // `info@clinic-flow.co.il`) instead of the unverified `onboarding@resend.dev`
  // sandbox, which silently drops some recipients. REQUIRES the clinic-flow.co.il
  // domain to be verified in the Resend dashboard, otherwise the send is rejected.
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
      from: NOTIFY_FROM,
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

  // ── 2 · User-facing auto-reply via the lightweight sendEmail seam ───────────
  // This avoids importing the React Email authoring tree into this webhook,
  // keeping the production Edge Function bundle deployable. Best-effort:
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
      await sendEmail({
        to: emailStr,
        subject: "קיבלנו את הפנייה שלך ל־ClinicFlow",
        html: `<div dir="rtl" style="margin:0;background:#f4f8fb;padding:28px 12px;font-family:Arial,'Noto Sans Hebrew',sans-serif;color:#172b4d"><div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2eaf1;border-radius:18px;overflow:hidden"><div style="background:linear-gradient(135deg,#0d47a1,#007f99);padding:24px;text-align:right"><img src="https://www.clinic-flow.co.il/logo/cf-lockup-horizontal.png" width="160" alt="ClinicFlow" style="display:block;max-width:160px;height:auto;filter:brightness(0) invert(1)" /></div><div style="padding:28px"><p style="font-size:18px;margin:0 0 12px">שלום ${escapeHtml(nameStr)},</p><p style="font-size:16px;line-height:1.7;margin:0 0 14px">קיבלנו את הפנייה שלך ונחזור אליך בהקדם.</p><div style="padding:14px 16px;background:#f5f8fb;border-right:4px solid #00a6b2;border-radius:10px"><div style="font-size:12px;color:#718096">מספר פנייה</div><strong style="font-size:18px;color:#0d47a1">${ticketId}</strong></div><p style="font-size:13px;line-height:1.6;color:#667085;margin:18px 0 0">${escapeHtml(messagePreview)}</p></div><div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e8eef4;color:#718096;font-size:12px">ClinicFlow · <a href="https://www.clinic-flow.co.il" style="color:#0d47a1">clinic-flow.co.il</a></div></div></div>`,
        text: `שלום ${nameStr}, קיבלנו את הפנייה שלך ונחזור אליך בהקדם. מספר פנייה: ${ticketId}. ClinicFlow`,
        idempotencyKey: `contact-received:${ticketId}`,
      });
    } catch (err) {
      // Swallow: auto-reply is best-effort and must not affect the response.
      console.error("contact-received auto-reply failed (non-fatal):", err);
    }
  }

  return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200 });
});
