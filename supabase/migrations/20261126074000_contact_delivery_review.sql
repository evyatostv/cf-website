create or replace function public.claim_contact_deliveries(p_contact uuid,p_sheet_enabled boolean)
returns table(contact_id uuid,channel text,lease_id uuid) language sql set search_path='' as $$
  with eligible as (
    select d.contact_id,d.channel from public.contact_deliveries d
    where d.completed_at is null and d.retry_after<=now()
      and (d.channel='sheet' or d.first_attempt is null or d.first_attempt>now()-interval '23 hours')
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

create function public.contact_email_review_counts() returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('internal',count(*) filter(where channel='internal'),
                            'reply',count(*) filter(where channel='reply'))
  from public.contact_deliveries where completed_at is null and channel in ('internal','reply')
    and first_attempt<=now()-interval '23 hours'
$$;
revoke all on function public.contact_email_review_counts() from public,anon,authenticated;
grant execute on function public.contact_email_review_counts() to service_role;

create table public.contact_delivery_reviews(
  contact_id uuid not null,
  channel text not null,
  reference text not null,
  decision text not null check(decision in ('accepted','not_accepted')),
  recorded_at timestamptz not null default now(),
  recorded_by text not null default current_user,
  primary key(contact_id,channel,reference),
  foreign key(contact_id,channel) references public.contact_deliveries(contact_id,channel) on delete cascade
);
alter table public.contact_delivery_reviews enable row level security;
revoke all on public.contact_delivery_reviews from public,anon,authenticated,service_role;

create function public.review_contact_email(p_contact uuid,p_channel text,p_decision text,p_reference text,p_apply boolean default false)
returns text language plpgsql set search_path='' as $$
declare
  delivery public.contact_deliveries%rowtype;
  previous text;
begin
  if p_channel is null or p_channel not in ('internal','reply') or p_decision is null or p_decision not in ('accepted','not_accepted')
     or p_reference is null or p_reference !~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{1,127}$' then return 'INVALID'; end if;
  if p_apply is true then
    select * into delivery from public.contact_deliveries where contact_id=p_contact and channel=p_channel for update;
  else
    select * into delivery from public.contact_deliveries where contact_id=p_contact and channel=p_channel;
  end if;
  if not found then return 'NOT_FOUND'; end if;
  select decision into previous from public.contact_delivery_reviews where contact_id=p_contact and channel=p_channel and reference=p_reference;
  if found then return case when previous=p_decision then 'ALREADY_RECORDED' else 'CONFLICT' end; end if;
  if delivery.completed_at is not null or delivery.first_attempt is null or delivery.first_attempt>now()-interval '23 hours'
    or delivery.retry_after>now() then return 'NOT_ELIGIBLE'; end if;
  if p_apply is distinct from true then return 'READY'; end if;
  insert into public.contact_delivery_reviews(contact_id,channel,reference,decision) values(p_contact,p_channel,p_reference,p_decision);
  if p_decision='accepted' then
    update public.contact_deliveries set completed_at=now(),lease_id=null where contact_id=p_contact and channel=p_channel;
  else
    update public.contact_deliveries set first_attempt=null,lease_id=null,retry_after=now() where contact_id=p_contact and channel=p_channel;
  end if;
  return 'RECORDED';
end;
$$;
revoke all on function public.review_contact_email(uuid,text,text,text,boolean) from public,anon,authenticated,service_role;
