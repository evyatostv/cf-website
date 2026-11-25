-- Disposable database, no worker or external mail transport.
begin;
do $$
declare
  buyer uuid:=gen_random_uuid();
  checkout jsonb;
  delivery record;
  order_id uuid;
begin
  insert into auth.users(id,email) values(buyer,'receipt@example.test');
  checkout:=public.open_grow_order(buyer,'forever',149900);
  order_id:=(checkout->>'id')::uuid;
  if exists(select 1 from public.claim_grow_receipts()) then raise exception 'Pending order queued'; end if;
  perform public.fulfill_grow_order(order_id,buyer::text,'PAID',149900,'ILS','{}',buyer::text);
  select * into strict delivery from public.claim_grow_receipts();
  if delivery.order_id<>order_id or delivery.amount<>149900 or delivery.recipient<>'receipt@example.test' then
    raise exception 'Receipt did not match verified order';
  end if;
  if exists(select 1 from public.claim_grow_receipts()) then raise exception 'Concurrent duplicate'; end if;
  update public.grow_receipt_attempts set retry_after=now()-interval '1 minute';
  if (select count(*) from public.claim_grow_receipts())<>1 then raise exception 'Retry unavailable'; end if;
  update public.grow_receipt_attempts set first_attempt=now()-interval '25 hours',retry_after=now()-interval '1 minute';
  if exists(select 1 from public.claim_grow_receipts()) or public.grow_receipts_requiring_review()<>1 then
    raise exception 'Expired ambiguous send retried';
  end if;
  insert into public.email_log(payment_id,template,recipient) values(order_id::text,'order-confirmation',delivery.recipient);
  if exists(select 1 from public.claim_grow_receipts()) or public.grow_receipts_requiring_review()<>0 then
    raise exception 'Previously accepted receipt still queued';
  end if;
end;
$$;
rollback;
