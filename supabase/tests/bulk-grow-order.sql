begin;
do $$
declare
  buyer uuid:=gen_random_uuid();
  initial jsonb; extra jsonb; item record;
  original uuid; additional uuid; n integer; state text;
  token text; digest text; fp text; preview jsonb;
begin
  insert into auth.users(id,email) values(buyer,'bulk@example.invalid');
  perform set_config('request.jwt.claim.sub',buyer::text,true);
  if public.my_grow_price_quote(3) <> '{"paidSeats":0,"targetSeat":1,"quantity":3,"amount":389700,"currency":"ILS"}'::jsonb
    then raise exception 'First bundle quote'; end if;
  initial:=public.open_grow_bulk_order(buyer,1,3);original:=(initial->>'id')::uuid;
  if initial->>'result'<>'NEW' or initial->>'amount'<>'389700' then raise exception 'Wrong stored price'; end if;
  if public.open_grow_bulk_order(buyer,1,3)->>'id'<>initial->>'id' then raise exception 'Pending checkout duplication'; end if;
  if public.open_grow_bulk_order(buyer,1,2)->>'result'<>'MANUAL_REVIEW'
    or public.open_grow_order(buyer,'forever',149900)->>'result'<>'MANUAL_REVIEW' then raise exception 'Conflicting checkout dimensions'; end if;
  if public.grow_paid_seat_count(buyer)<>0 then raise exception 'Unpaid seats visible'; end if;
  if public.fulfill_grow_order(original,'bulk-capture','PAID',389700,'ILS','{}','key')<>'PAID' then raise exception 'First bulk fulfillment'; end if;
  if public.fulfill_grow_order(original,'bulk-capture','PAID',389700,'ILS','{}','unused')<>'DUPLICATE' then raise exception 'Replay'; end if;
  if public.my_paid_seat_count()<>3 or (select count(*) from public.purchases where user_id=buyer)<>1 then raise exception 'Seat or receipt count'; end if;
  for n in 1..4 loop
    token:=lpad(n::text,64,'0');digest:=encode(sha256(convert_to(token,'UTF8')),'hex');
    state:=public.resolve_paid_device('computer-'||n,null,'claim',digest);
    if (n<=3) <> (state='active') then raise exception 'Unexpected device claim % %',n,state; end if;
  end loop;
  if public.my_grow_price_quote(2)->>'amount'<>'239800' then raise exception 'Existing owner bundle price'; end if;
  extra:=public.open_grow_bulk_order(buyer,4,2);additional:=(extra->>'id')::uuid;
  if public.fulfill_grow_order(additional,'bulk-later','PAID',239800,'ILS','{}','unused')<>'PAID' then raise exception 'Subsequent bulk'; end if;
  if public.my_paid_seat_count()<>5 then raise exception 'Five seats expected'; end if;
  for n in 4..5 loop
    token:=lpad(n::text,64,'0');digest:=encode(sha256(convert_to(token,'UTF8')),'hex');
    if public.resolve_paid_device('computer-'||n,null,'claim',digest)<>'active' then raise exception 'Later device claim'; end if;
  end loop;
  for item in select * from public.claim_grow_receipts() loop
    if item.order_id=original and (item.amount<>389700 or item.quantity<>3) then raise exception 'First receipt'; end if;
    if item.order_id=additional and (item.amount<>239800 or item.quantity<>2) then raise exception 'Additional receipt'; end if;
  end loop;
  update public.user_access set machine_fingerprint='computer-2' where user_id=buyer;
  preview:=public.support_reconcile_grow_reversal(original,'bulk-capture',389700,'ILS','full_refund','bulk-refund',false);
  if preview->>'remaining_grow_seats'<>'2' then raise exception 'Preview lost surviving seats'; end if;
  if public.record_grow_refund(original,'bulk-capture',119900,'ILS')<>'CONFLICT' then raise exception 'Partial refund'; end if;
  perform public.support_reconcile_grow_reversal(original,'bulk-capture',389700,'ILS','full_refund','bulk-refund',true);
  if public.my_paid_seat_count()<>2 then raise exception 'Incorrect remaining count'; end if;
  for n in 1..5 loop
    if public.check_paid_device(lpad(n::text,64,'0'))<>(n>3) then raise exception 'Wrong device access after refund'; end if;
  end loop;
  select machine_fingerprint into fp from public.user_access where user_id=buyer;
  if fp is null or fp not in ('computer-4','computer-5') then raise exception 'Refunded primary retained'; end if;
  if public.fulfill_grow_order(original,'bulk-capture','PAID',389700,'ILS','{}','unused')<>'CONFLICT' then raise exception 'Refund replay'; end if;
  if has_function_privilege('authenticated','public.open_grow_bulk_order(uuid,integer,integer)','execute') then raise exception 'Browser can create server orders'; end if;
end $$;
rollback;
