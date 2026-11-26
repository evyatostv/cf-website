-- Exercise both possible reversal orders with an additional discounted seat.
begin;
do $$
declare
  buyer uuid; order_one uuid; order_two uuid;
  tx_one text; tx_two text; first_order uuid; second_order uuid;
  first_tx text; last_tx text;
  token_home text:=repeat('d',64); token_office text:=repeat('e',64);
  home_digest text:=encode(sha256(convert_to(token_home,'UTF8')),'hex');
  office_digest text:=encode(sha256(convert_to(token_office,'UTF8')),'hex');
  first_kind text; remaining text; refunded_fp text; remaining_fp text;
  outcome jsonb; reverse_second boolean;
begin
  foreach reverse_second in array array[true,false] loop
    buyer:=gen_random_uuid();tx_one:='first-'||buyer;tx_two:='second-'||buyer;
    insert into auth.users(id,email) values(buyer,buyer||'@example.invalid');
    perform set_config('request.jwt.claim.sub',buyer::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',buyer)::text,true);
    order_one:=(public.open_grow_order(buyer,'forever',149900)->>'id')::uuid;
    perform public.fulfill_grow_order(order_one,tx_one,'PAID',149900,'ILS','{}','key-'||buyer);
    perform public.resolve_paid_device('home',null,'claim',home_digest);
    order_two:=(public.open_additional_grow_order(buyer,2)->>'id')::uuid;
    perform public.fulfill_grow_order(order_two,tx_two,'PAID',119900,'ILS','{}','unused');
    perform public.resolve_paid_device('office',null,'claim',office_digest);
    if reverse_second then
      first_order:=order_two; second_order:=order_one; first_tx:=tx_two; last_tx:=tx_one;
      first_kind:='full_refund'; remaining:=token_home; remaining_fp:='home'; refunded_fp:='office';
    else
      first_order:=order_one; second_order:=order_two; first_tx:=tx_one; last_tx:=tx_two;
      first_kind:='lost_chargeback'; remaining:=token_office; remaining_fp:='office'; refunded_fp:='home';
    end if;
    outcome:=public.support_reconcile_grow_reversal(first_order,first_tx,case when reverse_second then 119900 else 149900 end,'ILS',first_kind,'case-a-'||buyer,true);
    if outcome->>'result'<>'RECORDED' or (outcome->>'remaining_grow_seats')::int<>1 then raise exception 'first reversal count'; end if;
    if not public.check_paid_device(remaining)
      or public.resolve_paid_device(refunded_fp,null,'check',null)<>'unbound'
      or public.resolve_paid_device(remaining_fp,null,'check',null)<>'active' then raise exception 'first reversal online enforcement'; end if;
    if (select machine_fingerprint from public.user_access where user_id=buyer) is distinct from remaining_fp then
      raise exception 'legacy primary still points to the reversed computer'; end if;
    if public.support_reconcile_grow_reversal(first_order,first_tx,case when reverse_second then 119900 else 149900 end,'ILS',first_kind,'case-a-'||buyer,true)->>'result'<>'ALREADY_RECORDED' then raise exception 'duplicate'; end if;
    outcome:=public.support_reconcile_grow_reversal(second_order,last_tx,case when reverse_second then 149900 else 119900 end,'ILS','full_refund','case-b-'||buyer,true);
    if (outcome->>'remaining_grow_seats')::int<>0 or public.check_paid_device(token_home) or public.check_paid_device(token_office)
      or (select is_active from public.user_access where user_id=buyer) then raise exception 'last reversal'; end if;
    delete from public.paid_device_claims where user_id=buyer;
  end loop;
  -- A customer can buy both computers before upgrading a legacy first PC.
  buyer:=gen_random_uuid();tx_one:='legacy-a-'||buyer;tx_two:='legacy-b-'||buyer;
  insert into auth.users(id,email) values(buyer,buyer||'@example.invalid');
  perform set_config('request.jwt.claim.sub',buyer::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',buyer)::text,true);
  order_one:=(public.open_grow_order(buyer,'forever',149900)->>'id')::uuid;
  perform public.fulfill_grow_order(order_one,tx_one,'PAID',149900,'ILS','{}','key-'||buyer);
  update public.user_access set machine_fingerprint='legacy-home' where user_id=buyer;
  order_two:=(public.open_additional_grow_order(buyer,2)->>'id')::uuid;
  perform public.fulfill_grow_order(order_two,tx_two,'PAID',119900,'ILS','{}','unused');
  if exists(select 1 from public.paid_device_claims where user_id=buyer) then raise exception 'fixture already enrolled'; end if;
  perform public.support_reconcile_grow_reversal(order_one,tx_one,149900,'ILS','full_refund','legacy-case-'||buyer,true);
  if (select machine_fingerprint from public.user_access where user_id=buyer) is not null
    or public.resolve_paid_device('legacy-home',null,'check',null)<>'unbound'
    or public.resolve_paid_device('office',null,'claim',office_digest)<>'active' then raise exception 'legacy fingerprint rebound during refund'; end if;
end $$;
rollback;
