-- Coming-soon waitlist. The /soon page's email form POSTs to the
-- waitlist-signup edge function, which inserts here (service role) and emails
-- the owner. RLS on with NO policies → only the service role touches this table;
-- anonymous visitors never read/write it directly.

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,     -- unique → natural dedupe on repeat signups
  source     text default 'soon',
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
-- (no policies = service-role-only)
