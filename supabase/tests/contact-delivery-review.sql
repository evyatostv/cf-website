begin;
do $$
declare
  inquiry uuid:=gen_random_uuid();
  result jsonb;
begin
  insert into public.contact_messages(id,name,email,message,source) values(inquiry,'Synthetic','synthetic@example.invalid','fixture','test');
  update public.contact_deliveries set first_attempt=now()-interval '25 hours',retry_after=now()-interval '1 hour' where contact_id=inquiry;
  result:=public.contact_email_review_counts();
  if result<>jsonb_build_object('internal',1,'reply',1) then raise exception 'missing review counts'; end if;
  if (select count(*) from public.claim_contact_deliveries(inquiry,true) where channel='sheet')<>1 then raise exception 'old sheet excluded'; end if;
  if (select count(*) from public.claim_contact_deliveries(inquiry,true))<>0 then raise exception 'old mail automatically claimed'; end if;
  if public.review_contact_email(inquiry,'reply','accepted','provider-case')<>'READY' or
    not exists(select 1 from public.contact_deliveries where contact_id=inquiry and channel='reply' and completed_at is null)
    then raise exception 'preview changed state'; end if;
  if public.review_contact_email(inquiry,'reply','accepted','provider-case',true)<>'RECORDED'
    or public.review_contact_email(inquiry,'reply','accepted','provider-case',true)<>'ALREADY_RECORDED'
    or public.review_contact_email(inquiry,'reply','not_accepted','provider-case',true)<>'CONFLICT' then raise exception 'evidence reuse'; end if;
  update public.contact_deliveries set retry_after=now()+interval '5 minutes' where contact_id=inquiry and channel='internal';
  if public.review_contact_email(inquiry,'internal','not_accepted','failed-case',true)<>'NOT_ELIGIBLE' then raise exception 'overrode live lease'; end if;
  update public.contact_deliveries set retry_after=now()-interval '1 hour' where contact_id=inquiry and channel='internal';
  if public.review_contact_email(inquiry,'internal','not_accepted','failed-case',true)<>'RECORDED'
    or (select count(*) from public.claim_contact_deliveries(inquiry,false) where channel='internal')<>1 then raise exception 'confirmed unsent recovery'; end if;
  if public.contact_email_review_counts()<>jsonb_build_object('internal',0,'reply',0) then raise exception 'stale review count'; end if;
  if has_function_privilege('authenticated','public.contact_email_review_counts()','execute')
    or has_function_privilege('service_role','public.review_contact_email(uuid,text,text,text,boolean)','execute') then raise exception 'permissions'; end if;
  delete from public.contact_messages where id=inquiry;
  if exists(select 1 from public.contact_delivery_reviews where contact_id=inquiry) then raise exception 'review not erased'; end if;
end $$;
rollback;
