begin;
-- Test customers, claims, support authorization and audit events are rolled back.
insert into auth.users(id,email,email_confirmed_at) values
('00000000-0000-4000-9000-000000000011','desk-owner@example.invalid',now()),
('00000000-0000-4000-9000-000000000012','desk-other@example.invalid',now()),
('00000000-0000-4000-9000-000000000013','desk-support@example.invalid',now());
insert into public.desktop_support_operators values('00000000-0000-4000-9000-000000000013');
insert into auth.sessions(id,user_id) select id,id from auth.users where email like 'desk-%@example.invalid';
insert into public.desktop_test_grants(user_id,quantity,expires_at) values
('00000000-0000-4000-9000-000000000011',2,now()+interval '1 day'),
('00000000-0000-4000-9000-000000000012',1,now()+interval '1 day');
insert into public.user_access(user_id,email,plan,is_active,expires_at)
select id,email,'full',true,now()+interval '1 day' from auth.users where email like 'desk-%@example.invalid'
on conflict(user_id) do update set plan='full',is_active=true,expires_at=excluded.expires_at;
update public.user_access set machine_fingerprint='old-legacy-computer' where user_id='00000000-0000-4000-9000-000000000012';
create function pg_temp.ident(i text,aal text default 'aal1') returns void language plpgsql as $$
declare u text:='00000000-0000-4000-9000-0000000000'||i;
begin
  perform set_config('request.jwt.claim.sub',u,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'session_id',u,'aal',aal)::text,true);
end $$;
set local role authenticated;
do $$
declare
  a text := encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex');
  b text := encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex');
  c text := encode(sha256(convert_to(repeat('c',64),'UTF8')),'hex');
  home uuid; office uuid; replacement uuid; legacy uuid;
begin
  if has_function_privilege('anon','public.desktop_active_devices(text)','execute')
    or has_function_privilege('anon','public.desktop_disconnect_device(uuid,text,text)','execute')
    or has_table_privilege('authenticated','public.desktop_support_operators','insert')
    or has_table_privilege('authenticated','public.desktop_disconnect_events','select') then raise exception 'role grants'; end if;
  perform pg_temp.ident('11');
  if public.resolve_paid_device('0011-home-machine-4455',null,'claim',a)<>'active'
     or public.resolve_paid_device('0022-office-machine-6677',null,'claim',b)<>'active' then raise exception 'preparing two devices'; end if;
  if public.resolve_paid_device('new-pc',null,'claim',c)<>'capacity' then raise exception 'capacity not enforced'; end if;
  select device_id into strict home from public.desktop_active_devices() where seat_number=1 and device_code='0011…4455';
  select device_id into strict office from public.desktop_active_devices() where seat_number=2 and device_code='0022…6677';
  perform pg_temp.ident('12');
  if public.desktop_disconnect_device(home) then raise exception 'cross-tenant revoked'; end if;
  begin
    perform public.desktop_active_devices('desk-owner@example.invalid'); raise exception 'ordinary lookup allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.desktop_disconnect_device(home,'desk-owner@example.invalid','broken machine'); raise exception 'ordinary support revoke allowed';
  exception when insufficient_privilege then null; end;
  select device_id into strict legacy from public.desktop_active_devices() where device_code='old-…uter';
  if not public.desktop_disconnect_device(legacy) or exists(select 1 from public.desktop_active_devices()) then raise exception 'legacy revived'; end if;
  perform pg_temp.ident('13');
  if not public.is_desktop_support() then raise exception 'registered support denied'; end if;
  if not exists(select 1 from public.desktop_active_devices('  DESK-OWNER@example.invalid ') where device_id=home) then raise exception 'support lookup failed'; end if;
  begin
    perform public.desktop_disconnect_device(home,'desk-owner@example.invalid',' '); raise exception 'missing reason allowed';
  exception when invalid_parameter_value then null; end;
  if not public.desktop_disconnect_device(home,'desk-owner@example.invalid','customer replaced broken home computer') then raise exception 'support revoke failed'; end if;
  perform pg_temp.ident('11');
  if public.check_paid_device(repeat('a',64)) or not public.check_paid_device(repeat('b',64)) then raise exception 'incorrect device token revoked'; end if;
  if public.resolve_paid_device('new-pc',null,'claim',c)<>'active' then raise exception 'replacement denied'; end if;
  select device_id into strict replacement from public.desktop_active_devices() where seat_number=1;
  if public.desktop_disconnect_device(home) or replacement=home then raise exception 'stale UI released new device'; end if;
  if not exists(select 1 from public.desktop_active_devices() where device_id=office and seat_number=2)
     or not public.check_paid_device(repeat('b',64)) or not public.check_paid_device(repeat('c',64))
     or public.resolve_paid_device('fourth-pc',null,'claim',a)<>'capacity' then raise exception 'spare or missing device'; end if;
  if not public.desktop_disconnect_device(replacement) then raise exception 'owner release failed'; end if;
  if public.check_paid_device(repeat('c',64)) then raise exception 'owner release left token active'; end if;
  -- A normal within-row platform migration invalidates an older confirmation.
  perform pg_temp.ident('12');
  if public.resolve_paid_device('pc-before',null,'claim',a)<>'active' then raise exception 'legacy replacement claim failed'; end if;
  select device_id into strict legacy from public.desktop_active_devices();
  if public.resolve_paid_device('pc-after',null,'transfer',c)<>'active' or public.desktop_disconnect_device(legacy) then raise exception 'transfer stale confirmation'; end if;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.desktop_disconnect_events where support_reason='customer replaced broken home computer' and actor_id='00000000-0000-4000-9000-000000000013' and customer_id='00000000-0000-4000-9000-000000000011')<>1 then raise exception 'support audit missing'; end if;
end $$;
insert into auth.mfa_factors(user_id,status) select user_id,'verified' from public.desktop_support_operators where user_id='00000000-0000-4000-9000-000000000013';
set local role authenticated;
do $$ begin
  perform pg_temp.ident('13');
  if public.is_desktop_support() then raise exception 'MFA bypass'; end if;
  begin
    perform public.desktop_active_devices(); raise exception 'owner MFA bypass';
  exception when insufficient_privilege then null; end;
  perform pg_temp.ident('13','aal2');
  if not public.is_desktop_support() then raise exception 'MFA-verified support denied'; end if;
end $$;
reset role;
delete from auth.sessions where user_id='00000000-0000-4000-9000-000000000013';
set local role authenticated;
do $$ begin
  if public.is_desktop_support() then raise exception 'stale support session'; end if;
  begin
    perform public.desktop_active_devices('desk-owner@example.invalid'); raise exception 'revoked session read';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
