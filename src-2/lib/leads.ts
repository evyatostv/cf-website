import { supabase } from "@/lib/supabase";

export type Lead = {
  name: string;
  email: string;
  phone?: string;
  clinicName?: string;
  message: string;
  source?: string;
  attribution?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };
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

// Delivery work is queued in the same transaction as the stored inquiry.
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

  const record = {
    name,
    email,
    phone: phone || null,
    message,
    source: clamp(lead.source, 160) || "website",
    utm_source: clamp(lead.attribution?.source, 160) || null,
    utm_medium: clamp(lead.attribution?.medium, 160) || null,
    utm_campaign: clamp(lead.attribution?.campaign, 160) || null,
    utm_content: clamp(lead.attribution?.content, 160) || null,
  };
  const { error } = await supabase.from("contact_messages").insert(record);

  if (error) {
    console.error("Lead insert failed", error.code);
    return { ok: false, error: "שגיאה בשליחה. נסו שוב מאוחר יותר." };
  }

  return { ok: true };
}
