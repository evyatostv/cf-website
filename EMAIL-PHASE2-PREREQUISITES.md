# Email Phase-2 — Prerequisites & Flip-the-Switch Guide

Phase-2 covers the **lifecycle** emails: trial nudges, win-back, renewal
reminders, the renewal receipt, and the device-reactivation confirmation.

**Today these are safe no-ops.** The templates render (43/43 in
`_shared/render-all.test.ts`) and the send seam works, but the PRODUCT FEATURES
that would trigger them do not exist yet: there is **no trial-activation flow, no
renewal-payment flow, and no desktop device-activation API**. This document maps
each email to exactly what must exist for it to go live, what was scaffolded, and
the steps to arm it.

Nothing here fires until you complete the flip-the-switch steps at the bottom.

---

## What was scaffolded (this change)

| Artifact | Kind | Fires today? |
|---|---|---|
| `supabase/migrations/20260702000002_lifecycle.sql` | Migration: adds `user_access.trial_started_at`, `updates_period_ends` (nullable) | n/a — DDL only |
| `supabase/functions/process-email-lifecycle/index.ts` | Daily cron (trial-ending, trial-ended, win-back, renewal-upcoming, updates-lapsed) | **No** — gated behind `LIFECYCLE_EMAILS_ENABLED=true` (default off) + needs populated columns |
| `supabase/functions/_shared/send-renewal-confirmation.ts` | Helper for the FUTURE renewal-payment flow to call | **No** — not imported by any webhook |
| `supabase/functions/activate-license/index.ts` | Reference stub for device-reactivation | **Only if called** — email-send is a working reference impl; slot bookkeeping is NOT built |
| `config.toml` | Added `[functions.activate-license]` (verify_jwt=true) + `[functions.process-email-lifecycle]` (verify_jwt=false) | n/a |

`trial-started` is transactional (sent by the future trial-activation flow the
moment a trial begins) — it is **not** part of the cron and was not wired here.
`renewal-confirmation` is likewise transactional (see helper below).

---

## Per-email prerequisites

| Email | Type | Trigger that must exist | DB columns it reads/writes | Scaffolded as | Still missing (prerequisite) |
|---|---|---|---|---|---|
| `trial-started` | transactional | trial-activation flow, at trial start | writes `plan='trial'`, `trial_started_at`, `expires_at`, `is_active=true` | *(not wired — belongs in the trial-activation flow; call `sendTemplate("trial-started", …)` there)* | The trial-activation flow itself |
| `trial-ending` | cron | daily: `plan='trial'` AND `expires_at` in `[now+1d, now+3d]` | reads `plan, expires_at` | `process-email-lifecycle` §1 | Rows with `plan='trial'` + real `expires_at` (needs trial-activation flow) |
| `trial-ended` | cron | daily: `plan='trial'` AND `is_active` AND `expires_at <= now` → sets `is_active=false` | reads `plan, is_active, expires_at`; writes `is_active=false` | `process-email-lifecycle` §2 | Same trial rows |
| `win-back` | cron | daily: `plan='trial'` AND NOT `is_active` AND `expires_at < now-30d` (one-time) | reads `plan, is_active, expires_at` | `process-email-lifecycle` §3 | Same trial rows |
| `renewal-upcoming` | cron | daily: `updates_period_ends` in `[now+30d, now+31d]` | reads `updates_period_ends, plan` | `process-email-lifecycle` §4 | Rows with a real `updates_period_ends` (needs renewal-payment flow); a renewal price source for the `amount` prop |
| `updates-lapsed` | cron | daily: `updates_period_ends < now` AND `is_active` | reads `updates_period_ends, is_active, plan` | `process-email-lifecycle` §5 | Same renewal rows |
| `renewal-confirmation` | transactional | renewal-payment PAID | writes/extends `updates_period_ends` | `_shared/send-renewal-confirmation.ts` (helper) | The renewal-payment flow that calls the helper with the charge id |
| `device-reactivation` | transactional | license moved to a new machine | reads `license_key` (ownership) | `activate-license/index.ts` (reference impl) | Desktop-app side: device fingerprinting + an activation-slot table + release/claim logic |

### Notes on the two transactional pieces

- **`renewal-confirmation`** — deliberately NOT wired into a webhook (no
  renewal-payment flow exists). The future flow imports
  `_shared/send-renewal-confirmation.ts` and calls
  `sendRenewalConfirmation({ admin, paymentId: charge.id, to, props })`.
  Dedupe reuses `email_log` UNIQUE(payment_id, template) keyed on the **real**
  renewal charge id, so a webhook retry never double-sends.

- **`device-reactivation`** — `activate-license` authenticates the caller,
  confirms they own the license on `user_access`, and sends the confirmation
  email (the clearly-marked reference implementation). It does **not** do real
  activation-slot bookkeeping. Prerequisite before trusting it as an activation
  gate: the desktop app must generate + send a device fingerprint, and a
  `license_activations` table (license_key, device_fingerprint, device_name,
  activated_at, released_at) must enforce the per-license device limit and record
  the move.

---

## How the cron stays a safe no-op until armed

Each of the five sections in `process-email-lifecycle`:

1. is gated behind the whole-function env flag `LIFECYCLE_EMAILS_ENABLED` — if
   it is not exactly `"true"`, the function returns `{enabled:false}` and sends
   nothing;
2. is wrapped in its own `try/catch`, so one failing section never kills the
   others;
3. **NO-OPs with a clear log line** if its column doesn't exist yet
   (SQLSTATE 42703 / "column does not exist" → the migration wasn't applied);
4. dedupes every send via `sendOnce` over `email_log` using a **date-stamped
   synthetic key** (`<template>:<userId|email>:<yyyy-mm-dd>`, or a stable key for
   the one-time win-back), so it can't repeat on a later daily run;
5. returns a JSON summary of `{matched, sent, skipped, failed, noop?}` per
   section.

Even with the flag ON but no trial/renewal rows populated, every section matches
0 rows → still a no-op.

---

## Flip-the-switch steps (to take Phase-2 live)

Project ref: **`dmuwxydmuylcbhcoagri`** (same as the other functions).

1. **Apply the migration** — adds the two nullable columns:
   ```bash
   supabase db push
   # or paste supabase/migrations/20260702000002_lifecycle.sql into the SQL editor
   ```

2. **Build + ship the feature flows that populate the columns** (these are the
   real prerequisites — the emails have nothing to trigger on until they exist):
   - a **trial-activation flow** that sets `plan='trial'`, `trial_started_at`,
     `expires_at`, `is_active=true` (and sends `trial-started` itself);
   - a **renewal-payment flow** that extends `updates_period_ends` on payment and
     calls `sendRenewalConfirmation(...)`;
   - (optional, for device-reactivation) the **desktop-app device-activation**
     side + `license_activations` table, then call `activate-license`.

3. **Deploy the functions:**
   ```bash
   supabase functions deploy process-email-lifecycle --no-verify-jwt
   supabase functions deploy activate-license   # verify_jwt=true (per config.toml)
   ```

4. **Set the secrets** on `process-email-lifecycle`:
   ```bash
   supabase secrets set LIFECYCLE_EMAILS_ENABLED=true
   supabase secrets set CRON_SECRET="<same-value-as-the-GitHub-secret>"
   # SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are auto-injected.
   ```
   Leave `LIFECYCLE_EMAILS_ENABLED` unset (or not `"true"`) to keep the cron a
   no-op.

5. **Schedule the daily cron via GitHub Actions** — mirror
   `.github/workflows/process-deletions.yml`. Create
   `.github/workflows/process-email-lifecycle.yml` with a daily `schedule` +
   `workflow_dispatch`, POSTing to
   `https://dmuwxydmuylcbhcoagri.supabase.co/functions/v1/process-email-lifecycle`
   with `Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}` and
   `x-cron-secret: ${{ secrets.CRON_SECRET }}`. Add the `CRON_SECRET` repo secret
   (same value as step 4). Use a different UTC time from process-deletions
   (03:00) to spread load, e.g. `0 6 * * *`.

6. **Smoke test** (should return `{enabled:false}` until the flag is set, then
   `{ok:true, enabled:true, sections:{…}}` with all-zero counts until real rows
   exist):
   ```bash
   curl -i -X POST \
     "https://dmuwxydmuylcbhcoagri.supabase.co/functions/v1/process-email-lifecycle" \
     -H "Authorization: Bearer <ANON_KEY>" \
     -H "x-cron-secret: <CRON_SECRET>"
   ```
