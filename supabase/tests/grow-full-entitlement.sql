-- Run against a disposable database with migrations applied.
begin;
do $$
declare
  buyer uuid := gen_random_uuid();
  checkout jsonb;
  result text;
begin
  insert into auth.users(id,email) values(buyer, buyer::text || '@example.test');
  insert into public.user_access(user_id,email,plan,is_active)
  values(buyer, buyer::text || '@example.test','full',true)
  on conflict (user_id) do update set plan='full', is_active=true;
  insert into public.purchases(user_id,email,version,plan,amount)
  values(buyer,buyer::text || '@example.test','legacy','full',0);

  checkout := public.open_grow_order(buyer,'forever',149900);
  if checkout->>'result' is distinct from 'NEW' then raise exception 'Unpaid customer cannot buy'; end if;
  result := public.fulfill_grow_order((checkout->>'id')::uuid,buyer::text,'PAID',149900,'ILS','{}','CF-' || buyer::text);
  if result is distinct from 'PAID' then raise exception 'Fulfillment failed'; end if;
  if not exists (
    select 1 from public.purchases p join public.user_access a on a.user_id=p.user_id and a.plan::text=p.plan
    where p.user_id=buyer and p.plan='full' and p.version='forever' and p.amount=149900
      and p.payment_id=buyer::text and a.is_active and a.expires_at is null and a.license_key is not null
  ) then raise exception 'Paid receipt and download entitlement do not match'; end if;
  if public.fulfill_grow_order((checkout->>'id')::uuid,buyer::text,'PAID',149900,'ILS','{}','unused') <> 'DUPLICATE'
    or (select count(*) from public.purchases where user_id=buyer) <> 2 then
    raise exception 'Receipt history or callback idempotency failed';
  end if;
  if public.open_grow_order(buyer,'forever',149900)->>'result' <> 'ACTIVE_LICENSE' then
    raise exception 'Verified owner charged again';
  end if;
end;
$$;
rollback;
