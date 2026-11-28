begin;

-- One activation has one opaque ID. A transfer invalidates any pending
-- confirmation for the previous installation, even on the same paid seat.
alter table public.paid_device_claims add column assignment_id uuid not null default gen_random_uuid();
alter table public.paid_device_claims add constraint paid_device_claims_assignment_key unique (assignment_id);
create function public.rotate_desktop_assignment() returns trigger
language plpgsql set search_path='' as $$
begin
  new.assignment_id := gen_random_uuid();
  return new;
end $$;
revoke all on function public.rotate_desktop_assignment() from public, anon, authenticated;
create trigger rotate_desktop_assignment before update of fingerprint on public.paid_device_claims
  for each row when (new.fingerprint is distinct from old.fingerprint)
  execute function public.rotate_desktop_assignment();

-- Bind support privileges to an existing verified account. Re-registering a
-- deleted account with the same email does not inherit the support role.
create table public.desktop_support_operators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.desktop_support_operators enable row level security;
revoke all on public.desktop_support_operators from public, anon, authenticated, service_role;
insert into public.desktop_support_operators(user_id)
select id from auth.users where lower(email)='evyatar.druyan@gmail.com' and email_confirmed_at is not null;

create table public.desktop_disconnect_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  customer_id uuid not null,
  actor_id uuid not null,
  assignment_id uuid not null,
  support_reason text
);
alter table public.desktop_disconnect_events enable row level security;
revoke all on public.desktop_disconnect_events from public, anon, authenticated, service_role;
grant select on public.desktop_disconnect_events to service_role;

create function public.desktop_has_live_session() returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from auth.users u join auth.sessions s on s.user_id=u.id
    where u.id=auth.uid() and s.id::text=auth.jwt()->>'session_id'
      and (s.not_after is null or s.not_after>now())
      and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<now())
  )
$$;
revoke all on function public.desktop_has_live_session() from public, anon, authenticated;

create function public.is_desktop_support() returns boolean
language sql stable security definer set search_path='' as $$
  select public.desktop_has_live_session() and exists (
    select 1 from public.desktop_support_operators where user_id=auth.uid()
  )
$$;
revoke all on function public.is_desktop_support() from public, anon, authenticated;
grant execute on function public.is_desktop_support() to authenticated;

create function public.desktop_management_customer(p_customer_email text) returns uuid
language plpgsql stable security definer set search_path='' as $$
declare customer uuid;
begin
  if not public.desktop_has_live_session() then raise insufficient_privilege; end if;
  if p_customer_email is null then return auth.uid(); end if;
  if not public.is_desktop_support() then raise insufficient_privilege; end if;
  select id into strict customer from auth.users where lower(email)=lower(trim(p_customer_email));
  return customer;
end $$;
revoke all on function public.desktop_management_customer(text) from public, anon, authenticated;

create function public.desktop_active_devices(p_customer_email text default null)
returns table(device_id uuid, seat_number integer, device_code text)
language plpgsql security definer set search_path='' as $$
declare
  customer uuid := public.desktop_management_customer(p_customer_email);
  access_row public.user_access%rowtype;
  receipts text[];
begin
  select * into access_row from public.user_access where user_id=customer for update;
  if not found or access_row.is_active is not true or access_row.expires_at<=now() then return; end if;
  receipts := array(select public.desktop_entitlement_receipts(customer,access_row.plan::text));
  -- Adopt older single-device installations under the same lock and rules
  -- as resolve_paid_device, so support can release them while the PC is offline.
  if receipts[1] is not null and nullif(access_row.machine_fingerprint,'') is not null
      and not exists(select 1 from public.paid_device_claims where user_id=customer) then
    insert into public.paid_device_claims(user_id,payment_id,fingerprint)
      values(customer,receipts[1],access_row.machine_fingerprint);
  end if;
  return query
    select c.assignment_id,r.n::integer,
      case when length(c.fingerprint)>12 then left(c.fingerprint,4)||'…'||right(c.fingerprint,4) else c.fingerprint end
    from unnest(receipts) with ordinality r(receipt,n)
    join public.paid_device_claims c on c.user_id=customer and c.payment_id=r.receipt
    order by r.n;
end $$;
revoke all on function public.desktop_active_devices(text) from public, anon, authenticated;
grant execute on function public.desktop_active_devices(text) to authenticated;

create function public.desktop_disconnect_device(
  p_device_id uuid, p_customer_email text default null, p_reason text default null
) returns boolean language plpgsql security definer set search_path='' as $$
declare
  customer uuid := public.desktop_management_customer(p_customer_email);
  access_row public.user_access%rowtype;
  removed text;
  reason text := nullif(trim(p_reason),'');
begin
  if customer<>auth.uid() and (reason is null or length(reason) not between 3 and 500) then
    raise exception 'A support reason is required' using errcode='22023';
  end if;
  select * into access_row from public.user_access where user_id=customer for update;
  if not found or access_row.is_active is not true or access_row.expires_at<=now() then return false; end if;
  delete from public.paid_device_claims
    where user_id=customer and assignment_id=p_device_id
      and payment_id in (select public.desktop_entitlement_receipts(customer,access_row.plan::text))
    returning fingerprint into removed;
  if not found then return false; end if;
  if access_row.machine_fingerprint=removed
     or not exists(select 1 from public.paid_device_claims where user_id=customer) then
    update public.user_access set machine_fingerprint=null where user_id=customer;
  end if;
  insert into public.desktop_disconnect_events(customer_id,actor_id,assignment_id,support_reason)
    values(customer,auth.uid(),p_device_id,case when customer<>auth.uid() then reason end);
  return true;
end $$;
revoke all on function public.desktop_disconnect_device(uuid,text,text) from public, anon, authenticated;
grant execute on function public.desktop_disconnect_device(uuid,text,text) to authenticated;

commit;
