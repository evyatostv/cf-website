begin;
do $$
declare
  buyer uuid:=gen_random_uuid();
  first_order uuid;
  next_order uuid;
  binding text:=repeat('a',64);
begin
  insert into auth.users(id,email) values(buyer,'binding@example.invalid');
  first_order:=(public.open_grow_order(buyer,'forever',149900)->>'id')::uuid;
  update public.orders set grow_link_digest=binding where id=first_order;
  perform public.fulfill_grow_order(first_order,'binding-test','PAID',149900,'ILS','{}','binding-key');
  next_order:=(public.open_additional_grow_order(buyer,2)->>'id')::uuid;
  begin
    update public.orders set grow_link_digest=binding where id=next_order;
    raise exception 'Provider link rebound to a different order';
  exception when unique_violation then null;
  end;
  begin
    update public.orders set grow_link_digest='broken' where id=next_order;
    raise exception 'Invalid digest accepted';
  exception when check_violation then null;
  end;
end $$;
rollback;
