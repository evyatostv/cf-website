-- Installing this migration does not schedule jobs or send messages.
create table public.delivery_retry_runs (
  slot timestamptz primary key,
  digest bytea,
  dry_run boolean not null,
  expires_at timestamptz not null default now()+interval '3 minutes',
  redeemed_at timestamptz,
  request_id bigint
);
alter table public.delivery_retry_runs enable row level security;
revoke all on public.delivery_retry_runs from public,anon,authenticated,service_role;

create function public.enqueue_delivery_retry(p_dry_run boolean) returns bigint
language plpgsql security definer set search_path='' as $$
declare
  project text;
  run_slot timestamptz := date_bin(interval '10 minutes',now(),timestamptz '2000-01-01 00:00Z');
  proof uuid := gen_random_uuid();
  request bigint;
begin
  select project_ref into strict project from public.contact_wake_config where singleton;
  delete from public.delivery_retry_runs where slot < now()-interval '7 days';
  insert into public.delivery_retry_runs(slot,digest,dry_run)
  values (run_slot,sha256(convert_to(proof::text,'UTF8')),p_dry_run)
  on conflict(slot) do nothing;
  if not found then return null; end if;
  select net.http_post(
    url:='https://'||project||'.supabase.co/functions/v1/retry-deliveries',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:=jsonb_build_object('slot',run_slot,'proof',proof),timeout_milliseconds:=120000
  ) into request;
  update public.delivery_retry_runs set request_id=request where slot=run_slot;
  return request;
end;
$$;
revoke all on function public.enqueue_delivery_retry(boolean) from public,anon,authenticated,service_role;

create function public.redeem_delivery_retry(p_slot timestamptz,p_proof uuid) returns text
language sql security definer set search_path='' as $$
  update public.delivery_retry_runs set digest=null,redeemed_at=now()
  where slot=p_slot and expires_at>now() and digest=sha256(convert_to(p_proof::text,'UTF8'))
  returning case when dry_run then 'DRY_RUN' else 'DELIVER' end
$$;
revoke all on function public.redeem_delivery_retry(timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.redeem_delivery_retry(timestamptz,uuid) to service_role;
