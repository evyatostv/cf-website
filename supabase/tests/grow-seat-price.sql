begin;
do $$
declare
  buyer uuid:=gen_random_uuid();
  other_buyer uuid:=gen_random_uuid();
  first_id uuid;
  second_id uuid;
  third_id uuid;
  purchase record;
begin
  insert into auth.users(id,email) values(buyer,'seat-price@example.invalid'),(other_buyer,'other-price@example.invalid');
  perform set_config('request.jwt.claim.sub',buyer::text,true);
  if public.my_grow_price_quote() <> '{"targetSeat":1,"paidSeats":0,"amount":149900,"currency":"ILS"}'::jsonb
    then raise exception 'Incorrect first quote'; end if;
  first_id:=(public.open_grow_order(buyer,'forever',149900)->>'id')::uuid;
  if public.open_additional_grow_order(buyer,2)->>'result'<>'SEATS_CHANGED' then raise exception 'Pending first order eligible'; end if;
  perform public.fulfill_grow_order(first_id,'price-first','PAID',149900,'ILS','{}','first-key');
  if public.my_grow_price_quote() <> '{"targetSeat":2,"paidSeats":1,"amount":119900,"currency":"ILS"}'::jsonb
    then raise exception 'Incorrect additional quote'; end if;
  second_id:=(public.open_additional_grow_order(buyer,2)->>'id')::uuid;
  perform public.fulfill_grow_order(second_id,'price-second','PAID',119900,'ILS','{}','second-key');
  if public.fulfill_grow_order(second_id,'price-second','PAID',119900,'ILS','{}','unused')<>'DUPLICATE' then raise exception 'Capture replay'; end if;
  if public.grow_paid_seat_count(buyer)<>2 or (select count(*) from public.purchases where user_id=buyer)<>2
    then raise exception 'Each capture must grant exactly one seat'; end if;
  if public.pending_grow_receipt_count()<>2 then raise exception 'Expected both receipts'; end if;
  for purchase in select * from public.claim_grow_receipts() loop
    if purchase.amount<>(case when purchase.order_id=first_id then 149900 else 119900 end) then raise exception 'Wrong emailed amount'; end if;
  end loop;
  third_id:=(public.open_additional_grow_order(buyer,3)->>'id')::uuid;
  if not exists(select 1 from public.orders where id=third_id and amount=119900) then raise exception 'Third seat price'; end if;
  perform public.record_grow_refund(second_id,'price-second',119900,'ILS');
  perform public.record_grow_refund(first_id,'price-first',149900,'ILS');
  if public.fulfill_grow_order(third_id,'price-third','PAID',119900,'ILS','{}','third-key')<>'MANUAL_REVIEW'
    then raise exception 'Stale additional link granted first seat'; end if;
  -- Historical second seats sold at the previous full price retain their own entitlement and refund amount.
  insert into public.orders(customer_id,package_id,amount,target_seat_number)
    values(other_buyer,'forever',149900,2) returning id into second_id;
  if public.fulfill_grow_order(second_id,'old-price','PAID',149900,'ILS','{}','history-key')<>'PAID'
    then raise exception 'Historical full price rejected'; end if;
  if public.grow_paid_seat_count(other_buyer)<>1 then raise exception 'Historical full price lost'; end if;
  if public.support_reconcile_grow_reversal(second_id,'old-price',149900,'ILS','full_refund','old-price-refund',true)->>'result'<>'RECORDED'
    then raise exception 'Historical refund rejected'; end if;
  if has_function_privilege('anon','public.my_grow_price_quote()','execute') then raise exception 'Anonymous quote'; end if;
end $$;
rollback;
