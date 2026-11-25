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
  if extra->>'result' <> 'NEW' or (extra->>'amount')::int <> 149900 then raise exception 'Wrong price'; end if;
  if public.open_additional_grow_order(buyer,2)->>'id' <> extra->>'id' then raise exception 'Duplicate checkout'; end if;
  if public.grow_paid_seat_count(buyer) <> 1 then raise exception 'Pending order granted seat'; end if;
  perform public.fulfill_grow_order((extra->>'id')::uuid,second_tx,'PAID',149900,'ILS','{}','unused');
  perform public.fulfill_grow_order((extra->>'id')::uuid,second_tx,'PAID',149900,'ILS','{}','unused');
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
  perform public.record_grow_refund((extra->>'id')::uuid,second_tx,149900,'ILS');
  if public.has_verified_desktop_purchase(buyer,'full') then raise exception 'All refunded retained download'; end if;
end;
$$;
rollback;
