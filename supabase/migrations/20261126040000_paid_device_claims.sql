begin;

alter table public.user_access add column if not exists machine_fingerprint text;
create table public.paid_device_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_id text not null,
  fingerprint text not null,
  check_digest bytea unique,
  primary key (user_id, payment_id),
  unique (user_id, fingerprint)
);
alter table public.paid_device_claims enable row level security;
revoke all on public.paid_device_claims from public, anon, authenticated;

-- One positive receipt buys one seat. A Grow refund invalidates only that
-- receipt. Older processors recorded verified receipts without a Grow order.
create function public.resolve_paid_device(p_fingerprint text, p_legacy text, p_action text, p_check_digest text)
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

  select array(select public.account_paid_seat_receipts(owner_id, access_row.plan::text)) into receipts;
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
revoke all on function public.resolve_paid_device(text,text,text,text) from public, anon;
grant execute on function public.resolve_paid_device(text,text,text,text) to authenticated;
-- Possession of a random per-installation token can only check that one seat.
create function public.check_paid_device(p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.paid_device_claims c
    join public.user_access a on a.user_id = c.user_id
    where length(p_token) = 64 and c.check_digest = sha256(convert_to(p_token, 'UTF8'))
      and a.is_active and (a.expires_at is null or a.expires_at > now())
      and c.payment_id in (select public.account_paid_seat_receipts(c.user_id, a.plan::text))
  );
$$;
revoke all on function public.check_paid_device(text) from public;
grant execute on function public.check_paid_device(text) to anon, authenticated;
commit;
