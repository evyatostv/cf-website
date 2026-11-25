-- This mock stores a request in the disposable database; it never performs HTTP.
begin;
create schema net;
create table net.test_requests(id bigint generated always as identity,body jsonb);
create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer)
returns bigint language sql as $$insert into net.test_requests(body) values($3) returning id$$;
insert into public.contact_wake_config(project_ref) values('aaaaaaaaaaaaaaaaaaaa');
do $$
declare
  contact uuid:=gen_random_uuid();
  dry uuid:=gen_random_uuid();
  request jsonb;
  request_id bigint;
begin
  insert into public.contact_messages(id,name,email,message) values(contact,'test','person@example.invalid','private fixture');
  select body into strict request from net.test_requests;
  if (select count(*) from jsonb_object_keys(request))<>2 or request->>'contactId' is distinct from contact::text then raise exception 'unexpected request payload'; end if;
  if public.redeem_contact_wake(dry,(request->>'proof')::uuid) is not null then raise exception 'wrong row accepted'; end if;
  if public.redeem_contact_wake(contact,gen_random_uuid()) is not null then raise exception 'wrong proof accepted'; end if;
  if public.redeem_contact_wake(contact,(request->>'proof')::uuid) is distinct from 'DELIVER' then raise exception 'valid wake rejected'; end if;
  if public.redeem_contact_wake(contact,(request->>'proof')::uuid) is not null then raise exception 'used proof accepted'; end if;
  request_id:=public.enqueue_contact_wake(dry,true);
  select body into strict request from net.test_requests where id=request_id;
  if public.redeem_contact_wake(dry,(request->>'proof')::uuid) is distinct from 'DRY_RUN' then raise exception 'dry run mode lost'; end if;
  if has_function_privilege('authenticated','public.enqueue_contact_wake(uuid,boolean)','execute') or
    has_table_privilege('anon','public.contact_wake_proofs','select') then raise exception 'private credentials accessible'; end if;
end $$;
-- A broken transport cannot roll back a customer inquiry or its retry jobs.
drop function net.http_post(text,jsonb,jsonb,integer);
do $$
declare inquiry uuid:=gen_random_uuid();
begin
  insert into public.contact_messages(id,name,email,message) values(inquiry,'test','pending@example.invalid','test');
  if (select count(*) from public.contact_deliveries where contact_id=inquiry)<>2
    or exists(select 1 from public.contact_wake_proofs where contact_id=inquiry)
    then raise exception 'Transport failure lost work or retained unusable credentials'; end if;
end $$;
rollback;
