-- Operator-attested recovery for a lost creation response. Nothing ages out
-- automatically: the provider may still have a payable link or captured funds.
create table public.grow_unpaid_link_closures(
  order_id uuid primary key references public.orders(id) on delete restrict,
  provider_reference text not null unique,
  recorded_at timestamptz not null default now(),
  recorded_by text not null default current_user
);
alter table public.grow_unpaid_link_closures enable row level security;
revoke all on public.grow_unpaid_link_closures from public,anon,authenticated,service_role;


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
    if p_status='PAID' and checkout.external_transaction_id = p_transaction_id and checkout.amount=p_amount and checkout.currency=p_currency then
      return 'DUPLICATE';
    end if;
    return 'CONFLICT';
  end if;

  if checkout.status in ('MANUAL_REVIEW', 'REFUNDED', 'CHARGED_BACK') then return 'CONFLICT'; end if;

  if checkout.archived_at is not null then
    if p_status='PAID' then
      update public.orders set status='MANUAL_REVIEW',provider_payload=jsonb_build_object(
        'transactionId',p_transaction_id,'amount',p_amount,'currency',p_currency) where id=checkout.id;
      return 'MANUAL_REVIEW';
    end if;
    update public.orders set status=p_status where id=checkout.id and status='PENDING';
    return 'RECORDED';
  end if;

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

  -- A terminal attempt may settle late. If the customer has since opened
  -- another checkout for the same seat, preserve evidence for support and
  -- never create two licenses for the same intended purchase.
  if checkout.status in ('FAILED','CANCELLED') and (exists (select 1 from public.grow_unpaid_link_closures c where c.order_id=checkout.id) or exists (
    select 1 from public.orders newer where newer.customer_id=checkout.customer_id
      and newer.target_seat_number=checkout.target_seat_number
      and newer.created_at>checkout.created_at
  )) then
    update public.orders set status='MANUAL_REVIEW',provider_payload=p_payload where id=checkout.id;
    return 'MANUAL_REVIEW';
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

create function public.support_close_unpaid_grow_link(p_order uuid,p_reference text,p_apply boolean default false)
returns text language plpgsql set search_path='' as $$
declare
  checkout public.orders%rowtype;
  previous public.grow_unpaid_link_closures%rowtype;
begin
  if p_reference is null or p_reference !~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{1,127}$' then return 'INVALID'; end if;
  select * into checkout from public.orders where id=p_order;
  if not found then return 'NOT_FOUND'; end if;
  if p_apply is true then
    perform pg_advisory_xact_lock(hashtextextended(checkout.customer_id::text,0));
    select * into checkout from public.orders where id=p_order for update;
  end if;
  select * into previous from public.grow_unpaid_link_closures where order_id=p_order or provider_reference=p_reference limit 1;
  if found then
    if previous.order_id=p_order and previous.provider_reference=p_reference then return 'ALREADY_RECORDED'; end if;
    return 'CONFLICT';
  end if;
  if checkout.payment_provider<>'grow_make' or checkout.status<>'PENDING' or checkout.payment_url is not null
    or checkout.archived_at is not null or checkout.paid_at is not null or checkout.external_transaction_id is not null
    or checkout.created_at>now()-interval '1 hour' then return 'NOT_ELIGIBLE'; end if;
  if p_apply is distinct from true then return 'READY'; end if;
  insert into public.grow_unpaid_link_closures(order_id,provider_reference) values(p_order,p_reference);
  update public.orders set status='CANCELLED' where id=p_order;
  return 'RECORDED';
end;
$$;
revoke all on function public.support_close_unpaid_grow_link(uuid,text,boolean) from public,anon,authenticated,service_role;
