-- Chargebacks finalized against the merchant have the same entitlement effect
-- as a full refund, but remain separately visible in support and accounting.
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check(status in
  ('PENDING','PAID','FAILED','CANCELLED','REFUNDED','MANUAL_REVIEW','CHARGED_BACK'));

create table public.grow_support_reversals (
  order_id uuid primary key references public.orders(id) on delete restrict,
  kind text not null check(kind in ('full_refund','lost_chargeback')),
  provider_reference text not null unique,
  recorded_at timestamptz not null default now(),
  recorded_by text not null default session_user
);
alter table public.grow_support_reversals enable row level security;
revoke all on public.grow_support_reversals from public,anon,authenticated,service_role;

create or replace function public.legacy_seat_receipt(p_customer_id uuid, p_plan text)
returns setof text language sql stable set search_path = '' as $$
  select p.payment_id from public.purchases p
  where p.user_id=p_customer_id and p.plan=p.version
    and p.version in ('basic','professional','full','premium') and p.amount>0
    and nullif(trim(p.payment_id),'') is not null
    and not exists (select 1 from public.orders o where o.external_transaction_id=p.payment_id)
    and not exists (select 1 from public.orders o where o.customer_id=p_customer_id and o.prior_legacy_receipt=p.payment_id
      and o.status in ('PAID','REFUNDED','CHARGED_BACK') and o.prior_legacy_expires_at<=now())
    and (p.plan=p_plan or exists (
      select 1 from public.orders o where o.customer_id=p_customer_id and o.prior_legacy_receipt=p.payment_id
        and o.status in ('PAID','REFUNDED','CHARGED_BACK') and p_plan='full'
        and (o.prior_legacy_expires_at is null or o.prior_legacy_expires_at>now())
    ))
  order by p.purchased_at nulls last,p.payment_id limit 1
$$;

create or replace function public.open_additional_grow_order(p_customer_id uuid, p_target_seat integer)
returns jsonb language plpgsql set search_path = '' as $$
declare
  seats integer;
  prior_receipt text;
  prior_expiry timestamptz;
  current_plan text;
  checkout public.orders%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_customer_id::text, 0));
  if exists (select 1 from public.deletion_requests where user_id=p_customer_id and status='pending') then
    return jsonb_build_object('result','DELETION_PENDING');
  end if;
  if exists (select 1 from public.orders where customer_id=p_customer_id and status='MANUAL_REVIEW') then
    return jsonb_build_object('result','MANUAL_REVIEW');
  end if;
  select a.plan::text,a.expires_at into current_plan,prior_expiry from public.user_access a
    where a.user_id=p_customer_id and a.is_active and (a.expires_at is null or a.expires_at>now());
  select count(*) into seats from public.account_paid_seat_receipts(p_customer_id,current_plan);
  if seats < 1 or p_target_seat is distinct from seats+1 then
    return jsonb_build_object('result','SEATS_CHANGED');
  end if;
  select * into checkout from public.orders where customer_id=p_customer_id and package_id='forever' and status='PENDING';
  if found then
    if checkout.target_seat_number <> p_target_seat then
      return jsonb_build_object('result','MANUAL_REVIEW');
    end if;
    return jsonb_build_object('result','PENDING','id',checkout.id,'payment_url',checkout.payment_url);
  end if;
  select r into prior_receipt from public.legacy_seat_receipt(p_customer_id,current_plan) r;
  if prior_receipt is not null then
    select o.prior_legacy_expires_at into prior_expiry from public.orders o
      where o.customer_id=p_customer_id and o.prior_legacy_receipt=prior_receipt and o.status in ('PAID','REFUNDED','CHARGED_BACK')
      order by o.created_at limit 1;
    if not found then select expires_at into prior_expiry from public.user_access where user_id=p_customer_id; end if;
  end if;
  insert into public.orders(customer_id,package_id,amount,target_seat_number,prior_legacy_receipt,prior_legacy_expires_at)
    values(p_customer_id,'forever',149900,p_target_seat,prior_receipt,prior_expiry) returning * into checkout;
  return jsonb_build_object('result','NEW','id',checkout.id,'package_id',checkout.package_id,'amount',checkout.amount,'currency',checkout.currency);
end;
$$;

create or replace function public.fulfill_grow_order(
  p_order_id uuid,
  p_transaction_id text,
  p_status text,
  p_amount integer,
  p_currency text,
  p_payload jsonb,
  p_license_key text
) returns text
language plpgsql
set search_path = ''
as $$
declare
  checkout public.orders%rowtype;
  customer_id_for_lock uuid;
  customer_email text;
  matched_access_rows integer;
begin
  select customer_id into customer_id_for_lock from public.orders where id = p_order_id;
  if not found then return 'NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtextextended(customer_id_for_lock::text, 0));
  select * into checkout from public.orders where id = p_order_id for update;
  if not found then return 'NOT_FOUND'; end if;

  if checkout.status = 'PAID' then
    if checkout.external_transaction_id = p_transaction_id then return 'DUPLICATE'; end if;
    return 'CONFLICT';
  end if;

  if checkout.status in ('MANUAL_REVIEW', 'REFUNDED', 'CHARGED_BACK') then return 'CONFLICT'; end if;

  if checkout.package_id <> 'forever' or checkout.amount <> 149900
    or p_amount is distinct from checkout.amount or p_currency is distinct from checkout.currency then
    update public.orders set status = 'MANUAL_REVIEW', provider_payload = p_payload
    where id = checkout.id;
    return 'MANUAL_REVIEW';
  end if;

  if p_status <> 'PAID' then
    update public.orders set status = p_status, provider_payload = p_payload
    where id = checkout.id and status = 'PENDING';
    return 'RECORDED';
  end if;

  -- A verified success can arrive after a failed/cancelled notification.
  select email into customer_email from auth.users where id = checkout.customer_id;

  insert into public.purchases (user_id, email, version, plan, amount, payment_id, discount_eligible, purchased_at)
  values (checkout.customer_id, customer_email, checkout.package_id, 'full', checkout.amount, p_transaction_id, false, now());

  -- Legacy projects may not have a unique constraint on user_access.user_id.
  update public.user_access set
    plan = 'full',
    expires_at = null,
    is_active = true,
    granted_at = now(),
    license_key = coalesce(license_key, p_license_key)
  where user_id = checkout.customer_id;
  get diagnostics matched_access_rows = row_count;
  if matched_access_rows > 1 then
    raise exception 'Multiple access rows for Grow customer';
  elsif matched_access_rows = 0 then
    insert into public.user_access (user_id, email, plan, is_active, expires_at, granted_at, license_key)
    values (checkout.customer_id, customer_email, 'full', true, null, now(), p_license_key);
  end if;

  update public.orders set status = 'PAID', external_transaction_id = p_transaction_id,
    provider_payload = p_payload, paid_at = now()
  where id = checkout.id;
  return 'PAID';
end;
$$;

-- Available to the database owner through the operator's linked Supabase
-- project. The browser, payment callback credential and ordinary service API
-- have no execute privilege on this operator reconciliation command.
create function public.support_reconcile_grow_reversal(
  p_order uuid,p_capture text,p_amount integer,p_currency text,p_kind text,p_reference text,p_apply boolean default false
) returns jsonb language plpgsql set search_path='' as $$
declare
  checkout public.orders%rowtype;
  previous public.grow_support_reversals%rowtype;
  result text;
begin
  if p_kind is null or p_kind not in ('full_refund','lost_chargeback')
    or p_reference is null or p_reference !~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{1,127}$' then
    return jsonb_build_object('result','INVALID');
  end if;
  select * into checkout from public.orders where id=p_order;
  if not found then return jsonb_build_object('result','NOT_FOUND'); end if;
  if p_apply then
    perform pg_advisory_xact_lock(hashtextextended(checkout.customer_id::text,0));
    select * into checkout from public.orders where id=p_order for update;
  end if;
  if checkout.payment_provider<>'grow_make' or checkout.package_id<>'forever' or checkout.amount<>149900
    or checkout.external_transaction_id is distinct from p_capture or checkout.amount is distinct from p_amount
    or checkout.currency is distinct from p_currency or not exists (
      select 1 from public.purchases p where p.user_id=checkout.customer_id and p.payment_id=p_capture
        and p.amount=p_amount and p.plan='full' and p.version='forever'
    ) then return jsonb_build_object('result','MISMATCH'); end if;
  select * into previous from public.grow_support_reversals where order_id=p_order or provider_reference=p_reference limit 1;
  if found then
    return jsonb_build_object('result',case when previous.order_id=p_order and previous.provider_reference=p_reference
      and previous.kind=p_kind then 'ALREADY_RECORDED' else 'CONFLICT' end);
  end if;
  if checkout.status='REFUNDED' and p_kind='full_refund' then
    result:='DUPLICATE';
  elsif checkout.status<>'PAID' then
    return jsonb_build_object('result','CONFLICT');
  end if;
  if p_apply is distinct from true then
    return jsonb_build_object('result','READY','status',checkout.status,'amount_agorot',checkout.amount,'currency',checkout.currency,
      'remaining_grow_seats',public.grow_paid_seat_count(checkout.customer_id) - case when checkout.status='PAID' then 1 else 0 end);
  end if;
  if result is null then
    result:=public.record_grow_refund(p_order,p_capture,p_amount,p_currency);
    if result<>'REFUNDED' then raise exception 'Settlement changed during reconciliation'; end if;
    if p_kind='lost_chargeback' then update public.orders set status='CHARGED_BACK' where id=p_order; end if;
  end if;
  insert into public.grow_support_reversals(order_id,kind,provider_reference) values(p_order,p_kind,p_reference);
  return jsonb_build_object('result','RECORDED','remaining_grow_seats',public.grow_paid_seat_count(checkout.customer_id));
end;
$$;
revoke all on function public.support_reconcile_grow_reversal(uuid,text,integer,text,text,text,boolean)
  from public,anon,authenticated,service_role;
