# ClinicFlow — Transactional & Lifecycle Email System

**Status:** built + verified (2026-07-02). This is the authoritative go-live runbook.
Stack: **React Email** templates → rendered inside **Deno / Supabase Edge Functions** →
sent via the **Resend** REST API.

This doc covers: architecture, per-template live/pending status, the manual
owner-only go-live steps, how to test before shipping, and what is explicitly
**not** done.

---

## 1 · Overview / architecture

### The pipeline

```
emails/<id>.tsx          ← 21 React Email templates (single source of truth)
   │  (imported directly, NOT duplicated)
   ▼
_shared/send-template.ts ← sendTemplate(id, to, props): looks up registry,
   │                        renders the component to HTML + plaintext,
   │                        applies per-template prop adapters
   ▼
_shared/send-email.ts    ← sendEmail(): POST https://api.resend.com/emails
   │                        (Bearer RESEND_API_KEY, idempotency key, tags,
   │                         List-Unsubscribe for lifecycle mail)
   ▼
Resend  →  inbox (from: ClinicFlow <info@clinic-flow.co.il>)
```

Supporting `_shared/` modules:

| File | Role |
|------|------|
| `email-registry.ts` | The typed contract for all 21 templates: id union, `EmailPropMap` (per-template prop shape), Hebrew `subject`/`preheader`, verified `from`, `unsubscribe` flag, trigger. |
| `emails/fixtures.ts` | Realistic mock props (`PropsFor<id>`) for every template — used by the render test and doubles as a compile-time check the contract is satisfiable. |
| `send-template.ts` | The **single render seam**. Imports the 21 `emails/*.tsx` directly; maps registry props → component props via optional `adapt()` where a component's prop names diverge from the registry. |
| `send-email.ts` | The single Resend choke-point. Adds `Idempotency-Key`, `tags`, and RFC-8058 `List-Unsubscribe` + `List-Unsubscribe-Post` (one-click) for lifecycle mail only. |
| `email-once.ts` | `sendOnce(supabase, {paymentId, template, to, props})` — hard dedupe on the `email_log` `UNIQUE(payment_id, template)` constraint for at-least-once webhooks. Never throws. |
| `license.ts` | `getOrCreateLicenseKey()` — issues a stable `CF-<PLAN>-XXXX-XXXX-XXXX` key once, reused on every webhook retry. |
| `receipt.ts` | `vatBreakdown()` (18% back-calc), `formatAgorot()`/`formatShekels()`, `planLabel()`. |
| `render.ts` | Thin wrapper over `@react-email/render`. |

### Single source of truth

The 21 authoring templates live in `emails/*.tsx`. They are imported **directly**
by `send-template.ts` — never copied into `_shared/`. The same files back the
`npm run email:dev` preview server and the `npm run email:build` export. The
authoring components sometimes name a prop differently from the canonical
registry (e.g. registry `pricingUrl` vs component `upgradeUrl` on `trial-ending`);
those deltas are handled by an `adapt()` mapper in `send-template.ts`'s
`COMPONENTS` table, so **templates are never edited to match the wiring**.

### React 18 / 19 resolution note (important)

`supabase/functions/deno.json` sets:

```jsonc
"nodeModulesDir": "manual",
"unstable": ["sloppy-imports"]
```

- **`nodeModulesDir: "manual"`** forces React/react-dom to resolve from the
  repo-root `node_modules` (React **18**, matching `package.json` and the
  `email:dev` toolchain). This guarantees a **single** React/react-dom instance
  shared by the JSX runtime, `@react-email/components`, and `@react-email/render`.
  Without it, `@react-email/render@2.x` drags its own **react-dom@19** (a second
  React copy) which either hangs the render or throws
  *"Objects are not valid as a React child"*.
- **`sloppy-imports`** lets Deno resolve the templates' extensionless relative
  imports (`./_layout`, `./theme`, `./components/ui`). No import map is needed;
  bare specifiers (`react`, `react-dom`, `@react-email/*`) resolve from
  `node_modules`.

### Preview locally

```bash
npm run email:dev     # React Email dev server (live preview of emails/*.tsx)
npm run email:build   # export all 21 → emails/.out/*.html (+ _layout.html)
```

---

## 2 · Status table — all 21 templates

Trigger status legend:
- **LIVE** — wired in a deployed edge function; fires automatically on an event.
- **MANUAL** — installed in a Supabase dashboard slot; GoTrue/owner sends it.
- **APP-TRIGGERED** — sent by an edge function the app must explicitly call.
- **SCAFFOLD** — template + registry + fixture exist and render, but **no wiring
  calls it yet** (no automatic trigger). Ready to wire.

| # | Template id | Group | Trigger function → event | Status |
|---|-------------|-------|--------------------------|--------|
| 1 | `confirm-email` | A · Auth | Supabase Auth (GoTrue) · signup → *Confirm signup* slot | MANUAL |
| 2 | `magic-link` | A · Auth | Supabase Auth · magic link/OTP → *Magic Link* slot | MANUAL |
| 3 | `reset-password` | A · Auth | Supabase Auth · recovery → *Reset Password* slot | MANUAL |
| 4 | `change-email` | A · Auth | Supabase Auth · email change → *Change Email* slot | MANUAL |
| 5 | `welcome` | A · Auth | `send-welcome` fn ← app calls after first confirmed login | APP-TRIGGERED |
| 6 | `order-confirmation` | B · Purchase | `stripe-webhook` `payment_intent.succeeded`/`checkout.session.completed` (new purchase) **+** `allpay-webhook` status===1 | LIVE (via `sendOnce`) |
| 7 | `license-delivery` | B · Purchase | Same as #6 — sent right after order-confirmation (and on upgrade if user had no license) | LIVE (via `sendOnce`) |
| 8 | `upgrade-confirmation` | B · Purchase | `stripe-webhook` + `allpay-webhook`, when prior plan ≠ new plan (upgrade path) | LIVE (via `sendOnce`) |
| 9 | `payment-failed` | B · Purchase | `stripe-webhook` `payment_intent.payment_failed` **+** `allpay-webhook` status===2 (definitive decline only) | LIVE (via `sendTemplate`) |
| 10 | `refund-confirmation` | B · Purchase | `stripe-webhook` `charge.refunded` | LIVE (Stripe only — see §6) |
| 11 | `device-reactivation` | B · Purchase | *(license activated on a new device)* — no caller | SCAFFOLD |
| 12 | `trial-started` | C · Trial | *(trial activated)* — no caller | SCAFFOLD |
| 13 | `trial-ending` | C · Trial | *(trial day 11–12)* — no caller | SCAFFOLD |
| 14 | `trial-ended` | C · Trial | *(trial expired → read-only)* — no caller | SCAFFOLD |
| 15 | `win-back` | C · Trial | *(lapsed 30+ days)* — no caller | SCAFFOLD |
| 16 | `renewal-upcoming` | D · Renewal | *(30 days before updates period ends)* — no caller | SCAFFOLD |
| 17 | `renewal-confirmation` | D · Renewal | *(renewal payment succeeded)* — no caller | SCAFFOLD |
| 18 | `updates-lapsed` | D · Renewal | *(updates period lapsed)* — no caller | SCAFFOLD |
| 19 | `contact-received` | E · Support | `notify-contact` fn ← DB webhook on `contact_messages` INSERT (auto-reply) | LIVE (via `sendTemplate`) |
| 20 | `sales-response` | E · Support | *(sales/Premium inquiry — manual/assisted)* — no caller | SCAFFOLD / MANUAL |
| 21 | `policy-update` | E · Support | *(terms/privacy change)* — no caller | SCAFFOLD / MANUAL |

**Summary:** 6 templates fire automatically today from deployed edge functions
(`order-confirmation`, `license-delivery`, `upgrade-confirmation`, `payment-failed`,
`refund-confirmation`, `contact-received`); `welcome` is app-triggered via
`send-welcome`; the 4 auth templates are dashboard/GoTrue slots; the remaining
**9 lifecycle/renewal + `device-reactivation` + `sales-response`/`policy-update`**
are rendered/tested but **not yet wired to any trigger** (Phase 2).

### Wired edge functions (source of the trigger table)

| Function | `verify_jwt` | Uses | Templates it can send |
|----------|--------------|------|-----------------------|
| `stripe-webhook` | false | `sendOnce` + `sendTemplate` | order-confirmation, license-delivery, upgrade-confirmation, payment-failed, refund-confirmation |
| `allpay-webhook` | false | `sendOnce` + `sendTemplate` | order-confirmation, license-delivery, upgrade-confirmation, payment-failed |
| `notify-contact` | false | `sendTemplate` + one raw Resend POST (internal notice) | contact-received (auto-reply) |
| `send-welcome` | true | `sendTemplate` | welcome |
| `process-email-lifecycle` | false (cron) | `sendOnce` | trial-ending, trial-ended, win-back — **guarded no-op** until `LIFECYCLE_EMAILS_ENABLED=true` + state columns populated |
| `activate-license` | true | `sendTemplate` | device-reactivation — **reference stub** (desktop-app device/slot tracking is a prerequisite) |

The trial worker defaults to disabled. Annual renewal templates are historical previews. ClinicFlow Full costs ₪1,499 once per computer.

---

## 3 · GO-LIVE — manual steps (owner only)

These are the steps only the account owner can perform. Do them in order.

### Step 1 — Resend: domain + DNS + API key
1. Resend dashboard → **Domains** → add `clinic-flow.co.il`.
2. Add the DNS records Resend shows at your DNS host:
   - **SPF**: TXT `@` → include `include:_spf.resend.com` (merge into any existing SPF).
   - **DKIM**: the CNAME record(s) Resend lists (e.g. `resend._domainkey…`).
   - **DMARC**: TXT `_dmarc` → e.g. `v=DMARC1; p=none; rua=mailto:dmarc@clinic-flow.co.il` (tighten to `quarantine`/`reject` later).
3. Wait for Resend to show the domain **Verified**.
4. Create an **API key** (`re_…`). This same value is used both as `RESEND_API_KEY`
   and as the Auth SMTP password (Step 6).

### Step 2 — Supabase secrets
Set the Resend key; confirm the others already exist:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
# confirm existing (do NOT overwrite unless rotating):
supabase secrets list   # expect: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
                         # SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL,
                         # ALLPAY_KEY, ALLPAY_LOGIN, (optional NOTIFY_EMAIL, SITE_URL)
```

`send-email.ts` throws `RESEND_API_KEY is not set` if this is missing, so the
purchase/auto-reply sends will no-op (best-effort) until it's set.

### Step 3 — Apply migrations
```bash
supabase db push
```
Applies:
- `20260702000000_license_keys.sql` → adds `user_access.license_key` (UNIQUE) +
  creates the `email_log` table with `UNIQUE(payment_id, template)` (the `sendOnce`
  idempotency guard) + RLS enabled (service-role only).
- `20260702000000_welcome_sent.sql` → adds `user_access.welcome_sent_at` (the
  send-welcome dedupe marker).

- `20260702000002_lifecycle.sql` → adds `user_access.trial_started_at` +
  `updates_period_ends` (Phase-2 state columns; stay NULL until the future
  trial/renewal flows populate them).

### Step 4 — Deploy functions
```bash
supabase functions deploy stripe-webhook allpay-webhook notify-contact send-welcome
# Phase-2 scaffolds (safe to deploy; stay no-op until armed — see §5):
supabase functions deploy process-email-lifecycle activate-license
```

### Step 5 — Stripe dashboard: subscribe the new events
The order/upgrade emails already fire on `payment_intent.succeeded` (and the
legacy `checkout.session.completed`). To enable the two new sends, add to the
webhook endpoint's subscribed events:
- `payment_intent.payment_failed` → sends `payment-failed`
- `charge.refunded` → sends `refund-confirmation`

> For `refund-confirmation` to carry a plan label, set `metadata.plan` on the
> charge/payment where possible; otherwise it falls back gracefully.

### Step 6 — Supabase Auth: SMTP → Resend + install the 5 templates
1. Authentication → **SMTP Settings** → *Enable Custom SMTP*:
   - Host `smtp.resend.com`, Port `465` (SSL; `587` STARTTLS also works)
   - Username `resend`, Password = the Resend API key (`re_…`)
   - Sender `info@clinic-flow.co.il`, Sender name `ClinicFlow`
2. Install the 4 GoTrue templates from `emails/supabase/*.html` into the matching
   dashboard slots (Confirm signup / Magic Link / Reset Password / Change Email),
   with the Hebrew subjects. Full slot map + subjects: **`emails/supabase/README.md`**.
   - `welcome.html` is **not** a GoTrue slot — do not paste it (it's app-sent, Step 7).

### Step 7 — Client: call `send-welcome` after first confirmed login
GoTrue has no "welcome" slot, so the app must trigger it. After the user's first
confirmed login (`user.email_confirmed_at` set):

```js
await supabase.functions.invoke('send-welcome')   // forwards the user JWT
```
Idempotent: safe to call on every login (dedupes on `welcome_sent_at` + a Resend
idempotency key). Requires `verify_jwt = true` (already set for this function).

### Step 8 — notify-contact: move internal notice off the sandbox sender
`notify-contact` sends the **user auto-reply** (`contact-received`) via the
verified `info@clinic-flow.co.il`, but its **internal team notification** still
POSTs from `onboarding@resend.dev`. Once the domain is verified (Step 1), switch
that internal `from` to `info@clinic-flow.co.il` (see the `TODO(resend-domain)`
in `supabase/functions/notify-contact/index.ts`). *(This is a code change — out
of scope for this doc; noted here so it isn't forgotten.)*

### Step 9 — Phase 2 enablement (lifecycle emails)
See [trial email prerequisites](EMAIL-PHASE2-PREREQUISITES.md) for activation requirements and checks. Paid Grow orders use a separate confirmation worker.

---

## 4 · Testing before go-live

### Automated (run now — verified passing 2026-07-02)
Deno 2.9.1, config `supabase/functions/deno.json`:

```bash
# 43 render + plaintext checks across all 21 templates
deno test -A --no-check --config supabase/functions/deno.json \
  supabase/functions/_shared/render-all.test.ts        # → 43 passed / 0 failed

# 15 wiring checks (license keygen, VAT/format, getOrCreateLicenseKey, sendOnce dedupe)
deno test -A --no-check --config supabase/functions/deno.json \
  supabase/functions/_shared/wiring.test.ts             # → 15 passed / 0 failed

# Export all 21 templates to HTML (sanity)
npm run email:build   # → emails/.out/*.html (21 templates + _layout.html = 22 files)
```

### Send a real test email
1. Do Steps 1–2 (verify domain, set `RESEND_API_KEY`) first — sends fail without a key.
2. Preview visually: `npm run email:dev`.
3. Send to your own inbox using the seam directly, e.g. a one-off Deno script:
   ```ts
   import { sendTemplate } from "./supabase/functions/_shared/send-template.ts";
   import { FIXTURES } from "./supabase/functions/_shared/emails/fixtures.ts";
   await sendTemplate("license-delivery", "you@yourinbox.com", FIXTURES["license-delivery"]);
   ```
   Run with `RESEND_API_KEY=re_… deno run -A --config supabase/functions/deno.json <script>.ts`.
   The fixtures provide realistic Hebrew sample props for every id.
4. End-to-end: trigger a Stripe **test-mode** `payment_intent.succeeded` (Stripe CLI
   `stripe trigger` or a test checkout) and confirm order-confirmation +
   license-delivery arrive, and that a retried webhook does **not** double-send
   (that's the `email_log` / `sendOnce` guard).

---

## 5 · What is NOT done / limitations

- **AllPay refunds** — AllPay sends **no refund webhook**, so `refund-confirmation`
  is wired for **Stripe only** (`charge.refunded`). AllPay refunds cannot trigger
  the email automatically (documented in `allpay-webhook/index.ts`).
- **`device-reactivation`** — template + an `activate-license` reference stub exist,
  but the **app side** (device-fingerprint tracking, activation-slot table) is not
  built, so nothing calls it in production yet.
- **Trial campaigns** remain disabled. The renewal templates are historical previews.
- **`sales-response` / `policy-update`** — no automatic trigger by design; intended
  to be sent manually/assisted (e.g. from an ops action) when needed.
- **`notify-contact` internal notice** still sends from `onboarding@resend.dev`
  until the domain is verified and the `from` is switched (§3 Step 8).

---

## 6 · Quick reference

| Concern | Where |
|---------|-------|
| Add/change a template | `emails/<id>.tsx` (+ registry entry + fixture) |
| Template contract (subject/from/props/unsubscribe) | `supabase/functions/_shared/email-registry.ts` |
| Send any template | `sendTemplate(id, to, props, opts)` in `_shared/send-template.ts` |
| Idempotent send (webhooks) | `sendOnce(supabase, {...})` in `_shared/email-once.ts` |
| Resend transport | `_shared/send-email.ts` (`RESEND_API_KEY`) |
| Auth (GoTrue) HTML templates | `emails/supabase/*.html` + `emails/supabase/README.md` |
| Migrations | `supabase/migrations/20260702000000_*.sql` |
| Deno/React resolution rationale | `supabase/functions/deno.json` (the `"//"` note) |
