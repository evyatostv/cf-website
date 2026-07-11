import { supabase } from "@/lib/supabase";
import { LEADS_SHEET_WEBHOOK } from "@/app/config/site";

export type Lead = {
  name: string;
  email: string;
  phone?: string;
  clinicName?: string;
  message: string;
  source?: string;
};

// Field caps — the anon key is public, so anyone can POST to contact_messages /
// the leads webhook. Client-side validation is not a security boundary (the DB
// still needs length constraints + RLS), but it keeps honest submissions clean
// and blocks the obvious oversized/garbage payloads before they leave the page.
const LIMITS = { name: 120, email: 254, phone: 40, clinicName: 160, message: 5000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clamp(v: string | undefined, max: number): string {
  return (v ?? "").trim().slice(0, max);
}

// Submits a lead to Supabase (contact_messages — which triggers the
// notify-contact email webhook) and, best-effort, mirrors it to Google Sheets.
// The Sheets mirror never blocks or fails the user-facing submit.
export async function submitLead(lead: Lead): Promise<{ ok: boolean; error?: string }> {
  // Validate + normalise before hitting the network (WEB-008).
  const name = clamp(lead.name, LIMITS.name);
  const email = clamp(lead.email, LIMITS.email);
  const phone = clamp(lead.phone, LIMITS.phone);
  const clinicName = clamp(lead.clinicName, LIMITS.clinicName);
  const body = clamp(lead.message, LIMITS.message);

  if (!name) return { ok: false, error: "נא להזין שם." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "כתובת אימייל אינה תקינה." };
  if (!body) return { ok: false, error: "נא להזין הודעה." };

  // contact_messages has no clinic column, so fold the clinic name into the body.
  const message = clinicName ? `קליניקה: ${clinicName}\n\n${body}` : body;

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    phone: phone || null,
    message,
  });

  if (error) {
    console.error("Lead insert failed:", error);
    return { ok: false, error: "שגיאה בשליחה. נסו שוב מאוחר יותר." };
  }

  // Best-effort mirror to a Google Apps Script Web App. Apps Script doesn't send
  // CORS headers, so we POST opaquely (no-cors + text/plain); the script reads
  // e.postData.contents. Failure here is logged but never shown to the user.
  if (LEADS_SHEET_WEBHOOK) {
    try {
      await fetch(LEADS_SHEET_WEBHOOK, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || "",
          clinicName: clinicName || "",
          message: body,
          source: clamp(lead.source, 60) || "website",
          ts: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn("Google Sheets mirror failed (non-fatal):", e);
    }
  }

  return { ok: true };
}
