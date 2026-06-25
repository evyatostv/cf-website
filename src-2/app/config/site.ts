// ---------------------------------------------------------------------------
// Single source of truth for owner-editable contact + integration values.
// Edit the three marked values; everything on the site reads from here.
// ---------------------------------------------------------------------------

// Public contact email (kept on legal pages; phone is added alongside it).
export const CONTACT_EMAIL = "contact@clinic-flow.co.il";

// Contact is via WhatsApp (we show a WhatsApp link, not a plain phone number).
// Number 0535532893 -> international 972535532893.
export const CONTACT_WHATSAPP_DISPLAY = "053-553-2893";
export const CONTACT_WHATSAPP_URL = "https://wa.me/972535532893";

// Google Sheets lead mirror — paste your Apps Script Web App URL into the Vercel
// env var VITE_LEADS_SHEET_WEBHOOK. Empty = leads still save to Supabase, the
// Sheets mirror is just skipped silently.
export const LEADS_SHEET_WEBHOOK =
  (import.meta.env.VITE_LEADS_SHEET_WEBHOOK as string | undefined) ||
  "https://script.google.com/macros/s/AKfycbxovWaEd5P9adFGVI4FQ8gZcbnPo9l-HsAPNOxAmfxzujhcXfaI1bX-aDM4rjw4pC9Y/exec";
