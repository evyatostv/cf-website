-- SECURITY: lock down the two tables the browser anon client writes (WEB-008).
-- Both were created via the Supabase dashboard, so their RLS state is not
-- tracked in source. Without RLS + write-restricted policies, anyone holding
-- the (public) anon key can read every lead's name/email/phone out of
-- contact_messages, or read/tamper with policy_acceptances.
--
-- Goal:
--   contact_messages   — anon may INSERT a lead; NOBODY (anon) may SELECT it.
--                        The notify-contact webhook runs as service_role and
--                        bypasses RLS, so email notifications keep working.
--   policy_acceptances — an authenticated user may INSERT/SELECT only their own
--                        row (auth.uid() = user_id); no anon access at all.
--
-- Resilient + idempotent: create-if-not-exists so a fresh DB works, guards so a
-- missing table never aborts, re-running is safe. Column sets mirror the client
-- inserts in src-2/lib/leads.ts and src-2/lib/supabase.ts.

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  phone      text,
  message    text,
  created_at timestamptz not null default now()
);

create table if not exists public.policy_acceptances (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  user_email     text,
  plan           text,
  policy_version text,
  user_agent     text,
  created_at     timestamptz not null default now()
);

do $$
begin
  -- contact_messages: anon (contact form) may INSERT only. No SELECT/UPDATE/
  -- DELETE policies for anon → leads are write-only from the browser; the
  -- service-role webhook still reads them (RLS bypass).
  if to_regclass('public.contact_messages') is not null then
    alter table public.contact_messages enable row level security;
    drop policy if exists contact_messages_insert_anon on public.contact_messages;
    create policy contact_messages_insert_anon on public.contact_messages
      for insert to anon, authenticated
      with check (true);
    -- (no select/update/delete policies → nobody but service_role can read)
  end if;

  -- policy_acceptances: a signed-in user records + reads only their own
  -- acceptance. No anon access.
  if to_regclass('public.policy_acceptances') is not null then
    alter table public.policy_acceptances enable row level security;

    drop policy if exists policy_acceptances_insert_own on public.policy_acceptances;
    create policy policy_acceptances_insert_own on public.policy_acceptances
      for insert to authenticated
      with check (auth.uid() = user_id);

    drop policy if exists policy_acceptances_select_own on public.policy_acceptances;
    create policy policy_acceptances_select_own on public.policy_acceptances
      for select to authenticated
      using (auth.uid() = user_id);
    -- (no update/delete → immutable audit; service_role bypasses for admin)
  end if;
end $$;
