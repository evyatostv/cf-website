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

// Submits a lead to Supabase (contact_messages — which triggers the
// notify-contact email webhook) and, best-effort, mirrors it to Google Sheets.
// The Sheets mirror never blocks or fails the user-facing submit.
export async function submitLead(lead: Lead): Promise<{ ok: boolean; error?: string }> {
  // contact_messages has no clinic column, so fold the clinic name into the body.
  const message = lead.clinicName?.trim()
    ? `קליניקה: ${lead.clinicName.trim()}\n\n${lead.message}`
    : lead.message;

  const { error } = await supabase.from("contact_messages").insert({
    name: lead.name,
    email: lead.email,
    phone: lead.phone || null,
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
          name: lead.name,
          email: lead.email,
          phone: lead.phone || "",
          clinicName: lead.clinicName || "",
          message: lead.message,
          source: lead.source || "website",
          ts: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn("Google Sheets mirror failed (non-fatal):", e);
    }
  }

  return { ok: true };
}
