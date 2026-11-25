create or replace function public.record_grow_refund(p_order_id uuid, p_transaction_id text, p_amount integer, p_currency text)
returns text language plpgsql set search_path = '' as $$
declare
  checkout public.orders%rowtype;
begin
  select * into checkout from public.orders where id=p_order_id;
  if not found then return 'NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtextextended(checkout.customer_id::text, 0));
  select * into checkout from public.orders where id=p_order_id for update;
  if checkout.external_transaction_id is distinct from p_transaction_id
    or checkout.amount is distinct from p_amount or checkout.currency is distinct from p_currency
    or checkout.status not in ('PAID','REFUNDED') then return 'CONFLICT';
  end if;
  if checkout.status = 'REFUNDED' then return 'DUPLICATE'; end if;
  -- Coordinate with claims/transfers, which lock this account row before
  -- assigning a payment to a fingerprint.
  perform 1 from public.user_access where user_id=checkout.customer_id for update;
  update public.orders set status='REFUNDED' where id=p_order_id;
  if public.grow_paid_seat_count(checkout.customer_id)=0 then
    -- Restore a qualifying previous license when the last Grow seat is refunded.
    -- Never reactivate a manually disabled account.
    update public.user_access a set plan=p.plan::public.plan_tier, expires_at=original.prior_legacy_expires_at
    from public.purchases p cross join lateral (
      select o.prior_legacy_expires_at from public.orders o where o.customer_id=p.user_id
        and o.prior_legacy_receipt=p.payment_id and o.status in ('PAID','REFUNDED','CHARGED_BACK') order by o.created_at limit 1
    ) original where a.user_id=checkout.customer_id and p.user_id=a.user_id
      and p.payment_id in (select public.legacy_seat_receipt(checkout.customer_id,a.plan::text));
    update public.user_access a set is_active=false where a.user_id=checkout.customer_id
      and not public.has_verified_desktop_purchase(a.user_id,a.plan::text);
  end if;
  -- Older clients read the account's primary fingerprint. When that exact
  -- device lost its payment, point them to a surviving bound installation.
  update public.user_access a set machine_fingerprint=(
    select c.fingerprint from public.account_paid_seat_receipts(a.user_id,a.plan::text)
      with ordinality receipt(payment_id,position)
    join public.paid_device_claims c on c.user_id=a.user_id and c.payment_id=receipt.payment_id
    order by receipt.position limit 1
  )
  where a.user_id=checkout.customer_id and exists (
    select 1 from public.paid_device_claims old where old.user_id=a.user_id
      and old.payment_id=p_transaction_id and old.fingerprint=a.machine_fingerprint
  );
  return 'REFUNDED';
end;
$$;
revoke all on function public.record_grow_refund(uuid,text,integer,text) from public, anon, authenticated;
grant execute on function public.record_grow_refund(uuid,text,integer,text) to service_role;
