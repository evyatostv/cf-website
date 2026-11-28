-- Synthetic stand-ins for managed Supabase schemas and tables predating the
-- repository's migrations. Run once in a new, disposable PostgreSQL database.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create schema storage;
create table auth.users (
  id uuid primary key, email text, created_at timestamptz default now(), email_confirmed_at timestamptz, banned_until timestamptz
);
create table auth.sessions (
  id uuid primary key, user_id uuid references auth.users on delete cascade,
  created_at timestamptz, updated_at timestamptz, not_after timestamptz
);
create table auth.mfa_factors (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade,
  status text not null
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb
$$;
grant usage on schema auth to authenticated;
create table storage.objects (owner_id text, owner uuid);
create table storage.buckets (owner_id text, owner uuid);

create type public.plan_tier as enum ('none','basic','professional','full','premium','trial');
create table public.user_access (
  user_id uuid unique references auth.users on delete cascade, email text not null,
  plan public.plan_tier not null default 'none', is_active boolean not null default false,
  expires_at timestamptz, granted_at timestamptz
);
create table public.purchases (
  user_id uuid unique references auth.users on delete cascade, email text not null, version text not null,
  plan text, amount integer, payment_id text unique, discount_eligible boolean, purchased_at timestamptz
);
create table public.contact_messages (id uuid primary key default gen_random_uuid(), name text, email text, phone text, message text, created_at timestamptz default now());
alter table public.contact_messages enable row level security;
grant select on public.contact_messages to authenticated;
create policy "Authenticated can read" on public.contact_messages for select to authenticated using(true);
create table public.download_log (user_id uuid references auth.users on delete set null, email text);
create table public.policy_acceptances (user_id uuid references auth.users on delete set null, user_email text, user_agent text);
create table public.users (id uuid references auth.users on delete cascade);
create table public.beta_access_invitations (claimed_user_id uuid references auth.users on delete set null);
