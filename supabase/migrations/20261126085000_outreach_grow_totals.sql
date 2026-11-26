-- All-time Grow checkout totals for the outreach dashboard; no customer identifiers.
create function public.outreach_grow_totals()
returns table (settled bigint, settled_agorot bigint, pending bigint, in_review bigint, reversed bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_active_outreach_admin() then
    raise exception 'Outreach administrator required' using errcode='42501';
  end if;
  return query
  select count(*) filter (where o.status='PAID'),
         coalesce(sum(o.amount) filter (where o.status='PAID'),0),
         count(*) filter (where o.status='PENDING'),
         count(*) filter (where o.status='MANUAL_REVIEW'),
         count(*) filter (where o.status in ('REFUNDED','CHARGED_BACK'))
  from public.orders o where o.payment_provider='grow_make' and o.currency='ILS';
end;
$$;
revoke all on function public.outreach_grow_totals() from public,anon;
grant execute on function public.outreach_grow_totals() to authenticated;
