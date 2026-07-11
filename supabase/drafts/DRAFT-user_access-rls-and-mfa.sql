-- ============================================================================
-- DRAFT — REVIEW BEFORE APPLYING. Do NOT run blindly.
-- ============================================================================
-- Closes two audit BLOCKERS:
--   (#4) user_access may be readable cross-user if it lacks an owner-only policy
--   (#5) MFA is enforced only in the client and fails open (aal1 token bypasses)
--
-- This file lives OUTSIDE supabase/migrations/ on purpose, so `supabase db push`
-- will NOT pick it up. To apply: FIRST run the diagnostics below against the live
-- DB, confirm the current state, then move this into supabase/migrations/ with a
-- timestamp prefix (e.g. 20260707000000_user_access_rls_mfa.sql) and push.
--
-- WHY REVIEW FIRST: user_access is a PRE-EXISTING table not defined in this repo's
-- migrations, so its current RLS state and existing policies are unknown from
-- code. Enabling RLS without the right SELECT policy could break the dashboard
-- (getUserAccess reads it client-side); leaving a permissive policy in place keeps
-- the hole open. Verify, then apply.
-- ============================================================================


-- ─── STEP 0: DIAGNOSTICS (run these first; act on what you see) ──────────────
-- Is RLS enabled on user_access?
--   select relrowsecurity from pg_class where relname = 'user_access';
-- What policies already exist? (look for any permissive/USING(true) SELECT)
--   select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr
--   from pg_policy where polrelid = 'public.user_access'::regclass;
-- If a broad/permissive SELECT policy exists, DROP it (it's the cross-user leak):
--   drop policy "<its name>" on public.user_access;


-- ─── STEP 1: owner-only access on user_access (#4) ──────────────────────────
alter table public.user_access enable row level security;

-- A user may read only their OWN access row. Service-role (webhooks) bypasses RLS,
-- so grants/writes keep working. Email-only rows (user_id IS NULL) are readable by
-- no one via the client, which is correct — they're reconciled server-side.
drop policy if exists user_access_select_own on public.user_access;
create policy user_access_select_own on public.user_access
  for select using (auth.uid() = user_id);

-- NOTE: intentionally NO client insert/update/delete policies — only the
-- service-role webhooks write this table. Add none.


-- ─── STEP 2: require aal2 when the user actually has MFA (#5) ────────────────
-- Restrictive policy: it ANDs with the owner policy above. It requires an aal2
-- (2FA-verified) session ONLY for users who have a verified TOTP factor; users
-- with no MFA keep working at aal1 (so this never locks anyone out). This is
-- Supabase's documented MFA-in-RLS pattern.
drop policy if exists user_access_require_aal2 on public.user_access;
create policy user_access_require_aal2 on public.user_access
  as restrictive
  for select
  to authenticated
  using (
    (select auth.jwt()->>'aal') = 'aal2'
    or
    (
      select count(*) = 0
      from auth.mfa_factors
      where auth.mfa_factors.user_id = auth.uid()
        and auth.mfa_factors.status = 'verified'
    )
  );

-- OPTIONAL — extend the SAME two-policy pattern to other sensitive owner-scoped
-- tables if you want defense-in-depth (profiles, purchases, deletion_requests).
-- profiles/deletion_requests already have owner-only policies (see their
-- migrations); you'd only add the `require_aal2` restrictive policy to them.
-- purchases: confirm it has an owner-only SELECT policy first (same diagnostics).


-- ─── ROLLBACK (if something breaks) ─────────────────────────────────────────
-- drop policy if exists user_access_require_aal2 on public.user_access;
-- drop policy if exists user_access_select_own    on public.user_access;
-- -- (only disable RLS if it was OFF before and you must revert fully)
-- -- alter table public.user_access disable row level security;
