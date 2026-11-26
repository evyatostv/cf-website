create table public.stripe_settlements (
  intent_ref text primary key,
  session_ref text unique,
  charged integer not null,
  state text not null check(state in ('paid','refunded','review')),
  recorded_at timestamptz not null default now()
);
alter table public.stripe_settlements enable row level security;
revoke all on public.stripe_settlements from public,anon,authenticated,service_role;

create or replace function public.legacy_seat_receipt(p_customer_id uuid, p_plan text)
returns setof text language sql stable security definer set search_path = '' as $$
  select p.payment_id from public.purchases p
  where p.user_id=p_customer_id and p.plan=p.version
    and p.version in ('basic','professional','full','premium') and p.amount>0
    and nullif(trim(p.payment_id),'') is not null
    and not exists (select 1 from public.stripe_settlements s where s.state='refunded' and (s.intent_ref=p.payment_id or s.session_ref=p.payment_id))
    and not exists (select 1 from public.allpay_settlements s where s.order_ref=p.payment_id and s.state='refunded')
    and not exists (select 1 from public.orders o where o.external_transaction_id=p.payment_id)
    and not exists (select 1 from public.orders o where o.customer_id=p_customer_id and o.prior_legacy_receipt=p.payment_id
      and o.status in ('PAID','REFUNDED','CHARGED_BACK') and o.prior_legacy_expires_at<=now())
    and (p.plan=p_plan or exists (
      select 1 from public.orders o where o.customer_id=p_customer_id and o.prior_legacy_receipt=p.payment_id
        and o.status in ('PAID','REFUNDED','CHARGED_BACK') and p_plan='full'
        and (o.prior_legacy_expires_at is null or o.prior_legacy_expires_at>now())
    ))
  order by p.purchased_at nulls last,p.payment_id limit 1
$$;

create function public.record_verified_stripe_order(p_intent text,p_session text,p_user uuid,p_plan text,
  p_charged integer,p_credit integer,p_created bigint,p_state text)
returns text language plpgsql security definer set search_path='' as $$
declare
  created timestamptz;
  buyer_email text;
  list_price integer;
  target_plan text;
  prior public.user_access%rowtype;
  mark public.stripe_settlements%rowtype;
  survivor text;
begin
  if p_intent is null or p_intent!~'^pi_[A-Za-z0-9]+$'
    or (p_session is not null and p_session!~'^cs_live_[A-Za-z0-9]+$')
    or p_user is null or p_plan is null or p_plan not in ('basic','professional','full','forever')
    or p_state is null or p_state not in ('paid','refunded','review')
    or p_charged is null or p_charged not between 1 and 1000000 or p_credit is null or p_credit not between 0 and 1000000
    or p_created is null or p_created not between 1 and extract(epoch from now()+interval '5 minutes') then return 'INVALID'; end if;
  target_plan:=case p_plan when 'forever' then 'full' else p_plan end;
  created:=to_timestamp(p_created);
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  perform pg_advisory_xact_lock(hashtextextended(p_intent,1));
  select * into mark from public.stripe_settlements where intent_ref=p_intent for update;
  if mark.charged is not null and (mark.charged<>p_charged or (mark.session_ref is not null and mark.session_ref is distinct from p_session)) then return 'CONFLICT'; end if;
  if exists(select 1 from public.stripe_settlements where session_ref=p_session and intent_ref<>p_intent) then return 'CONFLICT'; end if;
  if exists(select 1 from public.purchases where payment_id in (p_intent,p_session) and
    (user_id is distinct from p_user or plan::text is distinct from target_plan)) then return 'CONFLICT'; end if;
  if p_state in ('refunded','review') then
    insert into public.stripe_settlements(intent_ref,session_ref,charged,state) values(p_intent,p_session,p_charged,p_state)
    on conflict(intent_ref) do update set session_ref=coalesce(excluded.session_ref,public.stripe_settlements.session_ref),
      state=case when public.stripe_settlements.state='refunded' then 'refunded' else excluded.state end;
    if p_state='refunded' and exists(select 1 from public.purchases where user_id=p_user and payment_id in (p_intent,p_session)) then
      select * into prior from public.user_access where user_id=p_user for update;
      if prior.is_active and not public.has_verified_desktop_purchase(p_user,prior.plan::text) then
        select tier into survivor from unnest(array['premium','full','professional','basic']) tier
        where exists(select 1 from public.legacy_seat_receipt(p_user,tier)) limit 1;
        update public.user_access set is_active=(survivor is not null),plan=coalesce(survivor::public.plan_tier,plan) where user_id=p_user;
      end if;
    end if;
    return 'HELD';
  end if;
  if mark.state in ('refunded','review') then return 'HELD'; end if;
  if mark.state='paid' then return 'DUPLICATE'; end if;
  if exists(select 1 from public.purchases where payment_id in (p_intent,p_session)) then
    insert into public.stripe_settlements(intent_ref,session_ref,charged,state) values(p_intent,p_session,p_charged,'paid');
    return 'DUPLICATE';
  end if;
  select email into buyer_email from auth.users where id=p_user and created_at<created+interval '1 second'
    and (banned_until is null or banned_until<=now()) for update;
  if buyer_email is null then return 'UNKNOWN_ACCOUNT'; end if;
  list_price:=p_charged+p_credit;
  -- These are the full prices minted by the historical server checkout versions.
  if not ((p_plan='basic' and list_price in (345000,75900,89900))
       or (p_plan='professional' and list_price in (459000,99900))
       or (p_plan='full' and list_price in (589000,129900))
       or (p_plan='forever' and list_price=149900)) then return 'AMOUNT_MISMATCH'; end if;
  select * into prior from public.user_access where user_id=p_user for update;
  if prior.plan::text in ('basic','professional','full','premium') and
     (not prior.is_active or prior.expires_at<=now() or prior.granted_at>=created+interval '1 second'
       or prior.plan::text='premium' or (prior.plan::text='full' and target_plan<>'full')
       or (prior.plan::text='professional' and target_plan='basic')) then return 'ACCESS_REVIEW'; end if;
  if p_credit>0 and (target_plan=prior.plan::text and p_plan<>'forever') then return 'CREDIT_MISMATCH'; end if;
  if p_credit>0 and not exists(
    select 1 from public.purchases p where p.user_id=p_user and p.plan::text=prior.plan::text
    and p.purchased_at<created+interval '1 second' and p.payment_id in (select public.legacy_seat_receipt(p_user,prior.plan::text))
    and p_credit in (p.amount, p.amount/2)
    and ((p.plan::text='basic' and p.amount in (345000,75900,89900)) or
      (p.plan::text='professional' and p.amount in (459000,99900)) or
      (p.plan::text='full' and p.amount in (589000,129900)))
    and not exists(select 1 from public.stripe_settlements s where s.state='review' and p.payment_id in (s.intent_ref,s.session_ref))
    and not exists(select 1 from public.allpay_settlements s where s.state='partial_review' and s.order_ref=p.payment_id)
  ) then return 'CREDIT_MISMATCH'; end if;
  insert into public.stripe_settlements(intent_ref,session_ref,charged,state) values(p_intent,p_session,p_charged,'paid');
  insert into public.purchases(user_id,email,version,plan,amount,payment_id,discount_eligible,purchased_at)
  values(p_user,buyer_email,target_plan,target_plan::public.plan_tier,list_price,p_intent,false,now());
  return 'RECORDED';
end;
$$;
revoke all on function public.record_verified_stripe_order(text,text,uuid,text,integer,integer,bigint,text) from public,anon,authenticated;
grant execute on function public.record_verified_stripe_order(text,text,uuid,text,integer,integer,bigint,text) to service_role;
