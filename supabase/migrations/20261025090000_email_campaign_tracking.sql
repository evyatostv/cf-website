create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.email_campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  tracking_token uuid not null default gen_random_uuid() unique,
  name text not null,
  email text not null,
  specialty text,
  variant text not null check (variant in ('A', 'B')),
  source_url text,
  gmail_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'bounced', 'replied', 'positive', 'unsubscribed', 'demo', 'won')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);

create table if not exists public.email_campaign_events (
  id bigint generated always as identity primary key,
  contact_id uuid not null references public.email_campaign_contacts(id) on delete cascade,
  event_type text not null check (event_type in ('open', 'click', 'reply', 'positive_reply', 'bounce', 'unsubscribe', 'demo', 'sale')),
  is_proxy boolean not null default false,
  user_agent text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists email_campaign_contacts_campaign_idx on public.email_campaign_contacts(campaign_id);
create index if not exists email_campaign_events_contact_idx on public.email_campaign_events(contact_id, occurred_at desc);
create index if not exists email_campaign_events_type_idx on public.email_campaign_events(event_type, occurred_at desc);

alter table public.email_campaigns enable row level security;
alter table public.email_campaign_contacts enable row level security;
alter table public.email_campaign_events enable row level security;

drop policy if exists email_campaigns_admin_all on public.email_campaigns;
create policy email_campaigns_admin_all on public.email_campaigns
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'evyatar.druyan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'evyatar.druyan@gmail.com');

drop policy if exists email_campaign_contacts_admin_all on public.email_campaign_contacts;
create policy email_campaign_contacts_admin_all on public.email_campaign_contacts
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'evyatar.druyan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'evyatar.druyan@gmail.com');

drop policy if exists email_campaign_events_admin_all on public.email_campaign_events;
create policy email_campaign_events_admin_all on public.email_campaign_events
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'evyatar.druyan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'evyatar.druyan@gmail.com');

comment on table public.email_campaign_events is 'First-party outreach events. Open events are estimates because mail clients may proxy or preload pixels.';
