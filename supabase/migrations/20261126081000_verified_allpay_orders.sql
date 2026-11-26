-- Single-use settlement evidence. Full user identifiers and email remain in the
-- existing financial tables and their established account-archive lifecycle.
create table public.allpay_settlements (
  order_ref text primary key,
  charged integer,
  state text not null check (state in ('paid','refunded','partial_review')),
  recorded_at timestamptz not null default now()
);
alter table public.allpay_settlements enable row level security;
revoke all on public.allpay_settlements from public,anon,authenticated,service_role;

create or replace function public.legacy_seat_receipt(p_customer_id uuid, p_plan text)
returns setof text language sql stable security definer set search_path = '' as $$
  select p.payment_id from public.purchases p
  where p.user_id=p_customer_id and p.plan=p.version
    and p.version in ('basic','professional','full','premium') and p.amount>0
    and nullif(trim(p.payment_id),'') is not null
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

create function public.record_verified_allpay_order(p_order text,p_user uuid,p_charged integer,p_state integer)
returns text language plpgsql security definer set search_path='' as $$
declare
  ref text[] := regexp_match(p_order,'^cf_([0-9a-f]{8})_(basic|professional|full|forever)_([0-9]{13})$');
  created timestamptz;
  account_email text;
  same_prefix integer;
  list_price integer;
  credit integer;
  target_plan text;
  prior public.user_access%rowtype;
  received public.purchases%rowtype;
  settlement public.allpay_settlements%rowtype;
  surviving_plan text;
begin
  if ref is null or p_user is null or ref[1]<>left(p_user::text,8) or p_state is null
     or p_state not in (1,3,4) then return 'INVALID'; end if;
  created:=to_timestamp(ref[3]::bigint/1000.0);
  if created>now()+interval '5 minutes' then return 'INVALID'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  perform pg_advisory_xact_lock(hashtextextended(p_order,1));
  select * into settlement from public.allpay_settlements where order_ref=p_order for update;
  if p_state in (3,4) then
    insert into public.allpay_settlements(order_ref,charged,state) values
      (p_order,p_charged,case when p_state=3 then 'refunded' else 'partial_review' end)
    on conflict(order_ref) do update set state=case when public.allpay_settlements.state='refunded' then 'refunded' else excluded.state end;
    if p_state=3 and exists(select 1 from public.purchases where payment_id=p_order and user_id=p_user) then
      select * into prior from public.user_access where user_id=p_user for update;
      if prior.is_active and not public.has_verified_desktop_purchase(p_user,prior.plan::text) then
        -- A fully refunded upgrade may leave an older, genuinely paid tier.
        select candidate into surviving_plan from unnest(array['premium','full','professional','basic']) candidate
        where exists(select 1 from public.legacy_seat_receipt(p_user,candidate)) limit 1;
        update public.user_access set is_active=(surviving_plan is not null),
          plan=coalesce(surviving_plan::public.plan_tier,plan)
        where user_id=p_user;
      end if;
    end if;
    return 'HELD';
  end if;
  if settlement.state in ('refunded','partial_review') then return 'HELD'; end if;
  if settlement.state='paid' then
    if settlement.charged is distinct from p_charged then return 'CONFLICT'; end if;
    return 'DUPLICATE';
  end if;
  select email into account_email from auth.users where id=p_user and created_at<=created and
    (banned_until is null or banned_until<=now()) for update;
  if account_email is null then return 'UNKNOWN_ACCOUNT'; end if;
  select count(*) into same_prefix from auth.users where id::text like ref[1]||'%' and created_at<=created;
  if same_prefix<>1 then return 'AMBIGUOUS_ACCOUNT'; end if;
  target_plan:=case ref[2] when 'forever' then 'full' else ref[2] end;
  list_price:=case ref[2] when 'basic' then 89900 when 'professional' then 99900 when 'full' then 129900 when 'forever' then 149900 end;
  select * into received from public.purchases where payment_id=p_order;
  if found then
    if received.user_id is distinct from p_user or received.plan::text is distinct from target_plan then return 'CONFLICT'; end if;
    -- Historical receipts may already be refunded/disabled. Never write their
    -- entitlement again, even if this is the first delivery since cutover.
    return 'DUPLICATE';
  end if;
  if p_charged is null or p_charged<=0 or p_charged>list_price then return 'AMOUNT_MISMATCH'; end if;
  select * into prior from public.user_access where user_id=p_user for update;
  if prior.plan::text in ('basic','professional','full','premium') and
    (not prior.is_active or (prior.expires_at is not null and prior.expires_at<=now()) or prior.granted_at>created) then
    return 'ACCESS_REVIEW';
  end if;
  if (prior.plan::text='premium' or (prior.plan::text='full' and target_plan<>'full')
      or (prior.plan::text='professional' and target_plan='basic')) then return 'ACCESS_REVIEW'; end if;
  if p_charged<>list_price then
    select p.amount into credit from public.purchases p
    where p.user_id=p_user and p.purchased_at<=created and p.plan::text=prior.plan::text and
      p.payment_id in (select public.legacy_seat_receipt(p_user,prior.plan::text)) and
      p.amount=case p.plan::text when 'basic' then 89900 when 'professional' then 99900 when 'full' then 129900 end
      and not exists(select 1 from public.allpay_settlements s where s.order_ref=p.payment_id and s.state in ('refunded','partial_review'))
    order by p.purchased_at desc limit 1;
    if credit is null or list_price-credit<>p_charged then return 'AMOUNT_MISMATCH'; end if;
  end if;
  -- Inserting the receipt runs on_purchase_sync_access in this transaction.
  -- List value preserves historical upgrade credit. Charged records cash paid.
  insert into public.allpay_settlements(order_ref,charged,state) values(p_order,p_charged,'paid');
  insert into public.purchases(user_id,email,version,plan,amount,payment_id,discount_eligible,purchased_at)
  values(p_user,account_email,target_plan,target_plan::public.plan_tier,list_price,p_order,false,now());
  return 'RECORDED';
end;
$$;
revoke all on function public.record_verified_allpay_order(text,uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.record_verified_allpay_order(text,uuid,integer,integer) to service_role;
