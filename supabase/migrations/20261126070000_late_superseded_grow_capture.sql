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
    if checkout.external_transaction_id = p_transaction_id and checkout.amount=p_amount and checkout.currency=p_currency then
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
  if checkout.status in ('FAILED','CANCELLED') and exists (
    select 1 from public.orders newer where newer.customer_id=checkout.customer_id
      and newer.target_seat_number=checkout.target_seat_number
      and newer.created_at>checkout.created_at
  ) then
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

