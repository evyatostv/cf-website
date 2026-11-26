begin;
create schema net;
create table net.test_requests(id bigint generated always as identity,body jsonb);
create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer)
returns bigint language sql as $$insert into net.test_requests(body) values($3) returning id$$;
insert into public.contact_wake_config(project_ref) values('aaaaaaaaaaaaaaaaaaaa');
do $$
declare
  payload jsonb; run_slot timestamptz; token uuid;
begin
  perform public.enqueue_delivery_retry(true);
  if public.enqueue_delivery_retry(false) is not null then raise exception 'second dispatch within slot'; end if;
  select body into strict payload from net.test_requests;
  run_slot:=(payload->>'slot')::timestamptz; token:=(payload->>'proof')::uuid;
  if public.redeem_delivery_retry(run_slot,gen_random_uuid()) is not null then raise exception 'wrong proof accepted'; end if;
  if public.redeem_delivery_retry(run_slot,token) is distinct from 'DRY_RUN' then raise exception 'lost dry mode'; end if;
  if public.redeem_delivery_retry(run_slot,token) is not null then raise exception 'replayed'; end if;
  delete from public.delivery_retry_runs;
  perform public.enqueue_delivery_retry(false);
  select body into strict payload from net.test_requests where id=2;
  token:=(payload->>'proof')::uuid;
  update public.delivery_retry_runs set expires_at=now()-interval '1 second';
  if public.redeem_delivery_retry(run_slot,token) is not null then raise exception 'expired proof accepted'; end if;
  if has_function_privilege('service_role','public.enqueue_delivery_retry(boolean)','execute') or
     has_function_privilege('authenticated','public.redeem_delivery_retry(timestamptz,uuid)','execute') or
     has_table_privilege('anon','public.delivery_retry_runs','select') then raise exception 'role boundary failed'; end if;
end $$;
rollback;
