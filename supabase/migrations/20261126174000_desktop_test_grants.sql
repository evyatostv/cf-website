-- Complimentary device access is recorded separately from orders and payments.
create table public.desktop_test_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id uuid not null unique default gen_random_uuid(),
  quantity integer not null check (quantity between 1 and 2),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null check (expires_at > granted_at)
);
alter table public.desktop_test_grants enable row level security;
revoke all on public.desktop_test_grants from public, anon, authenticated, service_role;
grant select on public.desktop_test_grants to service_role;

create function public.desktop_entitlement_receipts(p_customer_id uuid,p_plan text)
returns setof text language sql stable set search_path='' as $$
  select receipt from (
    select receipt,0 as priority,position
      from public.account_paid_seat_receipts(p_customer_id,p_plan) with ordinality as paid(receipt,position)
    union all
    select 'desktop-test:'||g.id::text||':'||n,1,n
      from public.desktop_test_grants g cross join lateral generate_series(1,g.quantity) n
      where g.user_id=p_customer_id and g.expires_at>now() and p_plan='full'
  ) seats order by priority,position
$$;
revoke all on function public.desktop_entitlement_receipts(uuid,text) from public, anon, authenticated;
grant execute on function public.desktop_entitlement_receipts(uuid,text) to service_role;

create function public.has_desktop_entitlement(p_customer_id uuid,p_plan text)
returns boolean language sql stable set search_path='' as $$
  select exists(select 1 from public.desktop_entitlement_receipts(p_customer_id,p_plan))
$$;
revoke all on function public.has_desktop_entitlement(uuid,text) from public, anon, authenticated;
grant execute on function public.has_desktop_entitlement(uuid,text) to service_role;

-- This authenticated wrapper controls the desktop download controls on the site.
-- Financial eligibility continues using has_verified_desktop_purchase.
create or replace function public.my_verified_desktop_purchase(p_plan text)
returns boolean language sql stable security definer set search_path='' as $$
  select public.has_desktop_entitlement(auth.uid(),p_plan)
$$;

create or replace function public.resolve_paid_device(p_fingerprint text, p_legacy text, p_action text, p_check_digest text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  access_row public.user_access%rowtype;
  receipts text[];
  previous text;
  free_receipt text;
begin
  if owner_id is null or p_action is null or p_action not in ('claim','check','transfer','release')
     or p_fingerprint is null or length(p_fingerprint) not between 1 and 128
     or length(p_legacy) > 128 or (p_action <> 'check' and p_check_digest is null)
     or (p_check_digest is not null and p_check_digest !~ '^[a-f0-9]{64}$') then return 'invalid'; end if;
  -- The row lock serializes concurrent claims from multiple installations.
  select * into strict access_row from public.user_access where user_id = owner_id for update;
  if access_row.is_active is not true or access_row.plan::text not in ('full','forever','professional','basic','premium')
     or access_row.expires_at <= now() then return 'no_access'; end if;

  select array(select public.desktop_entitlement_receipts(owner_id, access_row.plan::text)) into receipts;
  if coalesce(cardinality(receipts), 0) = 0 then return 'no_access'; end if;

  -- Preserve an already activated legacy installation before allocating
  -- capacity to a new PC. Only the dedicated transfer operation may replace it.
  previous := nullif(access_row.machine_fingerprint, '');
  if previous is not null and not exists (select 1 from public.paid_device_claims where user_id = owner_id) then
    insert into public.paid_device_claims (user_id, payment_id, fingerprint) values (owner_id, receipts[1], previous);
  end if;
  if p_action = 'release' then
    delete from public.paid_device_claims
      where user_id = owner_id and fingerprint = p_fingerprint and check_digest = decode(p_check_digest, 'hex');
    if exists (select 1 from public.paid_device_claims where user_id = owner_id and fingerprint = p_fingerprint) then
      return 'unbound';
    end if;
    if previous = p_fingerprint then
      update public.user_access set machine_fingerprint = null where user_id = owner_id;
    end if;
    return 'released';
  end if;
  if exists (select 1 from public.paid_device_claims where user_id = owner_id and payment_id = any(receipts) and fingerprint = p_fingerprint) then
    if p_check_digest is not null then
      update public.paid_device_claims set check_digest = decode(p_check_digest, 'hex') where user_id = owner_id and fingerprint = p_fingerprint;
    end if;
    return 'active';
  end if;
  if p_legacy is not null and p_legacy = previous and exists (
    select 1 from public.paid_device_claims where user_id = owner_id and payment_id = any(receipts) and fingerprint = p_legacy
  ) then
    delete from public.paid_device_claims where user_id = owner_id and fingerprint = p_fingerprint and not (payment_id = any(receipts));
    update public.paid_device_claims set fingerprint = p_fingerprint,
      check_digest = coalesce(decode(p_check_digest, 'hex'), check_digest)
      where user_id = owner_id and fingerprint = p_legacy;
    update public.user_access set machine_fingerprint = p_fingerprint where user_id = owner_id;
    return 'active';
  end if;
  if p_action = 'check' then return 'unbound'; end if;
  -- A revoked seat cannot prevent this machine from claiming a new purchase.
  delete from public.paid_device_claims where user_id = owner_id and fingerprint = p_fingerprint and not (payment_id = any(receipts));
  select r into free_receipt from unnest(receipts) r where not exists (
    select 1 from public.paid_device_claims c where c.user_id = owner_id and c.payment_id = r
  ) limit 1;
  if free_receipt is not null then
    insert into public.paid_device_claims values (owner_id, free_receipt, p_fingerprint, decode(p_check_digest, 'hex'));
  elsif cardinality(receipts) = 1 and p_action = 'transfer' then
    update public.paid_device_claims set fingerprint = p_fingerprint, check_digest = decode(p_check_digest, 'hex') where user_id = owner_id and payment_id = receipts[1];
  else
    return case when cardinality(receipts) = 1 then 'bound_elsewhere' else 'capacity' end;
  end if;
  if free_receipt = receipts[1] or (cardinality(receipts) = 1 and p_action = 'transfer') then
    update public.user_access set machine_fingerprint = p_fingerprint where user_id = owner_id;
  end if;
  return 'active';
exception when no_data_found or too_many_rows then return 'no_access';
end;
$$;

create or replace function public.check_paid_device(p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.paid_device_claims c
    join public.user_access a on a.user_id = c.user_id
    where length(p_token) = 64 and c.check_digest = sha256(convert_to(p_token, 'UTF8'))
      and a.is_active and (a.expires_at is null or a.expires_at > now())
      and c.payment_id in (select public.desktop_entitlement_receipts(c.user_id, a.plan::text))
  );
$$;
