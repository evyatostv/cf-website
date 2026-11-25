begin;
do $$
declare
  buyer uuid := gen_random_uuid();
  order_a jsonb;
  order_b jsonb;
  tx_a text := gen_random_uuid()::text;
  tx_b text := gen_random_uuid()::text;
  token_a text := repeat('a',64);
  token_b text := repeat('b',64);
  token_c text := repeat('c',64);
  digest_a text := encode(sha256(convert_to(token_a,'UTF8')),'hex');
  digest_b text := encode(sha256(convert_to(token_b,'UTF8')),'hex');
begin
  insert into auth.users(id,email) values(buyer, buyer::text || '@example.invalid');
  perform set_config('request.jwt.claim.sub', buyer::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', buyer)::text, true);
  if public.resolve_paid_device('home',null,'claim',digest_a) <> 'no_access' then raise exception 'unpaid'; end if;
  order_a := public.open_grow_order(buyer,'forever',149900);
  perform public.fulfill_grow_order((order_a->>'id')::uuid, tx_a,'PAID',149900,'ILS','{}','CF-'||buyer::text);
  update public.user_access set machine_fingerprint='legacy-home' where user_id=buyer;
  if public.resolve_paid_device('office',null,'claim',digest_b) <> 'bound_elsewhere' then raise exception 'legacy seat displaced'; end if;
  if public.resolve_paid_device('home','legacy-home','check',digest_a) <> 'active' then raise exception 'legacy migration'; end if;
  order_b := public.open_additional_grow_order(buyer,2);
  perform public.fulfill_grow_order((order_b->>'id')::uuid, tx_b,'PAID',149900,'ILS','{}','unused');
  if public.resolve_paid_device('office',null,'claim',digest_b) <> 'active' then raise exception 'second purchase'; end if;
  if public.resolve_paid_device('office',null,'claim',digest_b) <> 'active' then raise exception 'repeat claim'; end if;
  if public.resolve_paid_device('third',null,'transfer',digest_b) <> 'capacity' then raise exception 'unselected transfer'; end if;
  if not public.check_paid_device(token_a) or not public.check_paid_device(token_b) then raise exception 'both PCs active'; end if;
  perform public.record_grow_refund((order_a->>'id')::uuid,tx_a,149900,'ILS');
  if public.check_paid_device(token_a) or not public.check_paid_device(token_b) then raise exception 'wrong PC refunded'; end if;
  if public.resolve_paid_device('home',null,'check',null) <> 'unbound' then raise exception 'refunded device'; end if;
  if public.resolve_paid_device('new-office',null,'transfer',encode(sha256(convert_to(token_c,'UTF8')),'hex')) <> 'active' then raise exception 'transfer single remaining seat'; end if;
  if public.check_paid_device(token_b) or public.check_paid_device(token_a) or not public.check_paid_device(token_c) then raise exception 'transferred token'; end if;
  if public.resolve_paid_device('new-office',null,'release',encode(sha256(convert_to(token_c,'UTF8')),'hex')) <> 'released' then raise exception 'release own installation'; end if;
  if public.check_paid_device(token_c) then raise exception 'released token'; end if;
  if public.resolve_paid_device('replacement',null,'claim',digest_b) <> 'active' then raise exception 'reuse released seat'; end if;
  if has_function_privilege('anon','public.resolve_paid_device(text,text,text,text)','execute')
     or has_table_privilege('authenticated','public.paid_device_claims','insert') then raise exception 'role permissions'; end if;
end;
$$;
rollback;
