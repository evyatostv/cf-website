begin;
do $$
declare
  account_id uuid:=gen_random_uuid();
  cancelled uuid;
  replacement uuid;
begin
  insert into auth.users(id,email) values(account_id,'late-settlement@example.invalid');
  cancelled:=(public.open_grow_order(account_id,'forever',149900)->>'id')::uuid;
  update public.orders set created_at=now()-interval '5 minutes' where id=cancelled;
  if public.fulfill_grow_order(cancelled,'earlier','CANCELLED',149900,'ILS','{}','unused')<>'RECORDED' then raise exception 'cancellation'; end if;
  replacement:=(public.open_grow_order(account_id,'forever',149900)->>'id')::uuid;
  if public.fulfill_grow_order(cancelled,'earlier','PAID',149900,'ILS','{"transactionId":"earlier"}','unused')<>'MANUAL_REVIEW' then raise exception 'superseded payment'; end if;
  if exists(select 1 from public.purchases where user_id=account_id) then raise exception 'premature license'; end if;
  if public.fulfill_grow_order(replacement,'replacement','PAID',149900,'ILS','{}','test-key')<>'PAID' then raise exception 'replacement'; end if;
  if public.fulfill_grow_order(replacement,'replacement','PAID',149900,'ILS','{}','test-key')<>'DUPLICATE' then raise exception 'duplicate'; end if;
  if public.fulfill_grow_order(replacement,'replacement','PAID',1,'ILS','{}','test-key')<>'CONFLICT' then raise exception 'mismatched duplicate'; end if;
  if public.grow_paid_seat_count(account_id)<>1 then raise exception 'incorrect paid seats'; end if;
end $$;
rollback;
