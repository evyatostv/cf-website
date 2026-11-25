alter table public.orders alter column customer_id drop not null;
alter table public.orders add column archived_at timestamptz;
alter table public.orders add constraint order_archive_owner check ((customer_id is null)=(archived_at is not null));
alter table public.deletion_log add column request_id uuid unique;

create function public.guard_deletion_request() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then
    select email into strict new.user_email from auth.users where id=new.user_id;
    new.requested_at:=now();
    new.scheduled_for:=now()+interval '7 days';
    new.status:='pending';
    new.completed_at:=null;
    new.canceled_at:=null;
  elsif auth.uid() is not null then
    if old.status<>'pending' or new.status<>'canceled' then
      raise exception 'Only pending requests can be canceled';
    end if;
    new:=old;
    new.status:='canceled';
    new.canceled_at:=now();
  end if;
  return new;
end;
$$;
create trigger guard_deletion_request before insert or update on public.deletion_requests
for each row execute function public.guard_deletion_request();

create function public.archive_due_account(p_request_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare
  req public.deletion_requests%rowtype;
  account auth.users%rowtype;
begin
  select * into req from public.deletion_requests where id=p_request_id;
  if not found then
    if exists(select 1 from public.deletion_log where request_id=p_request_id) then return 'COMPLETED'; end if;
    return 'SKIPPED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(req.user_id::text,0));
  select * into req from public.deletion_requests where id=p_request_id for update;
  if not found or req.status<>'pending' or req.scheduled_for>now()
      or req.requested_at+interval '7 days'>now() then return 'SKIPPED'; end if;
  select * into strict account from auth.users where id=req.user_id for update;

  if exists(select 1 from storage.objects where owner_id=account.id::text or owner=account.id)
    or exists(select 1 from storage.buckets where owner_id=account.id::text or owner=account.id) then return 'STORAGE_REVIEW'; end if;
  update public.email_log set recipient=null where payment_id in (
    select id::text from public.orders where customer_id=account.id
    union all select payment_id from public.purchases where user_id=account.id
  );
  -- Lifecycle dedupe keys may include the email itself; redact the key too.
  update public.email_log set recipient=null,payment_id='archived:'||id
  where template in ('trial-ending','trial-ended','win-back','renewal-upcoming','updates-lapsed')
    and (payment_id=template||':'||account.id or starts_with(payment_id,template||':'||account.id||':')
      or (account.email_confirmed_at is not null and sent_at>=account.created_at and
        (payment_id=template||':'||account.email or starts_with(payment_id,template||':'||account.email||':'))));
  delete from public.grow_receipt_attempts where order_id in (select id from public.orders where customer_id=account.id);
  update public.orders set customer_id=null,archived_at=now(),payment_url=null,provider_payload=null where customer_id=account.id;
  update public.purchases set user_id=null,email='deleted@redacted.invalid' where user_id=account.id;
  update public.download_log set user_id=null,email='deleted@redacted.invalid' where user_id=account.id;
  update public.policy_acceptances set user_id=null,user_email='deleted@redacted.invalid',user_agent=null where user_id=account.id;
  if account.email_confirmed_at is not null then
    delete from public.contact_messages where lower(email)=lower(account.email) and created_at>=account.created_at;
  end if;
  delete from public.beta_access_invitations where claimed_user_id=account.id;
  delete from public.users where id=account.id;
  delete from public.user_access where user_id=account.id;
  delete from auth.users where id=account.id;
  if not found then raise exception 'Account archival did not complete'; end if;
  insert into public.deletion_log(request_id,user_email_hash,requested_at,completed_at)
  values(req.id,encode(sha256(convert_to(lower(trim(account.email)),'UTF8')),'hex'),req.requested_at,now());
  return 'COMPLETED';
end;
$$;
revoke all on function public.archive_due_account(uuid) from public,anon,authenticated;
grant execute on function public.archive_due_account(uuid) to service_role;

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
  if checkout.payment_provider<>'grow_make' or checkout.package_id<>'forever' or checkout.amount<>149900
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
      'remaining_grow_seats',greatest(0,public.grow_paid_seat_count(checkout.customer_id) - case when checkout.status='PAID' then 1 else 0 end));
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
