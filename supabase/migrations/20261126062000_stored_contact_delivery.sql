-- Only new inquiries are queued. An archive or migration must never resend an old request.
create table public.contact_deliveries (
  contact_id uuid not null references public.contact_messages(id) on delete cascade,
  channel text not null check (channel in ('internal','reply','sheet')),
  first_attempt timestamptz,
  retry_after timestamptz not null default now(),
  lease_id uuid,
  completed_at timestamptz,
  primary key(contact_id,channel)
);
alter table public.contact_deliveries enable row level security;
revoke all on public.contact_deliveries from public,anon,authenticated;
grant select,update on public.contact_deliveries to service_role;
create index contact_delivery_pending on public.contact_deliveries(retry_after) where completed_at is null;

create function public.queue_stored_contact() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.contact_deliveries(contact_id,channel) values (new.id,'internal');
  if new.email is not null and new.email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    insert into public.contact_deliveries(contact_id,channel) values (new.id,'reply');
  end if;
  if nullif(new.source,'') is not null then
    insert into public.contact_deliveries(contact_id,channel) values (new.id,'sheet');
  end if;
  return new;
end;
$$;
create trigger queue_stored_contact after insert on public.contact_messages
for each row execute function public.queue_stored_contact();

create function public.claim_contact_deliveries(p_contact uuid,p_sheet_enabled boolean)
returns table(contact_id uuid,channel text,lease_id uuid) language sql set search_path='' as $$
  with eligible as (
    select d.contact_id,d.channel from public.contact_deliveries d
    where d.completed_at is null and d.retry_after<=now()
      and (d.first_attempt is null or d.first_attempt>now()-interval '23 hours')
      and (p_contact is null or d.contact_id=p_contact)
      and (p_sheet_enabled or d.channel<>'sheet')
    order by d.retry_after,d.contact_id,d.channel
    limit 12 for update skip locked
  )
  update public.contact_deliveries d set lease_id=gen_random_uuid(),
    first_attempt=coalesce(d.first_attempt,now()),retry_after=now()+interval '5 minutes'
  from eligible e where (d.contact_id,d.channel)=(e.contact_id,e.channel)
  returning d.contact_id,d.channel,d.lease_id
$$;
revoke all on function public.claim_contact_deliveries(uuid,boolean) from public,anon,authenticated;
grant execute on function public.claim_contact_deliveries(uuid,boolean) to service_role;
