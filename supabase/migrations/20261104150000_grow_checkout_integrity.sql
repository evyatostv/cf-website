alter table public.orders add column payment_url text;

-- Checkout and callback take the same customer lock before reading or
-- changing order state, so a paid or disputed order cannot race a new link.
create function public.open_grow_order(p_customer_id uuid, p_package_id text, p_amount integer)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  checkout public.orders%rowtype;
begin
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
    select 1 from public.user_access
    where user_id = p_customer_id and is_active and plan in (p_package_id, 'enterprise')
      and (expires_at is null or expires_at > now())
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
    return jsonb_build_object('result', 'PENDING', 'id', checkout.id, 'payment_url', checkout.payment_url);
  end if;
  insert into public.orders (customer_id, package_id, amount)
  values (p_customer_id, p_package_id, p_amount)
  returning * into checkout;
  return jsonb_build_object('result', 'NEW', 'id', checkout.id, 'package_id', checkout.package_id,
    'amount', checkout.amount, 'currency', checkout.currency);
end;
$$;

revoke execute on function public.open_grow_order(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.open_grow_order(uuid, text, integer) to service_role;

-- Record purchase and deliver the license in the same transaction as payment.
create function public.fulfill_grow_order(
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

  if checkout.status in ('MANUAL_REVIEW', 'REFUNDED') then return 'CONFLICT'; end if;

  if p_amount is distinct from checkout.amount or p_currency is distinct from checkout.currency then
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
  values (checkout.customer_id, customer_email, checkout.package_id, checkout.package_id, checkout.amount, p_transaction_id, false, now());

  -- Legacy projects may not have a unique constraint on user_access.user_id.
  update public.user_access set
    plan = case when plan = 'enterprise' and is_active and (expires_at is null or expires_at > now()) then plan else checkout.package_id end,
    expires_at = case when plan = 'enterprise' and is_active and (expires_at is null or expires_at > now()) then expires_at else null end,
    is_active = true,
    granted_at = now(),
    license_key = coalesce(license_key, p_license_key)
  where user_id = checkout.customer_id;
  get diagnostics matched_access_rows = row_count;
  if matched_access_rows > 1 then
    raise exception 'Multiple access rows for Grow customer';
  elsif matched_access_rows = 0 then
    insert into public.user_access (user_id, email, plan, is_active, expires_at, granted_at, license_key)
    values (checkout.customer_id, customer_email, checkout.package_id, true, null, now(), p_license_key);
  end if;

  update public.orders set status = 'PAID', external_transaction_id = p_transaction_id,
    provider_payload = p_payload, paid_at = now()
  where id = checkout.id;
  return 'PAID';
end;
$$;

revoke execute on function public.fulfill_grow_order(uuid, text, text, integer, text, jsonb, text)
from public, anon, authenticated;
grant execute on function public.fulfill_grow_order(uuid, text, text, integer, text, jsonb, text)
to service_role;
