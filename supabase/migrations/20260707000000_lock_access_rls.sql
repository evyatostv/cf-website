-- SECURITY: lock down the access/purchase tables that were created via the
-- dashboard. Without RLS enabled + write-restricted, an authenticated user can
-- call PostgREST directly with their own JWT and self-grant a license
-- (UPDATE user_access SET is_active=true, plan='full'), bypassing payment.
--
-- The service role bypasses RLS, so the AllPay/Stripe webhooks (which write
-- these tables) keep working. Users may only READ their own rows.
--
-- Resilient + idempotent: guards on table existence so a missing table never
-- aborts the whole migration (download_log may not exist yet), and re-running
-- is safe.

-- Ensure the download audit table exists (download-installer best-effort logs to
-- it; without the table those inserts silently fail).
create table if not exists public.download_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  email      text,
  plan       text,
  os         text,
  installer  text,
  created_at timestamptz not null default now()
);

do $$
begin
  -- user_access: users read their own access; only service_role writes it.
  if to_regclass('public.user_access') is not null then
    alter table public.user_access enable row level security;
    drop policy if exists user_access_select_own on public.user_access;
    create policy user_access_select_own on public.user_access
      for select using (auth.uid() = user_id);
    -- (no insert/update/delete policies → service-role-only writes)
  end if;

  -- purchases: user reads own history (upgrade credit); no user writes.
  if to_regclass('public.purchases') is not null then
    alter table public.purchases enable row level security;
    drop policy if exists purchases_select_own on public.purchases;
    create policy purchases_select_own on public.purchases
      for select using (auth.uid() = user_id);
  end if;

  -- download_log: audit only; RLS on with no user policies = service-role-only.
  alter table public.download_log enable row level security;
end $$;
