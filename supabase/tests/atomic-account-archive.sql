-- Local test database only. Auth insertion can trigger signup mail on hosted projects.
begin;
do $$
declare
  account_id uuid:=gen_random_uuid();
  new_account_id uuid:=gen_random_uuid();
  request_id uuid;
  paid_order uuid;
  pending_order uuid;
  email text:='archive-test@example.invalid';
  result text;
begin
  insert into auth.users(id,email,created_at,email_confirmed_at) values(account_id,email,now(),now());
  paid_order:=(public.open_grow_order(account_id,'forever',149900)->>'id')::uuid;
  if paid_order is null then raise exception 'first seat reservation'; end if;
  if public.fulfill_grow_order(paid_order,'archive-capture','PAID',149900,'ILS','{}','archive-key')<>'PAID' then raise exception 'fixture payment'; end if;
  pending_order:=(public.open_additional_grow_order(account_id,2)->>'id')::uuid;
  insert into public.deletion_requests(user_id,user_email,scheduled_for) values(account_id,'other@example.invalid',now()-interval '9 days') returning id into request_id;
  if public.archive_due_account(request_id)<>'SKIPPED'
     or not exists(select 1 from public.deletion_requests where id=request_id and user_email=email) then raise exception 'request identity/grace'; end if;
  update public.deletion_requests set requested_at=now()-interval '10 days',scheduled_for=now()-interval '3 days' where id=request_id;
  insert into public.email_log(payment_id,template,recipient) values('win-back:'||email,'win-back',email);
  create table public.archive_blocker(user_id uuid references auth.users(id));
  insert into archive_blocker values(account_id);
  begin
    perform public.archive_due_account(request_id);
    raise exception 'archived despite foreign key';
  exception when foreign_key_violation then null; end;
  if not exists(select 1 from public.orders where id=paid_order and customer_id=account_id) or exists(select 1 from public.deletion_log l where l.request_id is not null) then raise exception 'partial archival'; end if;
  delete from archive_blocker;
  if public.archive_due_account(request_id)<>'COMPLETED' or public.archive_due_account(request_id)<>'COMPLETED' then raise exception 'retry'; end if;
  if exists(select 1 from auth.users where id=account_id) or not exists(select 1 from public.purchases where payment_id='archive-capture' and user_id is null and amount=149900) then raise exception 'financial history'; end if;
  if exists(select 1 from public.email_log where payment_id='win-back:'||email or recipient=email) then raise exception 'lifecycle identity retained'; end if;
  insert into auth.users(id,email) values(new_account_id,email);
  if public.grow_paid_seat_count(new_account_id)<>0 then raise exception 'reused email granted access'; end if;
  result:=public.fulfill_grow_order(pending_order,'late-capture','PAID',149900,'ILS','{}','no-key');
  if result<>'MANUAL_REVIEW' or exists(select 1 from public.purchases where payment_id='late-capture') then raise exception 'late capture'; end if;
  if public.support_reconcile_grow_reversal(paid_order,'archive-capture',149900,'ILS','full_refund','archive-case',true)->>'result'<>'RECORDED' then raise exception 'archived refund'; end if;
end $$;
rollback;
