-- ClinicFlow · Phase-2 lifecycle columns (trial + updates-period tracking)
--
-- Apply via: `supabase db push`  (or paste into the Supabase SQL editor).
--
-- These two nullable columns are the DB half of Phase-2 lifecycle emails. They
-- are ADDED here but stay NULL for every existing row until a future trial-
-- activation flow / renewal-payment flow populates them. The daily cron
-- (supabase/functions/process-email-lifecycle) reads them; with both columns
-- NULL and LIFECYCLE_EMAILS_ENABLED unset, the cron is a safe no-op.
--
-- `expires_at` already exists on user_access and is reused as the trial-expiry
-- timestamp (plan='trial' + expires_at) — no new column needed for that.
--
-- service_role (the edge functions) bypasses RLS, so no policy is needed for
-- these writes.

alter table public.user_access
  -- When a trial-activation flow starts a trial it stamps this. Enables the
  -- trial-started email (transactional, sent by that flow) and lets the cron
  -- reason about trial age. Trial EXPIRY itself is driven by `expires_at`.
  add column if not exists trial_started_at timestamptz;

alter table public.user_access
  -- When a renewal-payment flow opens/extends an updates (Amendment-13 patch)
  -- period it stamps the period end here. Enables renewal-upcoming (cron, 30d
  -- before this date) and updates-lapsed (cron, after this date passes).
  add column if not exists updates_period_ends timestamptz;

comment on column public.user_access.trial_started_at is
  'Phase-2: set by the future trial-activation flow. Enables trial-started + cron trial reasoning. NULL until then.';
comment on column public.user_access.updates_period_ends is
  'Phase-2: set by the future renewal-payment flow. Enables renewal-upcoming (30d before) + updates-lapsed (after). NULL until then.';
