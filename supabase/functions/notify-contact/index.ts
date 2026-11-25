import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/send-email.ts";

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

type Contact = {
  id: string; name: string; email: string; phone: string | null; message: string; created_at: string;
  source: string | null; utm_source: string | null; utm_medium: string | null;
  utm_campaign: string | null; utm_content: string | null;
};

async function deliver(contact: Contact, channel: string) {
  const record = contact;
  const { name, email, phone, message, created_at } = record as {
    name?: unknown; email?: unknown; phone?: unknown; message?: unknown; created_at?: unknown;
  };

  // BE-006: require the minimum fields a contact message must carry. Reject
  // early rather than sending an empty/garbage notification email.
  const nameStr = typeof name === "string" ? name.trim() : "";
  const messageStr = typeof message === "string" ? message.trim() : "";
  if (!nameStr || !messageStr) {
    throw new Error('invalid_contact');
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

  const key = `contact-${channel}:${contact.id}`;
  if (channel === 'internal') {
    const sent = await sendEmail({ from: NOTIFY_FROM, to: NOTIFY_EMAIL, replyTo: emailValid ? emailStr : undefined,
      subject: `פנייה חדשה מ-${nameStr}`, html: emailHtml, idempotencyKey: key });
    if (!sent.id) throw new Error('missing_email_receipt');
  } else if (channel === 'reply') {
    if (!emailValid) throw new Error('invalid_recipient');
    const ticketId = 'SUP-' + contact.id.slice(0, 8).toUpperCase();
    const sent = await sendEmail({
        to: emailStr, subject: "קיבלנו את הפנייה שלך ל־ClinicFlow",
        html: `<div dir="rtl" style="margin:0;background:#f4f8fb;padding:28px 12px;font-family:Arial,'Noto Sans Hebrew',sans-serif;color:#172b4d"><div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2eaf1;border-radius:18px;overflow:hidden"><div style="background:linear-gradient(135deg,#0d47a1,#007f99);padding:24px;text-align:right"><img src="https://www.clinic-flow.co.il/logo/cf-lockup-horizontal.png" width="160" alt="ClinicFlow" style="display:block;max-width:160px;height:auto;filter:brightness(0) invert(1)" /></div><div style="padding:28px"><p style="font-size:18px;margin:0 0 12px">שלום,</p><p style="font-size:16px;line-height:1.7;margin:0 0 14px">קיבלנו את הפנייה שלך ונחזור אליך בהקדם.</p><div style="padding:14px 16px;background:#f5f8fb;border-right:4px solid #00a6b2;border-radius:10px"><div style="font-size:12px;color:#718096">מספר פנייה</div><strong style="font-size:18px;color:#0d47a1">${ticketId}</strong></div></div><div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e8eef4;color:#718096;font-size:12px">ClinicFlow · <a href="https://www.clinic-flow.co.il" style="color:#0d47a1">clinic-flow.co.il</a></div></div></div>`,
        text: `שלום, קיבלנו את הפנייה שלך ונחזור אליך בהקדם. מספר פנייה: ${ticketId}. ClinicFlow`,
      idempotencyKey: key,
    });
    if (!sent.id) throw new Error('missing_email_receipt');
  } else if (channel === 'sheet') {
    await mirrorContact(contact);
  } else throw new Error('invalid_channel');
}

async function mirrorContact(contact: Contact) {
  const url = new URL(Deno.env.get('CONTACT_SHEET_URL') || '');
  if (url.origin !== 'https://script.google.com' || !/^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname) || url.search || url.hash) throw new Error('invalid_sheet_url');
  const secret = Deno.env.get('CONTACT_SHEET_SECRET');
  if (!secret) throw new Error('sheet_unconfigured');
  const response = await fetch(url, {
    method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ secret, contact }),
  });
  // Apps Script ContentService redirects to a one-time result URL. Never forward the POST or secret.
  let result = response;
  if ([302,303].includes(response.status)) {
    const target = new URL(response.headers.get('Location') || '');
    if (target.origin !== 'https://script.googleusercontent.com') throw new Error('invalid_sheet_redirect');
    result = await fetch(target, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  }
  if (!result.ok || (await result.json()).storedId !== contact.id) throw new Error('missing_sheet_receipt');
}

serve(async req => {
  if (req.method !== 'POST') return Response.json({error:'method'}, {status:405});
  const cronSecret = Deno.env.get('CRON_SECRET');
  const scheduled = Boolean(cronSecret && req.headers.get('x-cron-secret') === cronSecret);
  if (!scheduled && (!NOTIFY_CONTACT_SECRET || req.headers.get('x-notify-secret') !== NOTIFY_CONTACT_SECRET))
    return Response.json({error:'unauthorized'}, {status:401});

  let contactId: string | null = null;
  if (!scheduled) {
    const event = await req.json().catch(() => null);
    if (event?.type !== 'INSERT' || event.schema !== 'public' || event.table !== 'contact_messages'
        || typeof event.record?.id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(event.record.id))
      return Response.json({error:'invalid_event'}, {status:400});
    contactId = event.record.id;
  }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {auth:{persistSession:false, autoRefreshToken:false}});
  const sheetEnabled = Boolean(Deno.env.get('CONTACT_SHEET_URL') && Deno.env.get('CONTACT_SHEET_SECRET'));
  const { data: jobs, error } = await db.rpc('claim_contact_deliveries', {p_contact:contactId,p_sheet_enabled:sheetEnabled});
  if (error) return Response.json({error:'claim_failed'}, {status:503});
  let failed = 0;
  for (const job of jobs || []) {
    try {
      const {data:contact,error:readError} = await db.from('contact_messages')
        .select('id,name,email,phone,message,created_at,source,utm_source,utm_medium,utm_campaign,utm_content')
        .eq('id',job.contact_id).maybeSingle();
      if (readError) throw new Error('read_failed');
      if (!contact) continue; // Deletion cascades to its pending deliveries.
      await deliver(contact,job.channel);
      const {data:completed,error:writeError} = await db.from('contact_deliveries').update({completed_at:new Date().toISOString()})
        .eq('contact_id',job.contact_id).eq('channel',job.channel).eq('lease_id',job.lease_id)
        .is('completed_at',null).select('contact_id').maybeSingle();
      if (writeError || !completed) throw new Error('completion_failed');
    } catch {
      failed++;
      console.error('Contact delivery requires retry', job.channel);
    }
  }
  return Response.json({processed:jobs?.length || 0,failed}, {status:failed ? 503 : 200});
});
