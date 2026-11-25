-- Central, append-only audit trail for the customer and payment lifecycle.
-- Writes are intentionally restricted to service_role so browser clients cannot
-- manufacture successful payments, licenses, or downloads.
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null check (length(event_type) between 1 and 120),
  outcome text not null default 'success' check (outcome in ('success','failure','blocked','pending')),
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  provider text,
  amount integer,
  currency text,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create index if not exists audit_events_created_at_idx on public.audit_events (created_at desc);
create index if not exists audit_events_event_type_idx on public.audit_events (event_type, created_at desc);
create index if not exists audit_events_user_id_idx on public.audit_events (user_id, created_at desc);
create index if not exists audit_events_order_id_idx on public.audit_events (order_id, created_at desc);

alter table public.audit_events enable row level security;
revoke all on public.audit_events from anon, authenticated;
grant select, insert on public.audit_events to service_role;

comment on table public.audit_events is 'Append-only service audit trail for checkout, fulfillment, access, and download events.';
comment on column public.audit_events.metadata is 'Non-secret diagnostic context; never store credentials, card data, or license keys.';

-- A small RPC keeps the write contract stable if callers move from PostgREST
-- to another Supabase client. It is callable only with the service key.
create or replace function public.record_audit_event(
  p_event_type text,
  p_outcome text default 'success',
  p_user_id uuid default null,
  p_order_id uuid default null,
  p_provider text default null,
  p_amount integer default null,
  p_currency text default null,
  p_correlation_id text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_events(event_type, outcome, user_id, order_id, provider,
    amount, currency, correlation_id, metadata)
  values (p_event_type, p_outcome, p_user_id, p_order_id, p_provider,
    p_amount, p_currency, p_correlation_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.record_audit_event(text,text,uuid,uuid,text,integer,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.record_audit_event(text,text,uuid,uuid,text,integer,text,text,jsonb)
  to service_role;
