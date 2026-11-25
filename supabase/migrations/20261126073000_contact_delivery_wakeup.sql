-- The pg_net HTTP request is discarded on transaction rollback and starts
-- after commit. Installation is opt-in: local databases have no destination.
create table public.contact_wake_config (
  singleton boolean primary key default true check(singleton),
  project_ref text not null check(project_ref ~ '^[a-z0-9]{20}$')
);
create table public.contact_wake_proofs (
  contact_id uuid primary key, digest bytea not null,
  dry_run boolean not null, expires_at timestamptz not null
);
create index contact_wake_proofs_expiry on public.contact_wake_proofs(expires_at);
alter table public.contact_wake_config enable row level security;
alter table public.contact_wake_proofs enable row level security;
revoke all on public.contact_wake_config,public.contact_wake_proofs from public,anon,authenticated,service_role;

create function public.enqueue_contact_wake(p_contact uuid,p_dry_run boolean default false)
returns bigint language plpgsql security definer set search_path='' as $$
declare
  project text;
  proof text;
  request_id bigint;
begin
  select project_ref into project from public.contact_wake_config where singleton;
  if project is null then return null; end if;
  if not p_dry_run and not exists(select 1 from public.contact_deliveries where contact_id=p_contact and completed_at is null) then return null; end if;
  proof:=gen_random_uuid()::text;
  delete from public.contact_wake_proofs where expires_at<=now();
  insert into public.contact_wake_proofs values(p_contact,sha256(convert_to(proof,'UTF8')),p_dry_run,now()+interval '3 minutes')
    on conflict(contact_id) do update set digest=excluded.digest,dry_run=excluded.dry_run,expires_at=excluded.expires_at;
  select net.http_post(
    url:='https://'||project||'.supabase.co/functions/v1/notify-contact',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:=jsonb_build_object('contactId',p_contact,'proof',proof),timeout_milliseconds:=60000
  ) into request_id;
  return request_id;
end;
$$;
revoke all on function public.enqueue_contact_wake(uuid,boolean) from public,anon,authenticated,service_role;

create function public.redeem_contact_wake(p_contact uuid,p_proof uuid)
returns text language sql security definer set search_path='' as $$
  delete from public.contact_wake_proofs where contact_id=p_contact and expires_at>now()
    and digest=sha256(convert_to(p_proof::text,'UTF8'))
  returning case when dry_run then 'DRY_RUN' else 'DELIVER' end
$$;
revoke all on function public.redeem_contact_wake(uuid,uuid) from public,anon,authenticated;
grant execute on function public.redeem_contact_wake(uuid,uuid) to service_role;

create function public.wake_new_contact() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  begin
    perform public.enqueue_contact_wake(new.id);
  exception when others then
    -- The contact and durable deliveries still commit even if pg_net has failed.
    raise warning 'Contact delivery wake-up unavailable [%]',sqlstate;
  end;
  return new;
end;
$$;
-- PostgreSQL runs same-kind triggers alphabetically. Queue before waking.
create trigger wake_stored_contact after insert on public.contact_messages
for each row execute function public.wake_new_contact();
revoke all on function public.wake_new_contact() from public,anon,authenticated,service_role;
