-- Disposable database only. No provider calls.
begin;
do $$
declare
  reconciled text;
  buyer uuid:=gen_random_uuid();
  first_order uuid;
  second_order uuid;
  capture_a text:=gen_random_uuid()::text;
  capture_b text:=gen_random_uuid()::text;
  refund_ref text:=gen_random_uuid()::text;
  dispute_ref text:=gen_random_uuid()::text;
  token_a text:=repeat('a',64);
  token_b text:=repeat('b',64);
begin
  insert into auth.users(id,email) values(buyer,'support@example.invalid');
  perform set_config('request.jwt.claim.sub',buyer::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',buyer)::text,true);
  first_order:=(public.open_grow_order(buyer,'forever',149900)->>'id')::uuid;
  perform public.fulfill_grow_order(first_order,capture_a,'PAID',149900,'ILS','{}',buyer::text);
  perform public.resolve_paid_device('home',null,'claim',encode(sha256(convert_to(token_a,'UTF8')),'hex'));
  second_order:=(public.open_additional_grow_order(buyer,2)->>'id')::uuid;
  perform public.fulfill_grow_order(second_order,capture_b,'PAID',149900,'ILS','{}',buyer::text);
  perform public.resolve_paid_device('office',null,'claim',encode(sha256(convert_to(token_b,'UTF8')),'hex'));

  if public.support_reconcile_grow_reversal(first_order,capture_a,1,'ILS','full_refund',refund_ref,true)->>'result'<>'MISMATCH'
    or public.support_reconcile_grow_reversal(first_order,capture_b,149900,'ILS','full_refund',refund_ref,true)->>'result'<>'MISMATCH'
    or public.support_reconcile_grow_reversal(first_order,capture_a,149900,'ILS','dispute_open',dispute_ref,true)->>'result'<>'INVALID'
    then raise exception 'Unverified reversal accepted'; end if;
  if public.support_reconcile_grow_reversal(first_order,capture_a,149900,'ILS','lost_chargeback',dispute_ref)->>'result'<>'READY'
    or not public.check_paid_device(token_a) or exists(select 1 from public.grow_support_reversals where order_id=first_order)
    then raise exception 'Preview mutated access'; end if;
  reconciled := public.support_reconcile_grow_reversal(first_order,capture_a,149900,'ILS','lost_chargeback',dispute_ref,true)->>'result';
  if reconciled<>'RECORDED'
    or public.check_paid_device(token_a) or not public.check_paid_device(token_b)
    or (select status from public.orders where id=first_order)<>'CHARGED_BACK' then raise exception 'Wrong chargeback seat'; end if;
  if public.fulfill_grow_order(first_order,capture_a,'PAID',149900,'ILS','{}','unused')<>'CONFLICT'
    or public.support_reconcile_grow_reversal(first_order,capture_a,149900,'ILS','lost_chargeback',dispute_ref,true)->>'result'<>'ALREADY_RECORDED'
    or public.support_reconcile_grow_reversal(second_order,capture_b,149900,'ILS','full_refund',dispute_ref,true)->>'result'<>'CONFLICT'
    then raise exception 'Duplicate or reused reference'; end if;
  reconciled := public.support_reconcile_grow_reversal(second_order,capture_b,149900,'ILS','full_refund',refund_ref,true)->>'result';
  if reconciled<>'RECORDED'
    or public.check_paid_device(token_b) or public.has_verified_desktop_purchase(buyer,'full') then raise exception 'Final refund'; end if;
  if has_function_privilege('anon','public.support_reconcile_grow_reversal(uuid,text,integer,text,text,text,boolean)','EXECUTE')
    or has_function_privilege('authenticated','public.support_reconcile_grow_reversal(uuid,text,integer,text,text,text,boolean)','EXECUTE')
    or has_function_privilege('service_role','public.support_reconcile_grow_reversal(uuid,text,integer,text,text,text,boolean)','EXECUTE')
    then raise exception 'Operator tool exposed via public API'; end if;
end;
$$;
rollback;
