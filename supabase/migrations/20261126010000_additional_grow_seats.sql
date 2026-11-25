-- A Grow seat is a settled order with the matching receipt for this account.
create function public.grow_paid_seat_receipts(p_customer_id uuid)
returns setof text language sql stable set search_path = '' as $$
  select p.payment_id
  from public.purchases p
  join public.orders o on o.external_transaction_id = p.payment_id and o.customer_id = p.user_id
  where p.user_id = p_customer_id and p.version = 'forever' and p.plan = 'full'
    and p.amount = 149900 and p.amount = o.amount and o.currency = 'ILS'
    and o.package_id = 'forever' and o.payment_provider = 'grow_make' and o.status = 'PAID'
    and nullif(trim(p.payment_id), '') is not null
$$;
revoke all on function public.grow_paid_seat_receipts(uuid) from public, anon, authenticated;
grant execute on function public.grow_paid_seat_receipts(uuid) to service_role;

create function public.grow_paid_seat_count(p_customer_id uuid)
returns integer language sql stable set search_path = '' as $$
  select count(*)::integer from public.grow_paid_seat_receipts(p_customer_id)
$$;
revoke all on function public.grow_paid_seat_count(uuid) from public, anon, authenticated;
grant execute on function public.grow_paid_seat_count(uuid) to service_role;

create function public.my_grow_paid_seat_count()
returns integer language sql stable security definer set search_path = '' as $$
  select public.grow_paid_seat_count(auth.uid())
$$;
revoke all on function public.my_grow_paid_seat_count() from public, anon;
grant execute on function public.my_grow_paid_seat_count() to authenticated;

-- Historical providers recorded receipts without a Grow order. Once a receipt
-- belongs to a Grow transaction its order status is authoritative.
create function public.has_verified_desktop_purchase(p_customer_id uuid, p_plan text)
returns boolean language sql stable set search_path = '' as $$
  select (p_plan = 'full' and exists (select 1 from public.grow_paid_seat_receipts(p_customer_id)))
    or exists (
      select 1 from public.purchases p where p.user_id = p_customer_id and p.plan = p_plan
        and p.amount > 0 and nullif(trim(p.payment_id),'') is not null
        and not exists (select 1 from public.orders o where o.external_transaction_id = p.payment_id)
    )
$$;
revoke all on function public.has_verified_desktop_purchase(uuid,text) from public, anon, authenticated;
grant execute on function public.has_verified_desktop_purchase(uuid,text) to service_role;

create function public.my_verified_desktop_purchase(p_plan text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_verified_desktop_purchase(auth.uid(),p_plan)
$$;
revoke all on function public.my_verified_desktop_purchase(text) from public, anon;
grant execute on function public.my_verified_desktop_purchase(text) to authenticated;

alter table public.orders add column target_seat_number integer not null default 1 check (target_seat_number >= 1);

-- New clients explicitly select the next computer. The original order RPC
-- remains unchanged for a first purchase and continues to protect older clients.
create function public.open_additional_grow_order(p_customer_id uuid, p_target_seat integer)
returns jsonb language plpgsql set search_path = '' as $$
declare
  seats integer;
  checkout public.orders%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_customer_id::text, 0));
  if exists (select 1 from public.deletion_requests where user_id=p_customer_id and status='pending') then
    return jsonb_build_object('result','DELETION_PENDING');
  end if;
  if exists (select 1 from public.orders where customer_id=p_customer_id and status='MANUAL_REVIEW') then
    return jsonb_build_object('result','MANUAL_REVIEW');
  end if;
  seats := public.grow_paid_seat_count(p_customer_id);
  if seats < 1 or p_target_seat is distinct from seats + 1 or not exists (
    select 1 from public.user_access where user_id=p_customer_id and plan='full'
      and is_active and (expires_at is null or expires_at > now())
  ) then
    return jsonb_build_object('result','SEATS_CHANGED');
  end if;
  select * into checkout from public.orders where customer_id=p_customer_id and package_id='forever' and status='PENDING';
  if found then
    if checkout.target_seat_number <> p_target_seat then
      return jsonb_build_object('result','MANUAL_REVIEW');
    end if;
    return jsonb_build_object('result','PENDING','id',checkout.id,'payment_url',checkout.payment_url);
  end if;
  insert into public.orders(customer_id,package_id,amount,target_seat_number) values(p_customer_id,'forever',149900,p_target_seat) returning * into checkout;
  return jsonb_build_object('result','NEW','id',checkout.id,'package_id',checkout.package_id,'amount',checkout.amount,'currency',checkout.currency);
end;
$$;
revoke all on function public.open_additional_grow_order(uuid,integer) from public, anon, authenticated;
grant execute on function public.open_additional_grow_order(uuid,integer) to service_role;

create or replace function public.open_grow_order(p_customer_id uuid, p_package_id text, p_amount integer)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  checkout public.orders%rowtype;
begin
  if p_package_id is distinct from 'forever' or p_amount is distinct from 149900 then
    raise exception 'Invalid Grow package or price';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_customer_id::text, 0));
  if exists (
    select 1 from public.deletion_requests where user_id = p_customer_id and status = 'pending'
  ) then
    return jsonb_build_object('result', 'DELETION_PENDING');
  end if;
  if exists (
    select 1 from public.orders
    where customer_id = p_customer_id and package_id = p_package_id and status = 'MANUAL_REVIEW'
  ) then
    return jsonb_build_object('result', 'MANUAL_REVIEW');
  end if;
  if exists (
    select 1 from public.user_access a
    where a.user_id = p_customer_id and a.is_active and a.plan in ('full', 'premium')
      and (a.expires_at is null or a.expires_at > now())
      and public.has_verified_desktop_purchase(a.user_id,a.plan::text)
  ) then
    return jsonb_build_object('result', 'ACTIVE_LICENSE');
  end if;
  if exists (
    select 1 from public.orders
    where customer_id = p_customer_id and package_id = p_package_id and status = 'PAID'
  ) then
    return jsonb_build_object('result', 'ALREADY_PAID');
  end if;
  select * into checkout from public.orders
  where customer_id = p_customer_id and package_id = p_package_id and status = 'PENDING';
  if found then
    if checkout.target_seat_number <> 1 then
      return jsonb_build_object('result','MANUAL_REVIEW');
    end if;
    return jsonb_build_object('result', 'PENDING', 'id', checkout.id, 'payment_url', checkout.payment_url);
  end if;
  insert into public.orders (customer_id, package_id, amount)
  values (p_customer_id, p_package_id, p_amount)
  returning * into checkout;
  return jsonb_build_object('result', 'NEW', 'id', checkout.id, 'package_id', checkout.package_id,
    'amount', checkout.amount, 'currency', checkout.currency);
end;
$$;


-- Make sends a confirmed full refund referencing the original capture ID.
create function public.record_grow_refund(p_order_id uuid, p_transaction_id text, p_amount integer, p_currency text)
returns text language plpgsql set search_path = '' as $$
declare
  checkout public.orders%rowtype;
begin
  select * into checkout from public.orders where id=p_order_id;
  if not found then return 'NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtextextended(checkout.customer_id::text, 0));
  select * into checkout from public.orders where id=p_order_id for update;
  if checkout.external_transaction_id is distinct from p_transaction_id
    or checkout.amount is distinct from p_amount or checkout.currency is distinct from p_currency
    or checkout.status not in ('PAID','REFUNDED') then return 'CONFLICT';
  end if;
  if checkout.status = 'REFUNDED' then return 'DUPLICATE'; end if;
  update public.orders set status='REFUNDED' where id=p_order_id;
  return 'REFUNDED';
end;
$$;
revoke all on function public.record_grow_refund(uuid,text,integer,text) from public, anon, authenticated;
grant execute on function public.record_grow_refund(uuid,text,integer,text) to service_role;
