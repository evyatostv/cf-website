-- Local synthetic auth fixture. Exercise the same PostgREST roles, RLS, and signed-claim fields.
begin;
insert into auth.users(id,email) values
('00000000-0000-4000-a000-000000000001','first@example.invalid'),
('00000000-0000-4000-a000-000000000002','second@example.invalid');
insert into auth.sessions(id,user_id,created_at,updated_at) values
('00000000-0000-4000-b000-000000000001','00000000-0000-4000-a000-000000000001',now(),now());
set local role authenticated;
do $$
declare
  own_id uuid:='00000000-0000-4000-a000-000000000001';
  other_id uuid:='00000000-0000-4000-a000-000000000002';
  session_id uuid:='00000000-0000-4000-b000-000000000001';
  claims jsonb;
  method text;
  epoch bigint:=floor(extract(epoch from now()));
begin
  claims:=jsonb_build_object('sub',own_id,'role','authenticated','session_id',session_id);
  perform set_config('request.jwt.claim.sub',own_id::text,true);
  foreach method in array array['token_refresh','missing','stale_password','wrong_session','password','oauth'] loop
    perform set_config('request.jwt.claims',(claims||jsonb_build_object(
      'session_id',case when method='wrong_session' then gen_random_uuid() else session_id end,
      'amr',case when method='missing' then '[]'::jsonb else jsonb_build_array(jsonb_build_object(
        'method',case when method in ('stale_password','wrong_session') then 'password' else method end,
        'timestamp',case when method='stale_password' then epoch-600 else epoch end)) end))::text,true);
    if method in ('password','oauth') then
      begin
        insert into public.deletion_requests(user_id,user_email,scheduled_for) values(other_id,'spoof',now());
        raise exception 'cross-account request accepted';
      exception when insufficient_privilege then null; end;
      insert into public.deletion_requests(user_id,user_email,scheduled_for) values(own_id,'spoof',now());
      if not exists(select 1 from public.deletion_requests where user_email='first@example.invalid' and scheduled_for>=now()+interval '7 days') then raise exception 'grace or owner mismatch'; end if;
      perform set_config('request.jwt.claims',claims::text,true);
      update public.deletion_requests set status='canceled' where user_id=own_id and status='pending';
      if not found then raise exception 'cancel failed'; end if;
    else
      begin
        insert into public.deletion_requests(user_id,user_email,scheduled_for) values(own_id,'spoof',now());
        raise exception 'fresh verification missing for %',method;
      exception when insufficient_privilege then null; end;
    end if;
  end loop;
  begin
    perform public.archive_due_account(gen_random_uuid());
    raise exception 'authenticated role could invoke archival';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
select public.archive_due_account(gen_random_uuid());
rollback;
