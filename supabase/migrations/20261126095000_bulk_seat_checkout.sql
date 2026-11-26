-- Historical orders bought a single computer license. Financial receipts remain
-- one per capture. Additional device entitlements derive from the paid order.
alter table public.orders add column license_quantity integer not null default 1
  check(license_quantity between 1 and 100);

create function public.grow_order_total(first_seat integer, qty integer)
returns integer language sql immutable strict set search_path='' as $$
  select case when first_seat>=1 and qty between 1 and 100
    then qty*119900 + case when first_seat=1 then 30000 else 0 end end
$$;
create function public.valid_grow_order_price(first_seat integer,qty integer,agorot integer)
returns boolean language sql immutable strict set search_path='' as $$
  select agorot=public.grow_order_total(first_seat,qty)
    or (qty=1 and public.valid_grow_seat_price(first_seat,agorot))
$$;

create function public.my_grow_price_quote(p_quantity integer)
returns jsonb language plpgsql stable set search_path='' as $$
declare seats integer:=public.my_paid_seat_count();
begin
  if p_quantity is null or p_quantity not between 1 and 100 then raise exception 'Invalid license quantity' using errcode='22023'; end if;
  return jsonb_build_object('paidSeats',seats,'targetSeat',seats+1,'currency','ILS','quantity',p_quantity,
    'amount',public.grow_order_total(seats+1,p_quantity));
end $$;
revoke all on function public.my_grow_price_quote(integer) from public,anon;
grant execute on function public.my_grow_price_quote(integer) to authenticated;

create function public.open_grow_bulk_order(p_customer_id uuid,p_target_seat integer,p_quantity integer)
returns jsonb language plpgsql set search_path='' as $$
declare
  result jsonb;
  checkout public.orders%rowtype;
  seats integer;
  total integer:=public.grow_order_total(p_target_seat,p_quantity);
begin
  if total is null then raise exception 'Invalid license quantity or seat'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_customer_id::text,0));
  if exists(select 1 from public.deletion_requests where user_id=p_customer_id and status='pending') then
    return jsonb_build_object('result','DELETION_PENDING');
  end if;
  if exists(select 1 from public.orders where customer_id=p_customer_id and status='MANUAL_REVIEW') then
    return jsonb_build_object('result','MANUAL_REVIEW');
  end if;
  select count(*) into seats from public.user_access a
    cross join lateral public.account_paid_seat_receipts(a.user_id,a.plan::text)
    where a.user_id=p_customer_id and a.is_active and (a.expires_at is null or a.expires_at>now());
  if p_target_seat<>seats+1 then return jsonb_build_object('result','SEATS_CHANGED'); end if;
  select * into checkout from public.orders where customer_id=p_customer_id and package_id='forever' and status='PENDING';
  if found then
    if checkout.target_seat_number<>p_target_seat or checkout.license_quantity<>p_quantity or checkout.amount<>total then
      return jsonb_build_object('result','MANUAL_REVIEW');
    end if;
    return jsonb_build_object('result','PENDING','id',checkout.id,'payment_url',checkout.payment_url,
      'quantity',checkout.license_quantity,'amount',checkout.amount,'currency',checkout.currency);
  end if;
  -- Reuse all historical purchase/upgrade eligibility and legacy expiry checks.
  if p_target_seat=1 then result:=public.open_grow_order(p_customer_id,'forever',149900);
  else result:=public.open_additional_grow_order(p_customer_id,p_target_seat); end if;
  if result->>'result'='NEW' then
    update public.orders set license_quantity=p_quantity,amount=total where id=(result->>'id')::uuid;
    return result || jsonb_build_object('quantity',p_quantity,'amount',total);
  end if;
  return result;
end $$;
revoke all on function public.open_grow_bulk_order(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.open_grow_bulk_order(uuid,integer,integer) to service_role;

create function public.grow_seat_identity(order_id uuid,capture text,seat_position integer)
returns text language sql immutable strict set search_path='' as $$
  select case when seat_position=1 then capture else 'grow-seat:'||order_id::text||':'||seat_position::text end
$$;
create function public.grow_paid_order_seats(p_customer_id uuid)
returns table(receipt text,purchase_date timestamptz,capture text,seat_index integer)
language sql stable set search_path='' as $$
  select public.grow_seat_identity(o.id,p.payment_id,n),p.purchased_at,p.payment_id,n
  from public.purchases p join public.orders o on o.external_transaction_id=p.payment_id and o.customer_id=p.user_id
  cross join lateral generate_series(1,o.license_quantity) n
  where p.user_id=p_customer_id and p.version='forever' and p.plan='full'
    and p.amount=o.amount and public.valid_grow_order_price(o.target_seat_number,o.license_quantity,o.amount)
    and o.currency='ILS' and o.package_id='forever' and o.payment_provider='grow_make' and o.status='PAID'
    and nullif(trim(p.payment_id),'') is not null
$$;
revoke all on function public.grow_paid_order_seats(uuid) from public,anon,authenticated;
grant execute on function public.grow_paid_order_seats(uuid) to service_role;

create or replace function public.grow_paid_seat_receipts(p_customer_id uuid)
returns setof text language sql stable set search_path='' as $$
  select receipt from public.grow_paid_order_seats(p_customer_id)
  order by purchase_date nulls last,capture,seat_index
$$;
create or replace function public.account_paid_seat_receipts(p_customer_id uuid,p_plan text)
returns setof text language sql stable set search_path='' as $$
  select receipt from (
    select p.payment_id as receipt,p.purchased_at as purchase_date,p.payment_id as capture,1 as seat_index
    from public.purchases p where p.user_id=p_customer_id
      and p.payment_id in (select public.legacy_seat_receipt(p_customer_id,p_plan))
    union all
    select receipt,purchase_date,capture,seat_index from public.grow_paid_order_seats(p_customer_id)
    where p_plan in ('full','premium')
  ) seats order by purchase_date nulls last,capture,seat_index
$$;

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
    where a.user_id = p_customer_id and a.is_active 
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
    if checkout.license_quantity<>1 or checkout.target_seat_number <> 1 then
      return jsonb_build_object('result','MANUAL_REVIEW');
    end if;
    return jsonb_build_object('result', 'PENDING', 'id', checkout.id, 'payment_url', checkout.payment_url,'amount',checkout.amount,'currency',checkout.currency);
  end if;
  insert into public.orders (customer_id, package_id, amount)
  values (p_customer_id, p_package_id, p_amount)
  returning * into checkout;
  return jsonb_build_object('result', 'NEW', 'id', checkout.id, 'package_id', checkout.package_id,
    'amount', checkout.amount, 'currency', checkout.currency);
end;
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
    if checkout.license_quantity<>1 or checkout.target_seat_number <> p_target_seat or checkout.amount <> 119900 then
      return jsonb_build_object('result','MANUAL_REVIEW');
    end if;
    return jsonb_build_object('result','PENDING','id',checkout.id,'payment_url',checkout.payment_url,'amount',checkout.amount,'currency',checkout.currency);
  end if;
  select r into prior_receipt from public.legacy_seat_receipt(p_customer_id,current_plan) r;
  if prior_receipt is not null then
    select o.prior_legacy_expires_at into prior_expiry from public.orders o
      where o.customer_id=p_customer_id and o.prior_legacy_receipt=prior_receipt and o.status in ('PAID','REFUNDED','CHARGED_BACK')
      order by o.created_at limit 1;
    if not found then select expires_at into prior_expiry from public.user_access where user_id=p_customer_id; end if;
  end if;
  insert into public.orders(customer_id,package_id,amount,target_seat_number,prior_legacy_receipt,prior_legacy_expires_at)
    values(p_customer_id,'forever',119900,p_target_seat,prior_receipt,prior_expiry) returning * into checkout;
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

  if checkout.package_id <> 'forever' or not public.valid_grow_order_price(checkout.target_seat_number,checkout.license_quantity,checkout.amount)
    or (p_status='PAID' and checkout.target_seat_number>1 and checkout.amount<>149900 and not exists(
      select 1 from public.user_access a
      where a.user_id=checkout.customer_id and a.is_active and (a.expires_at is null or a.expires_at>now())
        and public.has_verified_desktop_purchase(a.user_id,a.plan::text)))
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

create or replace function public.support_reconcile_grow_reversal(
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
  if checkout.payment_provider<>'grow_make' or checkout.package_id<>'forever' or not public.valid_grow_order_price(checkout.target_seat_number,checkout.license_quantity,checkout.amount)
    or checkout.external_transaction_id is distinct from p_capture or checkout.amount is distinct from p_amount
    or checkout.currency is distinct from p_currency or not exists (
      select 1 from public.purchases p where (p.user_id=checkout.customer_id or (checkout.archived_at is not null and p.user_id is null)) and p.payment_id=p_capture
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
      'remaining_grow_seats',greatest(0,public.grow_paid_seat_count(checkout.customer_id) - case when checkout.status='PAID' then checkout.license_quantity else 0 end));
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

create or replace function public.pending_grow_receipt_count() returns bigint language sql stable set search_path='' as $$
  select count(*)
    from public.orders o
    join public.purchases p on p.user_id=o.customer_id and p.payment_id=o.external_transaction_id
      and p.amount=o.amount and p.plan='full' and p.version='forever'
    left join public.grow_receipt_attempts a on a.order_id=o.id
    where o.paid_at >= (select starts_at from public.grow_receipt_cutover)
      and o.status='PAID' and o.payment_provider='grow_make'
      and o.package_id='forever' and o.currency='ILS' and public.valid_grow_order_price(o.target_seat_number,o.license_quantity,o.amount)
      and p.email is not null and trim(p.email)<>''
      and not exists(select 1 from public.email_log l where l.payment_id in (o.id::text,o.external_transaction_id) and l.template='order-confirmation')
      and (a.order_id is null or (a.retry_after<=now() and a.first_attempt > now()-interval '23 hours'))
$$;

drop function public.claim_grow_receipts();
create function public.claim_grow_receipts() returns table(order_id uuid, recipient text, amount integer, quantity integer)
language sql set search_path='' as $$
  with eligible as (
    select o.id,o.amount,o.license_quantity,p.email
    from public.orders o
    join public.purchases p on p.user_id=o.customer_id and p.payment_id=o.external_transaction_id
      and p.amount=o.amount and p.plan='full' and p.version='forever'
    left join public.grow_receipt_attempts a on a.order_id=o.id
    where o.paid_at >= (select starts_at from public.grow_receipt_cutover)
      and o.status='PAID' and o.payment_provider='grow_make'
      and o.package_id='forever' and o.currency='ILS' and public.valid_grow_order_price(o.target_seat_number,o.license_quantity,o.amount)
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
  select c.order_id,c.recipient,e.amount,e.license_quantity from claimed c join eligible e on e.id=c.order_id
$$;

create or replace function public.record_grow_refund(p_order_id uuid, p_transaction_id text, p_amount integer, p_currency text)
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
  -- Coordinate with claims/transfers, which lock this account row before
  -- assigning a payment to a fingerprint.
  perform 1 from public.user_access where user_id=checkout.customer_id for update;
  -- Before the first device-aware client runs, preserve the same legacy
  -- binding resolve_paid_device would create from the pre-refund receipt list.
  insert into public.paid_device_claims(user_id,payment_id,fingerprint)
  select a.user_id,original.payment_id,a.machine_fingerprint from public.user_access a
  cross join lateral (
    select r.payment_id from public.account_paid_seat_receipts(a.user_id,a.plan::text)
      with ordinality r(payment_id,position) order by r.position limit 1
  ) original
  where a.user_id=checkout.customer_id and nullif(a.machine_fingerprint,'') is not null
    and not exists(select 1 from public.paid_device_claims c where c.user_id=a.user_id);
  update public.orders set status='REFUNDED' where id=p_order_id;
  if public.grow_paid_seat_count(checkout.customer_id)=0 then
    -- Restore a qualifying previous license when the last Grow seat is refunded.
    -- Never reactivate a manually disabled account.
    update public.user_access a set plan=p.plan::public.plan_tier, expires_at=original.prior_legacy_expires_at
    from public.purchases p cross join lateral (
      select o.prior_legacy_expires_at from public.orders o where o.customer_id=p.user_id
        and o.prior_legacy_receipt=p.payment_id and o.status in ('PAID','REFUNDED','CHARGED_BACK') order by o.created_at limit 1
    ) original where a.user_id=checkout.customer_id and p.user_id=a.user_id
      and p.payment_id in (select public.legacy_seat_receipt(checkout.customer_id,a.plan::text));
    update public.user_access a set is_active=false where a.user_id=checkout.customer_id
      and not public.has_verified_desktop_purchase(a.user_id,a.plan::text);
  end if;
  -- Older clients read the account's primary fingerprint. When that exact
  -- device lost its payment, point them to a surviving bound installation.
  update public.user_access a set machine_fingerprint=(
    select c.fingerprint from public.account_paid_seat_receipts(a.user_id,a.plan::text)
      with ordinality receipt(payment_id,position)
    join public.paid_device_claims c on c.user_id=a.user_id and c.payment_id=receipt.payment_id
    order by receipt.position limit 1
  )
  where a.user_id=checkout.customer_id and exists (
    select 1 from public.paid_device_claims old where old.user_id=a.user_id
      and old.payment_id in (select public.grow_seat_identity(checkout.id,p_transaction_id,n) from generate_series(1,checkout.license_quantity) n) and old.fingerprint=a.machine_fingerprint
  );
  return 'REFUNDED';
end;
$$;

revoke all on function public.claim_grow_receipts() from public,anon,authenticated;
grant execute on function public.claim_grow_receipts() to service_role;
