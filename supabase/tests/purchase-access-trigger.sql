-- Disposable database only. A real signup can trigger an outbound webhook.
begin;
do $$
declare
  buyer uuid := gen_random_uuid();
  checkout jsonb;
begin
  if not exists (select 1 from pg_trigger where tgrelid='public.purchases'::regclass
    and tgname='on_purchase_sync_access' and tgenabled='O') then
    raise exception 'Production purchase access trigger is required';
  end if;
  insert into auth.users(id,email) values(buyer,buyer::text || '@example.test');
  update public.user_access set plan='none',is_active=false where user_id=buyer;
  insert into public.purchases(user_id,email,plan,version,amount)
  values (buyer,buyer::text || '@example.test','full','legacy',0);
  if exists(select 1 from public.user_access where user_id=buyer and is_active) then
    raise exception 'Unpaid receipt granted access';
  end if;
  checkout := public.open_grow_order(buyer,'forever',149900);
  if public.fulfill_grow_order((checkout->>'id')::uuid, buyer::text,'PAID',149899,'ILS','{}','unused') <> 'MANUAL_REVIEW' then
    raise exception 'Mismatched amount';
  end if;
  if exists(select 1 from public.user_access where user_id=buyer and is_active) then
    raise exception 'Payment mismatch activated account';
  end if;
  -- Historical payment providers write the plan as both plan and version.
  insert into public.purchases(user_id,email,plan,version,amount,payment_id)
  values(buyer,buyer::text || '@example.test','professional','professional',99900,buyer::text);
  if not exists(select 1 from public.user_access where user_id=buyer and plan='professional' and is_active) then
    raise exception 'Verified legacy receipt failed';
  end if;
end;
$$;
rollback;
