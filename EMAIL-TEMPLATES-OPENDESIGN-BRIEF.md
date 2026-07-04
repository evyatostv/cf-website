# Open Design Brief — ClinicFlow Transactional Email Templates (for Resend)

> **Paste this whole document into Open Design as the project brief.**
> Goal: design **and produce production-ready code** for the full set of transactional/lifecycle emails ClinicFlow sends, built as **React Email** components that are sent through the **Resend API**. All emails are **Hebrew, right-to-left (RTL)**.

---

## 1. Product context (read first — it shapes tone and content)

**ClinicFlow** is a clinic-management **desktop app** for **solo/independent practitioners in Israel** (psychologists, physiotherapists, emotional therapists, dietitians, naturopaths, etc.). Its differentiators — which every email must quietly reinforce — are:

- **Fully offline.** The app runs on the practitioner's own computer; patient data never leaves their machine and never goes to the cloud.
- **Pay-once, no subscription.** One-time license. (A low, optional annual "updates & compliance" fee exists — see lifecycle emails.)
- **Privacy-first / תיקון 13.** Positioned as the compliant choice under Israel's Amendment 13 (תיקון 13) health-data privacy law.

**Hard constraint:** ClinicFlow is strictly offline and there are **NO patient-facing emails** (no appointment reminders, no clinical messaging). **Every template in this brief is business/commerce-facing** — sent to the *practitioner who is the customer*, about their account, purchase, license, and renewal. Do not design any patient-communication templates.

- Website / sender domain: **clinic-flow.co.il**
- Support / from address: **info@clinic-flow.co.il**
- Language: **Hebrew only**, RTL. (Provide an English fallback string only for the technical `subject`/preheader if trivial; body copy is Hebrew.)

---

## 2. Brand & visual direction

Pull exact tokens from the website (`index.html`, `Guidelines.md`, and the `src-2/` components) so emails match the site. Known brand palette to start from:

- **Primary blue:** `#0d47a1` · **Logo blue ("The Current"):** `#2756A6` · **Accent teal:** `#00838f`
- **Text:** `#1a2332` · **Muted text:** `#6b7c93` · **Hairlines/borders:** `#e1e6ec`
- **Backgrounds:** white `#ffffff`, soft `#f8fafb`
- **Logo:** the "The Current" / ClinicFlow logo (host a PNG/SVG on clinic-flow.co.il and reference by absolute URL — email clients can't use local/SVG-inline reliably; use a hosted **PNG** for the logo).

**Design language:** clean, calm, medical-grade trust. Generous white space, one clear primary action button per email, subtle use of the blue→teal gradient only in the header/CTA (keep body neutral for readability). Rounded corners (~12–16px) to match the site. No stock photos; use simple line icons if any.

**Recurring trust cues to include contextually:** small footer line reinforcing "המידע שלך נשאר על המחשב שלך" (your data stays on your computer) where relevant; a "תואם תיקון 13" chip on purchase/welcome emails.

---

## 3. Templates to design (complete set)

Design **all** of the following. Group A auth emails are routed through **Supabase Auth** (custom SMTP → Resend), so deliver them **also as raw HTML** with Supabase's template variables (e.g. `{{ .ConfirmationURL }}`, `{{ .Token }}`). Groups B–E are sent **directly via the Resend API** as React Email components.

### A. Account & authentication (Supabase-auth → Resend SMTP; provide HTML + variables)
1. **אימות כתובת אימייל** — Confirm email / verify address (`{{ .ConfirmationURL }}`)
2. **קישור כניסה / קוד חד-פעמי** — Magic link / OTP login (`{{ .Token }}` / `{{ .ConfirmationURL }}`)
3. **איפוס סיסמה** — Password reset (`{{ .ConfirmationURL }}`)
4. **שינוי כתובת אימייל** — Email-change confirmation
5. **ברוכים הבאים** — Welcome / account created (reinforce offline + privacy)

### B. Purchase & licensing (Resend API)
6. **אישור רכישה + קבלה** — Order/payment confirmation with receipt summary (plan name, price in ₪, one-time, VAT line). Note that a formal חשבונית מס/קבלה is a separate attachment/link if applicable.
7. **מסירת מפתח רישיון + הפעלה** — License key delivery + step-by-step activation guide (download link, key, how to activate offline). This is the most important email — make activation dead-simple.
8. **אישור שדרוג תוכנית** — Upgrade confirmation (shows credit of old plan applied, difference paid — per the "pay only the difference" upgrade policy).
9. **תשלום נכשל** — Payment failed / action needed (retry link).
10. **אישור החזר כספי** — Refund confirmation.
11. **העברת רישיון / הפעלה מחדש במכשיר חדש** — Device reactivation / license moved to a new computer (self-service reactivation confirmation).

### C. Trial lifecycle (Resend API)
12. **תקופת ניסיון התחילה** — Trial started (14-day, no-credit-card).
13. **הניסיון מסתיים בקרוב** — Trial ending soon (e.g. day 11–12), with upgrade CTA.
14. **הניסיון הסתיים** — Trial ended → app switched to read-only (data preserved), buy CTA.
15. **החזרה** — Win-back / "your data is still here" nudge after lapse.

### D. Maintenance & renewal (Resend API — the "updates & compliance" model)
16. **חידוש מתקרב** — Annual updates-&-compliance renewal upcoming (frame value: keeps tax-invoice formats & תיקון 13 compliance current; **app keeps working offline even if not renewed**).
17. **אישור חידוש** — Renewal receipt / new updates period confirmed.
18. **תקופת העדכונים הסתיימה** — Updates period lapsed (reassure: **the app still works forever**, only new updates paused; renew to resume).

### E. Support & sales (Resend API)
19. **קיבלנו את פנייתך** — Contact-form auto-reply / support acknowledgement.
20. **מענה לפניית Premium/מכירות** — Premium-plan / sales inquiry response.
21. **עדכון מדיניות** — Policy/terms update notice (links to /terms, /privacy).

---

## 4. Technical requirements (must follow)

**Framework & structure**
- Build with **React Email** (`@react-email/components`) — Resend's official templating library. One `.tsx` component per template in `emails/`.
- Create **one shared `<EmailLayout>`** (logo header, consistent footer, RTL wrapper) that every template composes, so branding is defined once.
- Root element: `<Html lang="he" dir="rtl">`. Ensure RTL text alignment throughout (`dir="rtl"`, right-aligned text, mirrored padding).
- Each template exports a typed props interface (e.g. `OrderConfirmationProps { name; plan; amount; licenseKey; ... }`) with sensible **preview/mock data** so it renders in the React Email preview server.

**Email-client compatibility (non-negotiable)**
- Max width **600px**, table/section-based layout (React Email handles this), **inline styles**, no external CSS.
- **Hebrew font strategy:** prefer a web font (Rubik / Heebo / Assistant) via `<Font>` **with a safe fallback of `Arial, sans-serif`** — many clients (Outlook, some Gmail) strip web fonts, and Arial renders Hebrew fine. Never rely on the web font alone.
- Logo as a **hosted PNG** (absolute `https://clinic-flow.co.il/...` URL), with `alt` text. No inline SVG.
- Include **preheader text** (hidden preview snippet) per email.
- **Dark-mode aware:** avoid pure-black-on-image traps; test that text stays legible if a client inverts.
- Provide a **plain-text version** for each (React Email can render text; ensure it's meaningful, not empty).
- Accessible: semantic headings, sufficient contrast, descriptive link/button text.

**Resend API integration (this is the "use their API" part)**
- For groups B–E, show the send pattern using the Resend Node SDK, passing the React component directly:
  ```ts
  import { Resend } from 'resend';
  import { OrderConfirmation } from './emails/order-confirmation';

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'ClinicFlow <info@clinic-flow.co.il>',
    to: [customerEmail],
    subject: 'אישור הרכישה שלך ב-ClinicFlow',
    react: OrderConfirmation({ name, plan, amount, licenseKey }),
    replyTo: 'info@clinic-flow.co.il',
  });
  ```
- Deliver a small **`sendEmail` helper** + a table mapping each template → its `from`, `subject` (Hebrew), and required props.
- Add a note on **deliverability setup**: verify the `clinic-flow.co.il` domain in Resend and configure **SPF, DKIM, and DMARC** DNS records; use a subdomain like `mail.clinic-flow.co.il` or `send.clinic-flow.co.il` for sending if preferred.
- For **group A**, output the templates as **Supabase-compatible HTML** (Supabase Auth → custom SMTP pointed at Resend), preserving Supabase's `{{ .Variable }}` placeholders.

**Legal / compliance (Israel + email norms)**
- Transactional emails (receipts, license, auth) don't require an unsubscribe link but **must** show sender identity + a physical/contact line in the footer.
- **Lifecycle/marketing** emails (trial nudges, win-back, renewal marketing, policy updates) **must** include an unsubscribe link and sender address.
- Footer on every email: ClinicFlow, clinic-flow.co.il, info@clinic-flow.co.il, and a short Hebrew line. Keep tone reassuring and privacy-forward.

---

## 5. Deliverables

1. `emails/` — all 21 templates as React Email `.tsx` components, each composing the shared `<EmailLayout>`, with typed props + mock preview data.
2. `emails/_layout.tsx` — the shared branded layout (header/logo/footer, RTL).
3. **Group A** also delivered as standalone **Supabase HTML** files with `{{ .Variable }}` placeholders.
4. `lib/resend.ts` — the `sendEmail` helper + Resend SDK setup.
5. A **template registry table** (template → from / subject / props / trigger).
6. A short **README**: how to run the React Email preview server, how sending works via Resend, and the DNS/deliverability checklist (SPF/DKIM/DMARC + domain verification).
7. Visual previews (rendered PNGs) of every template for review, desktop + mobile widths.

---

## 6. Acceptance criteria

- All copy is Hebrew, RTL, legible in Gmail, Outlook, and Apple Mail (test with web-font stripped → Arial fallback still correct).
- Every template renders from mock props in the preview server with no errors.
- Branding matches the live site (colors, logo, corner radius, spacing).
- Each email has one clear primary CTA, a preheader, a plain-text version, and the correct footer (with unsubscribe only where required).
- The license-delivery and activation email is the clearest of the set — a non-technical solo practitioner can activate the app offline by following it.
- Every email subtly reinforces at least one of: offline / pay-once / data-stays-with-you / תיקון 13 — without being salesy in receipts.
