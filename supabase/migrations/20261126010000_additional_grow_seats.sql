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

alter table public.orders
  add column target_seat_number integer not null default 1 check (target_seat_number >= 1),
  add column prior_legacy_receipt text,
  add column prior_legacy_expires_at timestamptz;

-- Keep up to one historical seat. An additional paid order preserves its
-- original receipt and expiry if fulfillment changes the account's plan to Full.
create function public.legacy_seat_receipt(p_customer_id uuid, p_plan text)
returns setof text language sql stable set search_path = '' as $$
  select p.payment_id from public.purchases p
  where p.user_id=p_customer_id and p.plan=p.version
    and p.version in ('basic','professional','full','premium') and p.amount>0
    and nullif(trim(p.payment_id),'') is not null
    and not exists (select 1 from public.orders o where o.external_transaction_id=p.payment_id)
    and not exists (select 1 from public.orders o where o.customer_id=p_customer_id and o.prior_legacy_receipt=p.payment_id
      and o.status in ('PAID','REFUNDED') and o.prior_legacy_expires_at<=now())
    and (p.plan=p_plan or exists (
      select 1 from public.orders o where o.customer_id=p_customer_id and o.prior_legacy_receipt=p.payment_id
        and o.status in ('PAID','REFUNDED') and p_plan='full'
        and (o.prior_legacy_expires_at is null or o.prior_legacy_expires_at>now())
    ))
  order by p.purchased_at nulls last,p.payment_id limit 1
$$;
revoke all on function public.legacy_seat_receipt(uuid,text) from public, anon, authenticated;
grant execute on function public.legacy_seat_receipt(uuid,text) to service_role;

create function public.account_paid_seat_receipts(p_customer_id uuid, p_plan text)
returns setof text language sql stable set search_path = '' as $$
  select p.payment_id from public.purchases p
  where p.user_id=p_customer_id and (p.payment_id in (select public.legacy_seat_receipt(p_customer_id,p_plan))
    or (p_plan in ('full','premium') and p.payment_id in (select public.grow_paid_seat_receipts(p_customer_id))))
  order by p.purchased_at nulls last,p.payment_id
$$;
revoke all on function public.account_paid_seat_receipts(uuid,text) from public, anon, authenticated;
grant execute on function public.account_paid_seat_receipts(uuid,text) to service_role;

create function public.my_paid_seat_count()
returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.user_access a
    cross join lateral public.account_paid_seat_receipts(a.user_id,a.plan::text) receipts
  where a.user_id=auth.uid() and a.is_active and (a.expires_at is null or a.expires_at>now())
$$;
revoke all on function public.my_paid_seat_count() from public, anon;
grant execute on function public.my_paid_seat_count() to authenticated;

create function public.has_verified_desktop_purchase(p_customer_id uuid, p_plan text)
returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from public.account_paid_seat_receipts(p_customer_id,p_plan))
$$;
revoke all on function public.has_verified_desktop_purchase(uuid,text) from public, anon, authenticated;
grant execute on function public.has_verified_desktop_purchase(uuid,text) to service_role;

create function public.my_verified_desktop_purchase(p_plan text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_verified_desktop_purchase(auth.uid(),p_plan)
$$;
revoke all on function public.my_verified_desktop_purchase(text) from public, anon;
grant execute on function public.my_verified_desktop_purchase(text) to authenticated;


-- New clients explicitly select the next computer. The original order RPC
-- remains unchanged for a first purchase and continues to protect older clients.
create function public.open_additional_grow_order(p_customer_id uuid, p_target_seat integer)
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
      where o.customer_id=p_customer_id and o.prior_legacy_receipt=prior_receipt and o.status in ('PAID','REFUNDED')
      order by o.created_at limit 1;
    if not found then select expires_at into prior_expiry from public.user_access where user_id=p_customer_id; end if;
  end if;
  insert into public.orders(customer_id,package_id,amount,target_seat_number,prior_legacy_receipt,prior_legacy_expires_at)
    values(p_customer_id,'forever',149900,p_target_seat,prior_receipt,prior_expiry) returning * into checkout;
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
  if public.grow_paid_seat_count(checkout.customer_id)=0 then
    -- Restore a qualifying previous license when the last Grow seat is refunded.
    -- Never reactivate a manually disabled account.
    update public.user_access a set plan=p.plan::public.plan_tier,
      expires_at=(select o.prior_legacy_expires_at from public.orders o where o.customer_id=a.user_id
        and o.prior_legacy_receipt=p.payment_id and o.status in ('PAID','REFUNDED') order by o.created_at limit 1)
    from public.purchases p where a.user_id=checkout.customer_id and p.user_id=a.user_id
      and p.payment_id in (select public.legacy_seat_receipt(checkout.customer_id,a.plan::text));
    update public.user_access a set is_active=false where a.user_id=checkout.customer_id
      and not public.has_verified_desktop_purchase(a.user_id,a.plan::text);
  end if;
  return 'REFUNDED';
end;
$$;
revoke all on function public.record_grow_refund(uuid,text,integer,text) from public, anon, authenticated;
grant execute on function public.record_grow_refund(uuid,text,integer,text) to service_role;
