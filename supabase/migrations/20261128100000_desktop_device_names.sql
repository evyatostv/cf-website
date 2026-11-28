begin;

alter table public.paid_device_claims add column device_name text
  check (char_length(device_name) between 1 and 48 and device_name !~ '[[:cntrl:]]');

-- A name describes the installation, not the reusable seat.
create or replace function public.rotate_desktop_assignment() returns trigger
language plpgsql set search_path='' as $$
begin
  new.assignment_id := gen_random_uuid();
  new.device_name := null;
  return new;
end $$;

-- Extend the list response while preserving its signature and original columns.
drop function public.desktop_active_devices(text);
create function public.desktop_active_devices(p_customer_email text default null)
returns table(device_id uuid, seat_number integer, device_code text, device_name text)
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
      case when length(c.fingerprint)>12 then left(c.fingerprint,4)||'…'||right(c.fingerprint,4) else c.fingerprint end, c.device_name
    from unnest(receipts) with ordinality r(receipt,n)
    join public.paid_device_claims c on c.user_id=customer and c.payment_id=r.receipt
    order by r.n;
end $$;
revoke all on function public.desktop_active_devices(text) from public, anon, authenticated;
grant execute on function public.desktop_active_devices(text) to authenticated;

create function public.desktop_set_device_name(p_device_id uuid, p_name text)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  customer uuid := public.desktop_management_customer(null);
  access_row public.user_access%rowtype;
  name_value text := nullif(btrim(p_name),'');
begin
  if char_length(name_value)>48 or name_value ~ '[[:cntrl:]]' then
    raise exception 'Invalid device name' using errcode='22023';
  end if;
  select * into access_row from public.user_access where user_id=customer for update;
  if not found or access_row.is_active is not true or access_row.expires_at<=now() then return false; end if;
  update public.paid_device_claims set device_name=name_value
    where user_id=customer and assignment_id=p_device_id
      and payment_id in (select public.desktop_entitlement_receipts(customer,access_row.plan::text));
  return found;
end $$;
revoke all on function public.desktop_set_device_name(uuid,text) from public, anon, authenticated;
grant execute on function public.desktop_set_device_name(uuid,text) to authenticated;

commit;
