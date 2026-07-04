/**
 * ClinicFlow · Email registry (Deno / edge runtime).
 *
 * The canonical, typed contract that the WIRING functions import. For each of
 * the 21 templates it fixes:
 *   - the Hebrew `subject` (verbatim from emails/DESIGN-SOURCE.html),
 *   - the verified `from`,
 *   - whether an `unsubscribe` link is legally required,
 *   - the exact prop shape the template expects (`EmailPropMap`).
 *
 * Wiring example:
 *   import { EMAILS } from "../_shared/email-registry.ts";
 *   import { sendEmail } from "../_shared/send-email.ts";
 *   const def = EMAILS["license-delivery"];
 *   await sendEmail({ to, subject: def.subject, from: def.from, html });
 *
 * Legal rule (§4): transactional mail (auth, receipts, license, security) needs
 * NO unsubscribe; lifecycle/marketing mail (trial nudges, win-back, renewal
 * reminders, policy updates) MUST include one.
 */

export const FROM = "ClinicFlow <info@clinic-flow.co.il>";

export type EmailId =
  // A · Account & authentication
  | "confirm-email"
  | "magic-link"
  | "reset-password"
  | "change-email"
  | "welcome"
  // B · Purchase & licensing
  | "order-confirmation"
  | "license-delivery"
  | "upgrade-confirmation"
  | "payment-failed"
  | "refund-confirmation"
  | "device-reactivation"
  // C · Trial lifecycle
  | "trial-started"
  | "trial-ending"
  | "trial-ended"
  | "win-back"
  // D · Maintenance & renewal
  | "renewal-upcoming"
  | "renewal-confirmation"
  | "updates-lapsed"
  // E · Support & sales
  | "contact-received"
  | "sales-response"
  | "policy-update";

export type EmailGroup =
  | "A · Auth"
  | "B · Purchase & Licensing"
  | "C · Trial Lifecycle"
  | "D · Maintenance & Renewal"
  | "E · Support & Sales";

/** Per-template prop shapes. These are the exact inputs the wiring code must
 *  supply. `?` = optional. Amounts are pre-formatted strings (e.g. "₪1,411")
 *  so currency/locale formatting stays in one place at the call site. */
export interface EmailPropMap {
  // ── A · Auth (Supabase-Auth templates receive Supabase {{ .Var }} tokens) ──
  "confirm-email": { confirmationUrl: string };
  "magic-link": { token: string; confirmationUrl: string };
  "reset-password": { confirmationUrl: string };
  "change-email": { confirmationUrl: string; newEmail: string };
  "welcome": { name: string; downloadUrl?: string };

  // ── B · Purchase & licensing ──
  "order-confirmation": {
    name: string;
    plan: string;
    orderId: string;
    amount: string; // pre-VAT, formatted
    vat: string; // formatted
    total: string; // formatted
    ordersUrl?: string;
  };
  "license-delivery": {
    name: string;
    plan: string;
    licenseKey: string;
    downloadUrl: string;
  };
  "upgrade-confirmation": {
    name: string;
    fromPlan: string;
    toPlan: string;
    credit: string; // formatted, e.g. "−₪690"
    difference: string; // formatted
    whatsNewUrl?: string;
  };
  "payment-failed": {
    name: string;
    plan: string;
    amount: string; // formatted
    retryUrl: string;
  };
  "refund-confirmation": {
    name: string;
    plan: string;
    refundId: string;
    amount: string; // formatted
  };
  "device-reactivation": {
    name: string;
    deviceName: string;
    date: string; // human-formatted, e.g. "2 ביולי 2026, 14:32"
    licenseKey: string; // may be masked, e.g. "CF-FULL-••••-A1D3"
  };

  // ── C · Trial lifecycle (marketing → unsubscribe) ──
  "trial-started": {
    name: string;
    daysTotal: number;
    endDate: string; // human-formatted
    downloadUrl: string;
  };
  "trial-ending": {
    name: string;
    daysLeft: number;
    endDate: string;
    pricingUrl: string;
  };
  "trial-ended": { name: string; pricingUrl: string };
  "win-back": { name: string; pricingUrl: string };

  // ── D · Maintenance & renewal ──
  "renewal-upcoming": {
    name: string;
    plan: string;
    renewDate: string; // human-formatted
    amount: string; // formatted annual cost
    renewUrl: string;
  };
  "renewal-confirmation": {
    name: string;
    plan: string;
    newPeriodEnd: string; // human-formatted
    amount: string; // formatted
  };
  "updates-lapsed": { name: string; plan: string; renewUrl: string };

  // ── E · Support & sales ──
  "contact-received": {
    name: string;
    ticketId?: string;
    messagePreview?: string;
  };
  "sales-response": {
    name: string;
    agentName?: string;
    ctaUrl?: string;
  };
  "policy-update": {
    effectiveDate: string; // human-formatted
    termsUrl: string;
    privacyUrl: string;
    name?: string;
  };
}

export interface EmailDef<Id extends EmailId = EmailId> {
  id: Id;
  group: EmailGroup;
  /** Verbatim Hebrew subject (matches DESIGN-SOURCE). */
  subject: string;
  /** Hidden inbox-preview snippet (matches DESIGN-SOURCE). */
  preheader: string;
  from: string;
  /** Legally-required unsubscribe link (lifecycle/marketing only). */
  unsubscribe: boolean;
  /** Human-readable trigger for the wiring agents. */
  trigger: string;
  /** Authoring template file under cf-website/emails/. */
  file: string;
}

/** id → typed props (for callers who want the prop shape). */
export type PropsFor<Id extends EmailId> = EmailPropMap[Id];

export const EMAILS: { [Id in EmailId]: EmailDef<Id> } = {
  // ── A · Account & authentication ──
  "confirm-email": {
    id: "confirm-email", group: "A · Auth", from: FROM, unsubscribe: false,
    subject: "אימות כתובת האימייל שלך ב-ClinicFlow",
    preheader: "עוד לחיצה אחת ונסיים את ההרשמה שלך.",
    trigger: "Supabase Auth · signup / email confirm", file: "confirm-email.tsx",
  },
  "magic-link": {
    id: "magic-link", group: "A · Auth", from: FROM, unsubscribe: false,
    subject: "קוד הכניסה שלך ל-ClinicFlow",
    preheader: "קוד חד-פעמי לכניסה לחשבון שלך.",
    trigger: "Supabase Auth · magic link / OTP", file: "magic-link.tsx",
  },
  "reset-password": {
    id: "reset-password", group: "A · Auth", from: FROM, unsubscribe: false,
    subject: "איפוס הסיסמה שלך ב-ClinicFlow",
    preheader: "קיבלנו בקשה לאיפוס הסיסמה שלך.",
    trigger: "Supabase Auth · password recovery", file: "reset-password.tsx",
  },
  "change-email": {
    id: "change-email", group: "A · Auth", from: FROM, unsubscribe: false,
    subject: "אישור שינוי כתובת האימייל",
    preheader: "אשרו את כתובת האימייל החדשה לחשבון שלך.",
    trigger: "Supabase Auth · email change", file: "change-email.tsx",
  },
  "welcome": {
    id: "welcome", group: "A · Auth", from: FROM, unsubscribe: false,
    subject: "ברוכים הבאים ל-ClinicFlow",
    preheader: "החשבון שלך מוכן. הנה מה שחשוב לדעת.",
    trigger: "After first successful signup + confirm", file: "welcome.tsx",
  },

  // ── B · Purchase & licensing ──
  "order-confirmation": {
    id: "order-confirmation", group: "B · Purchase & Licensing", from: FROM, unsubscribe: false,
    subject: "אישור הרכישה שלך ב-ClinicFlow",
    preheader: "תודה על הרכישה — הנה סיכום ההזמנה שלך.",
    trigger: "Stripe · payment succeeded", file: "order-confirmation.tsx",
  },
  "license-delivery": {
    id: "license-delivery", group: "B · Purchase & Licensing", from: FROM, unsubscribe: false,
    subject: "מפתח הרישיון שלך ל-ClinicFlow מוכן",
    preheader: "מפתח הרישיון + הפעלה ב-3 שלבים, גם ללא אינטרנט.",
    trigger: "After order confirmation · license issued", file: "license-delivery.tsx",
  },
  "upgrade-confirmation": {
    id: "upgrade-confirmation", group: "B · Purchase & Licensing", from: FROM, unsubscribe: false,
    subject: "שדרוג התוכנית שלך אושר",
    preheader: "שילמת רק את ההפרש — הנה הפירוט.",
    trigger: "Stripe · plan upgrade paid", file: "upgrade-confirmation.tsx",
  },
  "payment-failed": {
    id: "payment-failed", group: "B · Purchase & Licensing", from: FROM, unsubscribe: false,
    subject: "התשלום לא הושלם — נדרשת פעולה",
    preheader: "לא הצלחנו לחייב את אמצעי התשלום. אפשר לנסות שוב.",
    trigger: "Stripe · payment failed", file: "payment-failed.tsx",
  },
  "refund-confirmation": {
    id: "refund-confirmation", group: "B · Purchase & Licensing", from: FROM, unsubscribe: false,
    subject: "אישור החזר כספי מ-ClinicFlow",
    preheader: "ההחזר שלך עובד — הנה הפרטים.",
    trigger: "Stripe · refund issued", file: "refund-confirmation.tsx",
  },
  "device-reactivation": {
    id: "device-reactivation", group: "B · Purchase & Licensing", from: FROM, unsubscribe: false,
    subject: "הרישיון הופעל מחדש במכשיר חדש",
    preheader: "הפעלת את ClinicFlow במחשב חדש — אישור אבטחה.",
    trigger: "License activated on a new device", file: "device-reactivation.tsx",
  },

  // ── C · Trial lifecycle ──
  "trial-started": {
    id: "trial-started", group: "C · Trial Lifecycle", from: FROM, unsubscribe: true,
    subject: "תקופת הניסיון שלך ב-ClinicFlow התחילה",
    preheader: "14 יום להתרשם, בלי כרטיס אשראי.",
    trigger: "Trial activated", file: "trial-started.tsx",
  },
  "trial-ending": {
    id: "trial-ending", group: "C · Trial Lifecycle", from: FROM, unsubscribe: true,
    subject: "הניסיון שלך מסתיים בקרוב",
    preheader: "נותרו לך עוד כמה ימים — כדאי לשמור על הרצף.",
    trigger: "Trial day 11–12", file: "trial-ending.tsx",
  },
  "trial-ended": {
    id: "trial-ended", group: "C · Trial Lifecycle", from: FROM, unsubscribe: true,
    subject: "הניסיון הסתיים — הנתונים שלך נשמרו",
    preheader: "האפליקציה עברה למצב קריאה בלבד. הנתונים שלך שמורים.",
    trigger: "Trial expired → read-only", file: "trial-ended.tsx",
  },
  "win-back": {
    id: "win-back", group: "C · Trial Lifecycle", from: FROM, unsubscribe: true,
    subject: "הנתונים שלך עדיין כאן, מחכים לך",
    preheader: "שום דבר לא נמחק — אפשר להמשיך בדיוק מאיפה שעצרת.",
    trigger: "Lapsed 30+ days after trial", file: "win-back.tsx",
  },

  // ── D · Maintenance & renewal ──
  "renewal-upcoming": {
    id: "renewal-upcoming", group: "D · Maintenance & Renewal", from: FROM, unsubscribe: true,
    subject: "חידוש תקופת העדכונים שלך מתקרב",
    preheader: "העדכונים ותאימות תיקון 13 — כדי שהכל יישאר עדכני.",
    trigger: "30 days before updates period ends", file: "renewal-upcoming.tsx",
  },
  "renewal-confirmation": {
    id: "renewal-confirmation", group: "D · Maintenance & Renewal", from: FROM, unsubscribe: false,
    subject: "חידוש העדכונים אושר — תודה",
    preheader: "תקופת עדכונים חדשה נפתחה. הנה הקבלה.",
    trigger: "Renewal payment succeeded", file: "renewal-confirmation.tsx",
  },
  "updates-lapsed": {
    id: "updates-lapsed", group: "D · Maintenance & Renewal", from: FROM, unsubscribe: true,
    subject: "תקופת העדכונים הסתיימה — האפליקציה ממשיכה לעבוד",
    preheader: "התוכנה ממשיכה לעבוד לתמיד. רק העדכונים החדשים מושהים.",
    trigger: "Updates period lapsed", file: "updates-lapsed.tsx",
  },

  // ── E · Support & sales ──
  "contact-received": {
    id: "contact-received", group: "E · Support & Sales", from: FROM, unsubscribe: false,
    subject: "קיבלנו את פנייתך — נחזור אליך בהקדם",
    preheader: "הפנייה שלך התקבלה. נענה בדרך כלל תוך יום עסקים.",
    trigger: "Contact form submitted (auto-reply)", file: "contact-received.tsx",
  },
  "sales-response": {
    id: "sales-response", group: "E · Support & Sales", from: FROM, unsubscribe: false,
    subject: "מענה לפנייתך לגבי ClinicFlow Premium",
    preheader: "תודה על ההתעניינות — הנה המידע שביקשת.",
    trigger: "Sales/Premium inquiry (manual/assisted)", file: "sales-response.tsx",
  },
  "policy-update": {
    id: "policy-update", group: "E · Support & Sales", from: FROM, unsubscribe: true,
    subject: "עדכון במדיניות ובתנאי השימוש",
    preheader: "עדכנו את התנאים ומדיניות הפרטיות. הנה מה שהשתנה.",
    trigger: "Terms/privacy policy change", file: "policy-update.tsx",
  },
};

/** All ids, in registry order. */
export const EMAIL_IDS = Object.keys(EMAILS) as EmailId[];

/** Convenience lookup; throws on an unknown id. */
export function getEmailDef<Id extends EmailId>(id: Id): EmailDef<Id> {
  const def = EMAILS[id];
  if (!def) throw new Error(`email-registry: unknown template id "${id}"`);
  return def;
}
