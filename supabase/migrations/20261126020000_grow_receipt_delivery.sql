-- Payment settlement has no dependency on the mail worker. A verified paid
-- order plus its matching receipt is the durable source of pending work.
create table public.grow_receipt_cutover (
  singleton boolean primary key default true check(singleton),
  starts_at timestamptz not null default now()
);
insert into public.grow_receipt_cutover default values;
alter table public.grow_receipt_cutover enable row level security;
revoke all on public.grow_receipt_cutover from public,anon,authenticated;
grant select on public.grow_receipt_cutover to service_role;

create table public.grow_receipt_attempts (
  order_id uuid primary key references public.orders(id) on delete cascade,
  first_attempt timestamptz not null default now(),
  retry_after timestamptz not null,
  recipient text not null
);
alter table public.grow_receipt_attempts enable row level security;
revoke all on public.grow_receipt_attempts from public,anon,authenticated;
grant select,insert,update on public.grow_receipt_attempts to service_role;

create function public.pending_grow_receipt_count() returns bigint language sql stable set search_path='' as $$
  select count(*)
    from public.orders o
    join public.purchases p on p.user_id=o.customer_id and p.payment_id=o.external_transaction_id
      and p.amount=o.amount and p.plan='full' and p.version='forever'
    left join public.grow_receipt_attempts a on a.order_id=o.id
    where o.paid_at >= (select starts_at from public.grow_receipt_cutover)
      and o.status='PAID' and o.payment_provider='grow_make'
      and o.package_id='forever' and o.currency='ILS' and o.amount=149900
      and p.email is not null and trim(p.email)<>''
      and not exists(select 1 from public.email_log l where l.payment_id in (o.id::text,o.external_transaction_id) and l.template='order-confirmation')
      and (a.order_id is null or (a.retry_after<=now() and a.first_attempt > now()-interval '23 hours'))
$$;
revoke all on function public.pending_grow_receipt_count() from public,anon,authenticated;
grant execute on function public.pending_grow_receipt_count() to service_role;

create function public.claim_grow_receipts() returns table(order_id uuid, recipient text, amount integer)
language sql set search_path='' as $$
  with eligible as (
    select o.id,o.amount,p.email
    from public.orders o
    join public.purchases p on p.user_id=o.customer_id and p.payment_id=o.external_transaction_id
      and p.amount=o.amount and p.plan='full' and p.version='forever'
    left join public.grow_receipt_attempts a on a.order_id=o.id
    where o.paid_at >= (select starts_at from public.grow_receipt_cutover)
      and o.status='PAID' and o.payment_provider='grow_make'
      and o.package_id='forever' and o.currency='ILS' and o.amount=149900
      and p.email is not null and trim(p.email)<>''
      and not exists(select 1 from public.email_log l where l.payment_id in (o.id::text,o.external_transaction_id) and l.template='order-confirmation')
      and (a.order_id is null or (a.retry_after<=now() and a.first_attempt > now()-interval '23 hours'))
    order by o.paid_at,o.id limit 8 for update of o skip locked
  ), claimed as (
    insert into public.grow_receipt_attempts as a(order_id,retry_after,recipient)
    select e.id,now()+interval '5 minutes',e.email from eligible e
    on conflict on constraint grow_receipt_attempts_pkey do update set retry_after=excluded.retry_after
      where a.retry_after<=now() and a.first_attempt > now()-interval '23 hours'
    returning a.order_id,a.recipient
  )
  select c.order_id,c.recipient,e.amount from claimed c join eligible e on e.id=c.order_id
$$;
revoke all on function public.claim_grow_receipts() from public,anon,authenticated;
grant execute on function public.claim_grow_receipts() to service_role;

-- A provider may have accepted a send before the local success log was written.
-- After its idempotency window, surface the item for reconciliation.
create function public.grow_receipts_requiring_review() returns bigint
language sql stable set search_path='' as $$
  select count(*) from public.grow_receipt_attempts a join public.orders o on o.id=a.order_id
  where o.status='PAID' and a.first_attempt<=now()-interval '23 hours'
    and not exists(select 1 from public.email_log l where l.payment_id in (o.id::text,o.external_transaction_id) and l.template='order-confirmation')
$$;
revoke all on function public.grow_receipts_requiring_review() from public,anon,authenticated;
grant execute on function public.grow_receipts_requiring_review() to service_role;
