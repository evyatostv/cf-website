begin;
do $$
declare
  buyer uuid:='bbbbbbbb-1111-4000-a000-000000000001';
  direct uuid:='cccccccc-1111-4000-a000-000000000002';
  t bigint:=extract(epoch from now())::bigint;
begin
  insert into auth.users(id,email,created_at) values(buyer,'checkout@example.invalid',now()-interval '2 days'),(direct,'direct@example.invalid',now()-interval '2 days');
  insert into public.purchases(user_id,email,version,plan,amount,payment_id,purchased_at)
  values(buyer,'checkout@example.invalid','basic','basic',75900,'cs_live_Historical',now()-interval '1 day');
  if public.record_verified_stripe_order('pi_Historical','cs_live_Historical',buyer,'basic',75900,0,t,'paid')<>'DUPLICATE' then raise exception 'historic checkout alias not preserved'; end if;
  if (select count(*) from public.purchases where user_id=buyer)<>1 then raise exception 'duplicate session + PI sale'; end if;
  if public.record_verified_stripe_order('pi_Upgrade',null,buyer,'professional',61950,37950,t,'paid')<>'RECORDED' then raise exception 'historical half-credit upgrade failed'; end if;
  if public.record_verified_stripe_order('pi_Upgrade',null,buyer,'professional',61950,37950,t,'refunded')<>'HELD' then raise exception 'refund'; end if;
  if public.has_verified_desktop_purchase(buyer,'professional') or not public.has_verified_desktop_purchase(buyer,'basic') then raise exception 'wrong surviving tier'; end if;
  if public.record_verified_stripe_order('pi_Upgrade',null,buyer,'professional',61950,37950,t,'paid')<>'HELD' then raise exception 'stale payment reactivated'; end if;
  if public.record_verified_stripe_order('pi_Historical','cs_live_Historical',buyer,'basic',75900,0,t,'refunded')<>'HELD' then raise exception 'alias refund'; end if;
  if (select is_active from public.user_access where user_id=buyer) or public.has_verified_desktop_purchase(buyer,'basic') then raise exception 'historical cs seat remained active'; end if;
  if public.record_verified_stripe_order('pi_Short',null,direct,'full',100,0,t,'paid')<>'AMOUNT_MISMATCH' then raise exception 'short payment'; end if;
  if public.record_verified_stripe_order('pi_FakeCredit',null,direct,'full',40000,89900,t,'paid')<>'CREDIT_MISMATCH' then raise exception 'unearned credit'; end if;
  if public.record_verified_stripe_order('pi_Full',null,direct,'forever',149900,0,t,'paid')<>'RECORDED' then raise exception 'current forever failed'; end if;
  update public.user_access set is_active=false where user_id=direct;
  if public.record_verified_stripe_order('pi_Full',null,direct,'forever',149900,0,t,'paid')<>'DUPLICATE' then raise exception 'idempotency'; end if;
  if (select is_active from public.user_access where user_id=direct) then raise exception 'duplicate revived stopped access'; end if;
  if public.record_verified_stripe_order('pi_ReverseFirst',null,direct,'forever',149900,0,t,'refunded')<>'HELD' then raise exception 'early reversal'; end if;
  if public.record_verified_stripe_order('pi_ReverseFirst',null,direct,'forever',149900,0,t,'paid')<>'HELD' then raise exception 'late capture'; end if;
  if has_function_privilege('authenticated','public.record_verified_stripe_order(text,text,uuid,text,integer,integer,bigint,text)','execute') then raise exception 'client may settle'; end if;
end $$;
rollback;
