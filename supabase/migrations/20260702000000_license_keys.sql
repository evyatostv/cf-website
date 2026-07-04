-- ClinicFlow · license keys + transactional-email idempotency log
--
-- 1) `user_access.license_key` — the readable, per-user activation key issued at
--    first purchase (format `CF-<PLAN>-XXXX-XXXX-XXXX`). Nullable: pre-existing
--    rows have none until their next license-delivery send. UNIQUE so a key is
--    never shared across users. Generated ONCE and reused for every webhook
--    retry (see _shared/license.ts::getOrCreateLicenseKey).
--
-- 2) `email_log` — one row per (payment, template) email actually sent. The
--    UNIQUE(payment_id, template) constraint is the idempotency guard the
--    Stripe/AllPay webhooks use (via _shared/email-once.ts::sendOnce) so a
--    webhook RETRY never re-sends the same receipt / license / upgrade mail.

alter table public.user_access
  add column if not exists license_key text unique;

create table if not exists public.email_log (
  id          uuid primary key default gen_random_uuid(),
  payment_id  text not null,
  template    text not null,
  recipient   text,
  sent_at     timestamptz not null default now(),
  constraint email_log_payment_template_uniq unique (payment_id, template)
);

-- Service-role webhooks write here; no public/anon access.
alter table public.email_log enable row level security;
