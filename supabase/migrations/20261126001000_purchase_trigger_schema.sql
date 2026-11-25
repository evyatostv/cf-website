-- Fulfillment RPCs intentionally use an empty search_path. Trigger execution
-- must resolve the same table and enum regardless of its caller.
create or replace function public.sync_user_access_on_purchase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is null or coalesce(new.amount, 0) <= 0
    or nullif(trim(new.payment_id), '') is null then
    return new;
  end if;

  insert into public.user_access (user_id, email, plan, is_active)
  values (new.user_id, new.email, new.plan::public.plan_tier, true)
  on conflict (user_id) do update
    set plan = excluded.plan,
        is_active = true,
        expires_at = null,
        granted_at = now();
  return new;
end;
$$;
