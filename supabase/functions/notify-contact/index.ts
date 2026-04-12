import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") || "contact@clinic-flow.co.il";

serve(async (req) => {
  // This function is called by a Supabase Database Webhook on INSERT into contact_messages
  const payload = await req.json();
  const record = payload.record;

  if (!record) {
    return new Response(JSON.stringify({ error: "No record" }), { status: 400 });
  }

  const { name, email, phone, message, created_at } = record;

  const emailHtml = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0d47a1;">פנייה חדשה מאתר ClinicFlow</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #1a2332;">שם:</td>
          <td style="padding: 8px 12px;">${name}</td>
        </tr>
        <tr style="background: #f5f7f9;">
          <td style="padding: 8px 12px; font-weight: bold; color: #1a2332;">אימייל:</td>
          <td style="padding: 8px 12px;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #1a2332;">טלפון:</td>
          <td style="padding: 8px 12px;">${phone || "—"}</td>
        </tr>
        <tr style="background: #f5f7f9;">
          <td style="padding: 8px 12px; font-weight: bold; color: #1a2332;">נשלח ב:</td>
          <td style="padding: 8px 12px;">${new Date(created_at).toLocaleString("he-IL")}</td>
        </tr>
      </table>
      <div style="margin-top: 16px; padding: 16px; background: #f5f7f9; border-radius: 8px; border-right: 4px solid #0d47a1;">
        <p style="margin: 0; color: #1a2332; white-space: pre-wrap;">${message}</p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "ClinicFlow <onboarding@resend.dev>",
      to: [NOTIFY_EMAIL],
      subject: `פנייה חדשה מ-${name}`,
      html: emailHtml,
      reply_to: email,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Resend error:", data);
    return new Response(JSON.stringify({ error: data }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200 });
});
