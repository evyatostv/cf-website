-- =============================================================================
-- Migration: Enable Row Level Security (RLS) on all user / PII tables
-- Generated: 2026-06-02
-- Author:    Security engineering (generated for HUMAN REVIEW before applying)
-- =============================================================================
--
-- HOW TO APPLY
--   Option A (CLI):       supabase db push
--   Option B (SQL editor): paste this file into the Supabase Dashboard > SQL editor and run.
--
-- IMPORTANT — SERVICE ROLE BYPASSES RLS BY DESIGN
--   Supabase edge functions that use the SERVICE_ROLE key (e.g. stripe-webhook,
--   allpay-webhook, download-installer, notify-contact) bypass RLS entirely.
--   Enabling RLS here does NOT break those functions: they will keep writing/
--   reading rows as before. The policies below only constrain the anon and
--   authenticated roles (browser / public clients).
--
-- DESIGN SUMMARY
--   purchases       -> RLS on; users SELECT only their own rows (auth.uid() = user_id).
--                      Writes are done by edge functions (service role).
--   user_access     -> RLS on; users SELECT only their own rows (auth.uid() = user_id).
--                      Writes are done by edge functions (service role).
--   download_log    -> RLS on; NO public SELECT. Written by edge function (service role).
--   contact_messages-> RLS on; anon/authenticated may INSERT (public contact form);
--                      NO public SELECT (only service role / dashboard reads).
--   policy_acceptances -> ALREADY has RLS (see supabase-policy-acceptances.sql).
--                      Intentionally left untouched here. Observed, not modified.
--
-- This migration is IDEMPOTENT: it can be re-run safely. Each policy is dropped
-- (IF EXISTS) before being (re)created, and ENABLE RLS is a no-op if already on.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) purchases
--    Columns observed in edge functions:
--      user_id (uuid, nullable), email, plan, version, amount, payment_id,
--      discount_eligible, purchased_at
--    -> stripe-webhook / allpay-webhook INSERT; create-payment-intent /
--       create-allpay-payment SELECT amount WHERE user_id = user.id
-- -----------------------------------------------------------------------------
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users may read only their own purchase rows.
DROP POLICY IF EXISTS "Users can read their own purchases" ON public.purchases;
CREATE POLICY "Users can read their own purchases"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- NOTE: No INSERT/UPDATE/DELETE policy for anon/authenticated by design.
--       Purchases are written exclusively by edge functions using the
--       service role, which bypasses RLS.


-- -----------------------------------------------------------------------------
-- 2) user_access
--    Columns observed in edge functions:
--      user_id (uuid, nullable), email, plan, is_active, expires_at, notes,
--      granted_at
--    -> stripe-webhook / allpay-webhook INSERT+UPDATE; download-installer and
--       create-payment-intent SELECT WHERE user_id = user.id
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

-- Users may read only their own access row (used to gate downloads / features).
DROP POLICY IF EXISTS "Users can read their own access" ON public.user_access;
CREATE POLICY "Users can read their own access"
  ON public.user_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- NOTE: No INSERT/UPDATE/DELETE policy for anon/authenticated by design.
--       Access grants are written exclusively by edge functions using the
--       service role, which bypasses RLS.


-- -----------------------------------------------------------------------------
-- 3) download_log
--    Columns observed in edge function (download-installer):
--      user_id, email, plan, os, installer
--    -> Written by download-installer using the admin/service-role client.
--    Read only by admins via the service role / dashboard.
-- -----------------------------------------------------------------------------
ALTER TABLE public.download_log ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for anon/authenticated: download logs are admin-only.
-- No INSERT policy needed: the edge function uses the service role (bypasses RLS).
-- (RLS enabled with zero policies => anon/authenticated are fully denied, which
--  is the intended least-privilege posture for an audit log.)


-- -----------------------------------------------------------------------------
-- 4) contact_messages
--    Columns observed in the public contact form (src-2/app/pages/ContactPage.tsx):
--      name, email, phone (nullable), message
--    -> INSERTed by the public website using the anon Supabase client.
--    -> A Database Webhook on INSERT triggers the notify-contact edge function.
--    Read only by admins via the service role / dashboard.
-- -----------------------------------------------------------------------------
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow the public contact form (anon + authenticated) to submit messages.
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT policy for anon/authenticated: submitted messages are admin-only,
-- read via the service role / Supabase dashboard.


-- -----------------------------------------------------------------------------
-- 5) policy_acceptances  (NOT MODIFIED)
--    This table already has RLS enabled and an INSERT policy
--    ("Users can insert their own acceptance") defined in
--    supabase-policy-acceptances.sql. Left untouched intentionally.
-- -----------------------------------------------------------------------------
-- (no-op)

-- =============================================================================
-- End of migration
-- =============================================================================
