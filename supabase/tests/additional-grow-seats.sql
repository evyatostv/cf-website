-- Run after all Grow migrations on a disposable database.
begin;
do $$
declare
  buyer uuid := gen_random_uuid();
  initial_order jsonb;
  extra jsonb;
  first_tx text := gen_random_uuid()::text;
  second_tx text := gen_random_uuid()::text;
begin
  insert into auth.users(id,email) values(buyer,buyer::text || '@example.test');
  if public.open_additional_grow_order(buyer,2)->>'result' <> 'SEATS_CHANGED' then raise exception 'No license'; end if;
  initial_order := public.open_grow_order(buyer,'forever',149900);
  perform public.fulfill_grow_order((initial_order->>'id')::uuid, first_tx,'PAID',149900,'ILS','{}','CF-' || buyer::text);
  if public.grow_paid_seat_count(buyer) <> 1 then raise exception 'First seat'; end if;
  if public.open_additional_grow_order(buyer,3)->>'result' <> 'SEATS_CHANGED' then raise exception 'Out of sequence'; end if;
  extra := public.open_additional_grow_order(buyer,2);
  if extra->>'result' <> 'NEW' or (extra->>'amount')::int <> 119900 then raise exception 'Wrong price'; end if;
  if public.open_additional_grow_order(buyer,2)->>'id' <> extra->>'id' then raise exception 'Duplicate checkout'; end if;
  if public.grow_paid_seat_count(buyer) <> 1 then raise exception 'Pending order granted seat'; end if;
  perform public.fulfill_grow_order((extra->>'id')::uuid,second_tx,'PAID',119900,'ILS','{}','unused');
  perform public.fulfill_grow_order((extra->>'id')::uuid,second_tx,'PAID',119900,'ILS','{}','unused');
  if public.grow_paid_seat_count(buyer) <> 2 then raise exception 'Second seat'; end if;
  if public.open_additional_grow_order(buyer,2)->>'result' <> 'SEATS_CHANGED' then raise exception 'Stale checkout'; end if;
  if public.open_additional_grow_order(buyer,3)->>'result' <> 'NEW' then raise exception 'Third seat'; end if;
  if public.record_grow_refund((initial_order->>'id')::uuid,first_tx,1,'ILS') <> 'CONFLICT' then raise exception 'Partial refund'; end if;
  if public.record_grow_refund((initial_order->>'id')::uuid,second_tx,149900,'ILS') <> 'CONFLICT' then raise exception 'Wrong transaction'; end if;
  if public.record_grow_refund((initial_order->>'id')::uuid,first_tx,149900,'ILS') <> 'REFUNDED' then raise exception 'Full refund'; end if;
  if public.record_grow_refund((initial_order->>'id')::uuid,first_tx,149900,'ILS') <> 'DUPLICATE' then raise exception 'Refund replay'; end if;
  if (select array_agg(t) from public.grow_paid_seat_receipts(buyer) t) <> array[second_tx] then
    raise exception 'Refund should revoke only its own seat';
  end if;
  if public.open_additional_grow_order(buyer,2)->>'result' <> 'MANUAL_REVIEW' then raise exception 'Incompatible pending order'; end if;
  if not public.has_verified_desktop_purchase(buyer,'full') then raise exception 'Active seat lost download'; end if;
  perform public.record_grow_refund((extra->>'id')::uuid,second_tx,119900,'ILS');
  if public.has_verified_desktop_purchase(buyer,'full') then raise exception 'All refunded retained download'; end if;
  if exists(select 1 from public.user_access where user_id=buyer and is_active) then raise exception 'Fully refunded active access'; end if;
end;
$$;

do $$
declare
  buyer uuid := gen_random_uuid();
  extra jsonb;
  legacy_tx text := gen_random_uuid()::text;
  grow_tx text := gen_random_uuid()::text;
  original_expiry timestamptz := now()+interval '2 months';
begin
  insert into auth.users(id,email) values(buyer,buyer::text || '@example.test');
  insert into public.purchases(user_id,email,version,plan,amount,payment_id)
  values(buyer,buyer::text || '@example.test','professional','professional',99900,legacy_tx);
  update public.user_access set expires_at=original_expiry where user_id=buyer;
  if (select count(*) from public.account_paid_seat_receipts(buyer,'professional'))<>1 then raise exception 'Legacy seat missing'; end if;
  extra:=public.open_additional_grow_order(buyer,2);
  if extra->>'result' is distinct from 'NEW' then raise exception 'Legacy additional purchase'; end if;
  perform public.fulfill_grow_order((extra->>'id')::uuid,grow_tx,'PAID',119900,'ILS','{}','CF-' || buyer::text);
  if (select count(*) from public.account_paid_seat_receipts(buyer,'full'))<>2 then raise exception 'Mixed seat count'; end if;
  perform public.record_grow_refund((extra->>'id')::uuid,grow_tx,119900,'ILS');
  if not exists(select 1 from public.user_access where user_id=buyer and is_active and plan='professional' and expires_at=original_expiry)
    then raise exception 'Original legacy license not restored'; end if;
end;
$$;
rollback;
