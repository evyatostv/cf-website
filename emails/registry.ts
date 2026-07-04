/**
 * ClinicFlow email registry — the canonical map of every transactional /
 * lifecycle email: file, component, group, sender, Hebrew subject, props,
 * trigger, and whether an unsubscribe link is legally required.
 *
 * Legal rule (§4): transactional mail (auth, receipts, license) needs NO
 * unsubscribe; lifecycle/marketing mail (trial nudges, win-back, renewal
 * reminders, policy updates) MUST include one.
 */

export type EmailGroup =
  | 'A · Auth'
  | 'B · Purchase & Licensing'
  | 'C · Trial Lifecycle'
  | 'D · Maintenance & Renewal'
  | 'E · Support & Sales';

export interface EmailEntry {
  id: number;
  file: string;
  component: string;
  group: EmailGroup;
  from: string;
  subject: string; // Hebrew
  preheader: string; // Hebrew
  props: string[]; // required prop names
  trigger: string;
  unsubscribe: boolean;
  /** Group A also ships as Supabase-Auth HTML with {{ .Variable }} placeholders. */
  supabaseHtml?: string;
}

const FROM = 'ClinicFlow <info@clinic-flow.co.il>';

export const registry: EmailEntry[] = [
  // ── A · Account & authentication (also Supabase HTML) ──
  {
    id: 1, file: 'confirm-email.tsx', component: 'ConfirmEmail', group: 'A · Auth', from: FROM,
    subject: 'אימות כתובת האימייל שלך ב-ClinicFlow',
    preheader: 'עוד לחיצה אחת ונסיים את ההרשמה שלך.',
    props: ['confirmationUrl'], trigger: 'Supabase Auth · signup / email confirm',
    unsubscribe: false, supabaseHtml: 'supabase/confirm-email.html',
  },
  {
    id: 2, file: 'magic-link.tsx', component: 'MagicLink', group: 'A · Auth', from: FROM,
    subject: 'קוד הכניסה שלך ל-ClinicFlow',
    preheader: 'קוד חד-פעמי לכניסה לחשבון שלך.',
    props: ['token', 'confirmationUrl'], trigger: 'Supabase Auth · magic link / OTP',
    unsubscribe: false, supabaseHtml: 'supabase/magic-link.html',
  },
  {
    id: 3, file: 'reset-password.tsx', component: 'ResetPassword', group: 'A · Auth', from: FROM,
    subject: 'איפוס הסיסמה שלך ב-ClinicFlow',
    preheader: 'קיבלנו בקשה לאיפוס הסיסמה שלך.',
    props: ['confirmationUrl'], trigger: 'Supabase Auth · password recovery',
    unsubscribe: false, supabaseHtml: 'supabase/reset-password.html',
  },
  {
    id: 4, file: 'change-email.tsx', component: 'ChangeEmail', group: 'A · Auth', from: FROM,
    subject: 'אישור שינוי כתובת האימייל',
    preheader: 'אשרו את כתובת האימייל החדשה לחשבון שלך.',
    props: ['confirmationUrl', 'newEmail'], trigger: 'Supabase Auth · email change',
    unsubscribe: false, supabaseHtml: 'supabase/change-email.html',
  },
  {
    id: 5, file: 'welcome.tsx', component: 'Welcome', group: 'A · Auth', from: FROM,
    subject: 'ברוכים הבאים ל-ClinicFlow',
    preheader: 'החשבון שלך מוכן. הנה מה שחשוב לדעת.',
    props: ['name'], trigger: 'After first successful signup + confirm',
    unsubscribe: false, supabaseHtml: 'supabase/welcome.html',
  },

  // ── B · Purchase & licensing ──
  {
    id: 6, file: 'order-confirmation.tsx', component: 'OrderConfirmation', group: 'B · Purchase & Licensing', from: FROM,
    subject: 'אישור הרכישה שלך ב-ClinicFlow',
    preheader: 'תודה על הרכישה — הנה סיכום ההזמנה שלך.',
    props: ['name', 'plan', 'amount', 'vat', 'total', 'orderId', 'invoiceUrl?'],
    trigger: 'Stripe · payment succeeded', unsubscribe: false,
  },
  {
    id: 7, file: 'license-delivery.tsx', component: 'LicenseDelivery', group: 'B · Purchase & Licensing', from: FROM,
    subject: 'מפתח הרישיון שלך ל-ClinicFlow מוכן',
    preheader: 'מפתח הרישיון + הפעלה ב-3 שלבים, גם ללא אינטרנט.',
    props: ['name', 'plan', 'licenseKey', 'downloadUrl', 'os?'],
    trigger: 'After order confirmation · license issued', unsubscribe: false,
  },
  {
    id: 8, file: 'upgrade-confirmation.tsx', component: 'UpgradeConfirmation', group: 'B · Purchase & Licensing', from: FROM,
    subject: 'שדרוג התוכנית שלך אושר',
    preheader: 'שילמת רק את ההפרש — הנה הפירוט.',
    props: ['name', 'fromPlan', 'toPlan', 'credit', 'difference', 'licenseKey?'],
    trigger: 'Stripe · plan upgrade paid', unsubscribe: false,
  },
  {
    id: 9, file: 'payment-failed.tsx', component: 'PaymentFailed', group: 'B · Purchase & Licensing', from: FROM,
    subject: 'התשלום לא הושלם — נדרשת פעולה',
    preheader: 'לא הצלחנו לחייב את אמצעי התשלום. אפשר לנסות שוב.',
    props: ['name', 'plan', 'amount', 'retryUrl'],
    trigger: 'Stripe · payment failed', unsubscribe: false,
  },
  {
    id: 10, file: 'refund-confirmation.tsx', component: 'RefundConfirmation', group: 'B · Purchase & Licensing', from: FROM,
    subject: 'אישור החזר כספי מ-ClinicFlow',
    preheader: 'ההחזר שלך עובד — הנה הפרטים.',
    props: ['name', 'plan', 'amount', 'refundId', 'days?'],
    trigger: 'Stripe · refund issued', unsubscribe: false,
  },
  {
    id: 11, file: 'device-reactivation.tsx', component: 'DeviceReactivation', group: 'B · Purchase & Licensing', from: FROM,
    subject: 'הרישיון הופעל מחדש במכשיר חדש',
    preheader: 'הפעלת את ClinicFlow במחשב חדש — אישור אבטחה.',
    props: ['name', 'deviceName', 'date', 'licenseKey'],
    trigger: 'License activated on a new device', unsubscribe: false,
  },

  // ── C · Trial lifecycle (marketing → unsubscribe) ──
  {
    id: 12, file: 'trial-started.tsx', component: 'TrialStarted', group: 'C · Trial Lifecycle', from: FROM,
    subject: 'תקופת הניסיון שלך ב-ClinicFlow התחילה',
    preheader: '14 יום להתרשם, בלי כרטיס אשראי.',
    props: ['name', 'daysTotal', 'endDate', 'downloadUrl'],
    trigger: 'Trial activated', unsubscribe: true,
  },
  {
    id: 13, file: 'trial-ending.tsx', component: 'TrialEnding', group: 'C · Trial Lifecycle', from: FROM,
    subject: 'הניסיון שלך מסתיים בקרוב',
    preheader: 'נותרו לך עוד כמה ימים — כדאי לשמור על הרצף.',
    props: ['name', 'daysLeft', 'endDate', 'upgradeUrl'],
    trigger: 'Trial day 11–12', unsubscribe: true,
  },
  {
    id: 14, file: 'trial-ended.tsx', component: 'TrialEnded', group: 'C · Trial Lifecycle', from: FROM,
    subject: 'הניסיון הסתיים — הנתונים שלך נשמרו',
    preheader: 'האפליקציה עברה למצב קריאה בלבד. הנתונים שלך שמורים.',
    props: ['name', 'buyUrl'],
    trigger: 'Trial expired → read-only', unsubscribe: true,
  },
  {
    id: 15, file: 'win-back.tsx', component: 'WinBack', group: 'C · Trial Lifecycle', from: FROM,
    subject: 'הנתונים שלך עדיין כאן, מחכים לך',
    preheader: 'שום דבר לא נמחק — אפשר להמשיך בדיוק מאיפה שעצרת.',
    props: ['name', 'resumeUrl'],
    trigger: 'Lapsed 30+ days after trial', unsubscribe: true,
  },

  // ── D · Maintenance & renewal ──
  {
    id: 16, file: 'renewal-upcoming.tsx', component: 'RenewalUpcoming', group: 'D · Maintenance & Renewal', from: FROM,
    subject: 'חידוש תקופת העדכונים שלך מתקרב',
    preheader: 'העדכונים ותאימות תיקון 13 — כדי שהכל יישאר עדכני.',
    props: ['name', 'plan', 'renewDate', 'renewUrl', 'amount'],
    trigger: '30 days before updates period ends', unsubscribe: true,
  },
  {
    id: 17, file: 'renewal-confirmation.tsx', component: 'RenewalConfirmation', group: 'D · Maintenance & Renewal', from: FROM,
    subject: 'חידוש העדכונים אושר — תודה',
    preheader: 'תקופת עדכונים חדשה נפתחה. הנה הקבלה.',
    props: ['name', 'plan', 'amount', 'newPeriodEnd', 'invoiceUrl?'],
    trigger: 'Renewal payment succeeded', unsubscribe: false,
  },
  {
    id: 18, file: 'updates-lapsed.tsx', component: 'UpdatesLapsed', group: 'D · Maintenance & Renewal', from: FROM,
    subject: 'תקופת העדכונים הסתיימה — האפליקציה ממשיכה לעבוד',
    preheader: 'התוכנה ממשיכה לעבוד לתמיד. רק העדכונים החדשים מושהים.',
    props: ['name', 'plan', 'renewUrl'],
    trigger: 'Updates period lapsed', unsubscribe: true,
  },

  // ── E · Support & sales ──
  {
    id: 19, file: 'contact-received.tsx', component: 'ContactReceived', group: 'E · Support & Sales', from: FROM,
    subject: 'קיבלנו את פנייתך — נחזור אליך בהקדם',
    preheader: 'הפנייה שלך התקבלה. נענה בדרך כלל תוך יום עסקים.',
    props: ['name', 'messagePreview?', 'ticketId?'],
    trigger: 'Contact form submitted (auto-reply)', unsubscribe: false,
  },
  {
    id: 20, file: 'sales-response.tsx', component: 'SalesResponse', group: 'E · Support & Sales', from: FROM,
    subject: 'מענה לפנייתך לגבי ClinicFlow Premium',
    preheader: 'תודה על ההתעניינות — הנה המידע שביקשת.',
    props: ['name', 'agentName?', 'ctaUrl?'],
    trigger: 'Sales/Premium inquiry (manual/assisted)', unsubscribe: false,
  },
  {
    id: 21, file: 'policy-update.tsx', component: 'PolicyUpdate', group: 'E · Support & Sales', from: FROM,
    subject: 'עדכון במדיניות ובתנאי השימוש',
    preheader: 'עדכנו את התנאים ומדיניות הפרטיות. הנה מה שהשתנה.',
    props: ['effectiveDate', 'termsUrl', 'privacyUrl', 'name?'],
    trigger: 'Terms/privacy policy change', unsubscribe: true,
  },
];

export default registry;
