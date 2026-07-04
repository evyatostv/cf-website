# ClinicFlow — Transactional & Lifecycle Emails

Production email system for ClinicFlow, built with **[React Email](https://react.email)** and sent through the **[Resend API](https://resend.com)**. All copy is **Hebrew, RTL**. Every template composes one shared `<EmailLayout>` so branding is defined once.

> **Product reminder:** ClinicFlow is strictly offline desktop software. **There are NO patient-facing emails.** Every template here is business/commerce-facing — sent to the *practitioner who is the customer*, about their account, purchase, license, and renewal. Each email subtly reinforces one of: **offline · pay-once · data-stays-with-you · תיקון 13**.

---

## 1. Structure

```
emails/
├── _layout.tsx            # Shared branded RTL layout (header logo, gradient rule, footer)
├── theme.ts               # Design tokens + shared inline-style fragments (mirrors the site)
├── components/ui.tsx      # Primitives: CtaButton, KeyBox, Receipt/ReceiptRow, Callout, Chip, Steps, Divider, LinkFallback
├── registry.ts            # Canonical map: file → component, group, from, subject, props, trigger, unsubscribe
├── <template>.tsx         # 21 templates (groups A–E), each with typed props + PreviewProps mock
├── supabase/*.html        # Group A auth emails as standalone Supabase-Auth HTML ({{ .Variable }})
└── README.md              # This file

emails/DESIGN-SOURCE.html  # Version-controlled copy of the APPROVED design (tokens + Hebrew copy)
lib/resend.ts              # Node-side sendEmail() helper + Resend SDK (groups B–E, if sent from Node)
public/logo/cf-lockup-horizontal.png   # Hosted email logo (absolute URL used in templates)
email-previews.html        # Static visual gallery of all 21 (open in any browser, no build)

supabase/functions/
├── deno.json                    # Deno JSX config (react-jsx, jsxImportSource) + npm import map
└── _shared/
    ├── send-email.ts            # Deno sendEmail() → POST https://api.resend.com/emails
    ├── render.ts                # React Email .tsx → HTML string (npm:@react-email/render)
    ├── email-registry.ts        # Typed id → {subject, from, unsubscribe, props} registry
    └── emails/
        ├── ping.tsx             # Tiny sample template proving the Deno render pipeline
        └── ping.test.ts         # Deno test/run that renders ping.tsx to HTML
```

> **`emails/DESIGN-SOURCE.html` is the source of truth** for tokens, copy, subjects and layout. Copied verbatim from the approved `email-previews.md`. When copy or design changes, update it there first.

## 2. Install & preview

```bash
npm i react-email @react-email/components resend react react-dom
```

Add to `package.json` scripts:

```json
{ "scripts": { "email": "email dev --dir emails --port 3030" } }
```

Run the preview server — renders every template from its `PreviewProps` mock data:

```bash
npm run email    # → http://localhost:3030
```

For a **no-build visual review** (e.g. for design sign-off), just open `email-previews.html` in a browser — it renders all 21 in RTL with a desktop/mobile toggle.

## 3. Sending (groups B–E) via Resend

All non-auth email is sent by passing the React component straight to Resend through the `sendEmail` helper:

```ts
import { sendEmail } from '@/lib/resend';
import { LicenseDelivery } from '@/emails/license-delivery';
import { registry } from '@/emails/registry';

const t = registry.find(r => r.component === 'LicenseDelivery')!;

await sendEmail({
  to: customer.email,
  subject: t.subject,                       // Hebrew subject from the registry
  react: LicenseDelivery({ name, plan, licenseKey, downloadUrl }),
});
```

`sendEmail` sets `from`, `replyTo: info@clinic-flow.co.il`, and — when you pass `unsubscribeUrl` — the `List-Unsubscribe` headers. See `lib/resend.ts`.

Env: `RESEND_API_KEY` (required), `EMAIL_FROM` (optional override).

## 3b. Edge-function send pipeline (Deno) — `supabase/functions/_shared/`

The wiring lives in Supabase **Edge Functions (Deno)**, not Node. Three shared modules:

- **`_shared/send-email.ts`** — Deno `sendEmail({ to, subject, html, text?, tags?, replyTo?, idempotencyKey? })`. POSTs to `https://api.resend.com/emails` using `Deno.env.get("RESEND_API_KEY")`, from `ClinicFlow <info@clinic-flow.co.il>`, `reply_to: info@clinic-flow.co.il`. Returns the Resend id; throws on non-2xx or missing key. Pass `idempotencyKey` to make webhook retries (Stripe/Supabase deliver at-least-once) safe — it sets the `Idempotency-Key` header.
- **`_shared/render.ts`** — `render(<Template .../>)` turns a React Email `.tsx` into an HTML string via `npm:@react-email/render`.
- **`_shared/email-registry.ts`** — the **typed** registry the wiring agents import: `EMAILS[id]` gives `{ subject, preheader, from, unsubscribe, trigger, file }`, and `EmailPropMap[id]` / `PropsFor<id>` gives the exact prop shape per template. Subjects are verbatim from DESIGN-SOURCE.

```ts
import { render } from "../_shared/render.ts";
import { sendEmail } from "../_shared/send-email.ts";
import { EMAILS } from "../_shared/email-registry.ts";
import { LicenseDelivery } from "../_shared/emails/license-delivery.tsx"; // template mirror
import * as React from "react";

const def = EMAILS["license-delivery"];
const html = await render(React.createElement(LicenseDelivery, { name, plan, licenseKey, downloadUrl }));
await sendEmail({
  to,
  subject: def.subject,
  from: def.from,
  html,
  tags: [{ name: "template", value: def.id }],
  idempotencyKey: `license-${orderId}`,
});
```

### Render-pipeline decision (RECOMMENDED path — implemented & proven)

We use the **runtime-render** approach: React Email `.tsx` is rendered to HTML *inside the Deno edge runtime* via `npm:@react-email/render` + `npm:react`. JSX is configured in **`supabase/functions/deno.json`** (`compilerOptions.jsx: "react-jsx"`, `jsxImportSource: "npm:react@19.2.7"`) with an import map pinning `react`/`react-dom`/`@react-email/render`/`@react-email/components`.

**Why:** no build step, no committed `.html` artifacts to drift, one template source. The alternative (a Node `email:build` that emits `_shared/emails/<id>.html` with `{{VAR}}` placeholders + a Deno string-interpolation helper) was not needed.

**Proof:** `_shared/emails/ping.tsx` is a tiny sample template; `_shared/emails/ping.test.ts` renders it. From `supabase/functions/`:

```bash
deno run -A --config deno.json _shared/emails/ping.test.ts   # prints the rendered HTML
deno test -A --config deno.json _shared/emails/ping.test.ts  # asserts <html>, dir="rtl", Hebrew props
```

This was executed during scaffolding and produced valid RTL HTML (`dir="rtl"`, `lang="he"`, the Hebrew prop rendered).

> **React version note:** `@react-email/render` pulls `react-dom@19`, so the edge runtime pins **React 19** (in `deno.json`). This is fully isolated from the Vite marketing app, which stays on **React 18** — the two runtimes never share a module graph.

> **Note on the 21 real templates:** they currently live under `emails/*.tsx` (authoring/preview home). To render them from edge functions, mirror/symlink them into `_shared/emails/` (or point `render.ts` at them). The wiring agents own that step; the infra here (`send-email`, `render`, `email-registry`, and the proven `deno.json` JSX config) is ready.

## 4. Group A — auth emails via Supabase

Auth email (confirm, magic link / OTP, reset, email-change, welcome) is sent by **Supabase Auth**, not by `sendEmail`. Point Supabase at Resend and paste the HTML:

1. **Supabase → Project Settings → Authentication → SMTP Settings** → enable custom SMTP:
   - Host `smtp.resend.com`, Port `465`, User `resend`, Password = your `RESEND_API_KEY`, sender `info@clinic-flow.co.il`.
2. **Authentication → Email Templates** → paste each `emails/supabase/*.html` into its matching template. Placeholders are preserved:
   - `{{ .ConfirmationURL }}` — confirm / reset / email-change / magic-link button
   - `{{ .Token }}` — the OTP code box in the magic-link template
3. The `.tsx` versions of these five exist too (for the preview server / a future non-Supabase path), but **Supabase sends the HTML**.

## 5. Deliverability — DNS setup (do this before going live)

Currently the repo's `notify-contact` function sends from the Resend sandbox (`onboarding@resend.dev`). To send from `clinic-flow.co.il`:

1. **Resend → Domains → Add Domain** → `clinic-flow.co.il` (or a sending subdomain like `mail.clinic-flow.co.il` / `send.clinic-flow.co.il` — recommended, keeps the root domain's reputation separate).
2. Add the DNS records Resend shows:
   - **SPF** — `TXT` on the sending domain: `v=spf1 include:_spf.resend.com ~all`
   - **DKIM** — the `CNAME`/`TXT` record(s) Resend generates (domain keys).
   - **DMARC** — `TXT` at `_dmarc.clinic-flow.co.il`: start with `v=DMARC1; p=none; rua=mailto:info@clinic-flow.co.il;` then tighten to `p=quarantine` once aligned.
3. Wait for verification (green in Resend), then set `EMAIL_FROM='ClinicFlow <info@mail.clinic-flow.co.il>'` (or the root) and update the Supabase SMTP sender to match.

## 6. Template registry

| # | Group | Template | Subject (he) | Unsub | Trigger |
|--:|-------|----------|--------------|:-----:|---------|
| 1 | A · Auth | `confirm-email` | אימות כתובת האימייל שלך ב-ClinicFlow | — | Supabase signup / confirm |
| 2 | A · Auth | `magic-link` | קוד הכניסה שלך ל-ClinicFlow | — | Supabase magic link / OTP |
| 3 | A · Auth | `reset-password` | איפוס הסיסמה שלך ב-ClinicFlow | — | Supabase password recovery |
| 4 | A · Auth | `change-email` | אישור שינוי כתובת האימייל | — | Supabase email change |
| 5 | A · Auth | `welcome` | ברוכים הבאים ל-ClinicFlow | — | After first signup + confirm |
| 6 | B · Purchase | `order-confirmation` | אישור הרכישה שלך ב-ClinicFlow | — | Stripe payment succeeded |
| 7 | B · Purchase | `license-delivery` ⭐ | מפתח הרישיון שלך ל-ClinicFlow מוכן | — | License issued (most important) |
| 8 | B · Purchase | `upgrade-confirmation` | שדרוג התוכנית שלך אושר | — | Stripe upgrade paid |
| 9 | B · Purchase | `payment-failed` | התשלום לא הושלם — נדרשת פעולה | — | Stripe payment failed |
| 10 | B · Purchase | `refund-confirmation` | אישור החזר כספי מ-ClinicFlow | — | Stripe refund issued |
| 11 | B · Purchase | `device-reactivation` | הרישיון הופעל מחדש במכשיר חדש | — | License moved to new device |
| 12 | C · Trial | `trial-started` | תקופת הניסיון שלך ב-ClinicFlow התחילה | ✔ | Trial activated |
| 13 | C · Trial | `trial-ending` | הניסיון שלך מסתיים בקרוב | ✔ | Trial day 11–12 |
| 14 | C · Trial | `trial-ended` | הניסיון הסתיים — הנתונים שלך נשמרו | ✔ | Trial expired → read-only |
| 15 | C · Trial | `win-back` | הנתונים שלך עדיין כאן, מחכים לך | ✔ | Lapsed 30+ days |
| 16 | D · Renewal | `renewal-upcoming` | חידוש תקופת העדכונים שלך מתקרב | ✔ | 30 days before updates end |
| 17 | D · Renewal | `renewal-confirmation` | חידוש העדכונים אושר — תודה | — | Renewal payment succeeded |
| 18 | D · Renewal | `updates-lapsed` | תקופת העדכונים הסתיימה — האפליקציה ממשיכה לעבוד | ✔ | Updates period lapsed |
| 19 | E · Support | `contact-received` | קיבלנו את פנייתך — נחזור אליך בהקדם | — | Contact form (auto-reply) |
| 20 | E · Support | `sales-response` | מענה לפנייתך לגבי ClinicFlow Premium | — | Sales / Premium inquiry |
| 21 | E · Support | `policy-update` | עדכון במדיניות ובתנאי השימוש | ✔ | Terms / privacy change |

Full `from` / props for each are in `registry.ts`.

## 7. Email-client compatibility (built in)

- **Max width 600px**, table/section layout (React Email), **inline styles only**.
- **Hebrew font:** Heebo via `<Font>` **with an Arial fallback** — Outlook/Gmail strip web fonts; Arial renders Hebrew correctly, so nothing breaks.
- **Logo:** hosted **PNG** (`https://clinic-flow.co.il/logo/cf-lockup-horizontal.png`) with `alt` — never inline SVG.
- **Preheader** (hidden preview snippet) on every template.
- **Plain-text** version rendered automatically by React Email.
- **Dark-mode aware:** `color-scheme: light`, no black-on-image traps.
- **Accessible:** semantic headings, AA contrast, descriptive button text.

## 8. Legal (Israel + email norms)

- Transactional mail (auth, receipts, license) shows sender identity + contact — **no unsubscribe**.
- Lifecycle/marketing mail (trial nudges, win-back, renewal reminders, policy updates) **includes an unsubscribe link** — the `unsubscribe` column above and the `unsubscribe` flag in `registry.ts`. Pass `unsubscribeUrl` to `sendEmail` for those so the `List-Unsubscribe` header is set too.
