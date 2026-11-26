create function public.my_desktop_license_summary()
returns jsonb language sql stable security definer set search_path='' as $$
  with access as (
    select user_id,plan,machine_fingerprint from public.user_access
    where user_id=auth.uid() and is_active and (expires_at is null or expires_at>now())
  ), seats as (
    select a.user_id,r.receipt,c.fingerprint
      from access a
      cross join lateral public.desktop_entitlement_receipts(a.user_id,a.plan::text) r(receipt)
      left join public.paid_device_claims c on c.user_id=a.user_id and c.payment_id=r.receipt
  )
  select jsonb_build_object(
    'total',count(*),
    'activated',case
      when count(*)>0 and count(fingerprint)=0 and exists(
        select 1 from access a where nullif(a.machine_fingerprint,'') is not null
          and not exists(select 1 from public.paid_device_claims c where c.user_id=a.user_id)
      ) then 1 else count(fingerprint) end,
    'test',count(*) filter(where receipt like 'desktop-test:%'),
    'testExpiresAt',(select g.expires_at from access a join public.desktop_test_grants g using(user_id)
      where a.plan::text='full' and g.expires_at>now() limit 1)
  ) from seats
$$;
revoke all on function public.my_desktop_license_summary() from public, anon;
grant execute on function public.my_desktop_license_summary() to authenticated;
