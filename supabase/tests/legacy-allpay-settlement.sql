begin;
do $$
declare
  buyer uuid:='a1111111-1000-4000-a000-000000000001';
  same_prefix uuid:='a1111111-2000-4000-a000-000000000002';
  other_id uuid:='b2222222-2000-4000-a000-000000000003';
  created timestamptz:=now()-interval '1 minute';
  basic text:='cf_a1111111_basic_'||(extract(epoch from created)*1000)::bigint;
  upgrade text:='cf_a1111111_professional_'||(extract(epoch from now())*1000+1000)::bigint;
  held text:='cf_b2222222_full_'||(extract(epoch from created)*1000)::bigint;
begin
  insert into auth.users(id,email,created_at) values(buyer,'buyer@example.invalid',now()-interval '1 day'),(other_id,'other@example.invalid',now()-interval '1 day');
  if public.record_verified_allpay_order(basic,other_id,89900,1)<>'INVALID' then raise exception 'foreign UID'; end if;
  if public.record_verified_allpay_order(basic,buyer,100,1)<>'AMOUNT_MISMATCH' then raise exception 'short payment'; end if;
  insert into auth.users(id,email,created_at) values(same_prefix,'same@example.invalid',now()-interval '1 day');
  if public.record_verified_allpay_order(basic,buyer,89900,1)<>'AMBIGUOUS_ACCOUNT' then raise exception 'prefix collision'; end if;
  delete from auth.users where id=same_prefix;
  if public.record_verified_allpay_order(basic,buyer,89900,1)<>'RECORDED' then raise exception 'full price'; end if;
  if public.record_verified_allpay_order(upgrade,buyer,10000,1)<>'RECORDED' then raise exception 'legitimate upgrade'; end if;
  if (select plan::text from public.user_access where user_id=buyer)<>'professional' then raise exception 'missing upgrade'; end if;
  if public.record_verified_allpay_order(upgrade,buyer,10000,3)<>'HELD' then raise exception 'refund'; end if;
  if public.has_verified_desktop_purchase(buyer,'professional') or not public.has_verified_desktop_purchase(buyer,'basic') or
     (select plan::text from public.user_access where user_id=buyer)<>'basic' then raise exception 'upgrade refund did not preserve only older seat'; end if;
  if public.record_verified_allpay_order(upgrade,buyer,10000,1)<>'HELD' then raise exception 'stale upgrade callback revived receipt'; end if;
  if public.record_verified_allpay_order(basic,buyer,89900,4)<>'HELD' or not public.has_verified_desktop_purchase(buyer,'basic') then raise exception 'partial review changed existing seat'; end if;
  if public.record_verified_allpay_order(basic,buyer,89900,3)<>'HELD' then raise exception 'final refund'; end if;
  if public.has_verified_desktop_purchase(buyer,'basic') or
     (select is_active from public.user_access where user_id=buyer) then raise exception 'fully refunded final seat remained active'; end if;
  update public.user_access set is_active=false where user_id=buyer;
  if public.record_verified_allpay_order(upgrade,buyer,10000,1)<>'HELD' or
     (select is_active from public.user_access where user_id=buyer) then raise exception 'repeat revived access'; end if;
  if public.record_verified_allpay_order(held,other_id,null,3)<>'HELD' or
     public.record_verified_allpay_order(held,other_id,129900,1)<>'HELD' then raise exception 'refunded first'; end if;
  if exists(select 1 from public.purchases where user_id=other_id) then raise exception 'reversed order granted'; end if;
  if has_function_privilege('authenticated','public.record_verified_allpay_order(text,uuid,integer,integer)','execute') then raise exception 'client authorization'; end if;
end $$;
rollback;
