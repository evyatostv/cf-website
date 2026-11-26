-- Run only against disposable local data.
begin;
insert into auth.users(id,email,email_confirmed_at) values
('00000000-0000-4000-9000-000000000001','evyatar.druyan@gmail.com',now()),
('00000000-0000-4000-9000-000000000002','ordinary@example.invalid',now());
insert into auth.sessions(id,user_id,created_at,updated_at) values
('00000000-0000-4000-a000-000000000001','00000000-0000-4000-9000-000000000001',now(),now());
insert into public.contact_messages(name,email,message) values ('Synthetic','synthetic-inquiry@example.invalid','fixture');
insert into public.orders(customer_id,package_id,amount,status,payment_provider)
select '00000000-0000-4000-9000-000000000002','forever',amount,status,provider
from (values (149900,'PAID','grow_make'),(75000,'PAID','grow_make'),
             (149900,'REFUNDED','grow_make'),(149900,'PENDING','grow_make'),
             (149900,'MANUAL_REVIEW','grow_make'),(149900,'PAID','other')) f(amount,status,provider);
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-9000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000001","email":"evyatar.druyan@gmail.com","session_id":"00000000-0000-4000-a000-000000000001"}',true);
do $$ begin
  if not exists(select 1 from public.contact_messages where email='synthetic-inquiry@example.invalid') then raise exception 'live admin cannot review fixture'; end if;
  if not exists(select 1 from public.outreach_grow_totals()
                where settled=2 and settled_agorot=224900 and pending=1 and reversed=1 and in_review=1) then
    raise exception 'Grow totals failed to reflect verified order states and stored amounts';
  end if;
  if not public.is_active_outreach_admin() then raise exception 'current admin rejected'; end if;
end $$;
reset role;
delete from auth.sessions where id='00000000-0000-4000-a000-000000000001';
set local role authenticated;
do $$ begin
  if exists(select 1 from public.contact_messages where email='synthetic-inquiry@example.invalid') then raise exception 'stale session read fixture'; end if;
  begin
    perform public.outreach_grow_totals();
    raise exception 'Ended session read Grow metrics';
  exception when insufficient_privilege then null;
  end;
  if public.is_active_outreach_admin() then raise exception 'ended session still has outreach access'; end if;
end $$;
reset role;
insert into auth.sessions(id,user_id,created_at,updated_at) values
('00000000-0000-4000-a000-000000000002','00000000-0000-4000-9000-000000000002',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-9000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000002","role":"authenticated","email":"ordinary@example.invalid","session_id":"00000000-0000-4000-a000-000000000002"}',true);
do $$ begin
  if exists(select 1 from public.contact_messages where email='synthetic-inquiry@example.invalid') then raise exception 'ordinary user read fixture'; end if;
end $$;
rollback;
