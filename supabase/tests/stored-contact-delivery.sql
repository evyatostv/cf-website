begin;
do $$
declare
  inquiry uuid := gen_random_uuid();
  constraint_hit text;
  lease uuid;
  job record;
begin
  insert into public.contact_messages(id,name,email,message,source)
    values (inquiry,'Test','synthetic@example.invalid','Synthetic inquiry','website');
  -- A retry following an ambiguous response must hit exactly the row identity
  -- recognized by the client without firing the delivery triggers again.
  begin
    insert into public.contact_messages(id,name,email,message,source)
      values (inquiry,'Test','synthetic@example.invalid','Synthetic inquiry','website');
    raise exception 'Repeated contact id inserted twice';
  exception when unique_violation then
    get stacked diagnostics constraint_hit = constraint_name;
    if constraint_hit <> 'contact_messages_pkey' then raise exception 'Unexpected duplicate constraint'; end if;
  end;
  select count(*) into strict job from public.contact_deliveries where contact_id=inquiry;
  if job.count<>3 then raise exception 'Missing durable delivery'; end if;
  if (select count(*) from public.claim_contact_deliveries(gen_random_uuid(),true))<>0 then raise exception 'Unknown row claimed'; end if;
  if (select count(*) from public.claim_contact_deliveries(inquiry,false))<>2 then raise exception 'Email channels unavailable'; end if;
  if (select count(*) from public.claim_contact_deliveries(inquiry,false))<>0 then raise exception 'Lease duplicated'; end if;
  update public.contact_deliveries set completed_at=now() where contact_id=inquiry and channel='internal';
  update public.contact_deliveries set retry_after=now()-interval '1 second' where contact_id=inquiry and channel='reply';
  select lease_id into strict lease from public.claim_contact_deliveries(inquiry,false);
  update public.contact_deliveries set first_attempt=now()-interval '24 hours',retry_after=now() where lease_id=lease;
  if (select count(*) from public.claim_contact_deliveries(inquiry,false))<>0 then raise exception 'Expired uncertain send retried'; end if;
  if (select count(*) from public.claim_contact_deliveries(inquiry,true))<>1 then raise exception 'Sheet channel unavailable'; end if;
  if has_function_privilege('anon','public.claim_contact_deliveries(uuid,boolean)','execute')
     or has_function_privilege('authenticated','public.claim_contact_deliveries(uuid,boolean)','execute')
     or has_table_privilege('authenticated','public.contact_deliveries','update') then raise exception 'Queue visible to browser'; end if;
  delete from public.contact_messages where id=inquiry;
  if exists(select 1 from public.contact_deliveries where contact_id=inquiry) then raise exception 'Delivery retained after erasure'; end if;
end $$;
rollback;
