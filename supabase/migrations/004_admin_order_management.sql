-- Apply after 003. No products, prices, or existing order values are rewritten.
begin;

create or replace function public.update_admin_order(
  p_order_id uuid, p_status text, p_expected_status text,
  p_payment_received boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  saved public.orders%rowtype;
  item record;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Order: Admin access required';
  end if;
  select * into saved from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order: Order not found'; end if;
  if saved.status is distinct from p_expected_status then
    raise exception 'Order: This order changed. Refresh before updating it.';
  end if;
  if p_status is null or not (
    (saved.status = 'pending' and p_status in ('confirmed', 'cancelled')) or
    (saved.status = 'confirmed' and p_status in ('packed', 'cancelled')) or
    (saved.status = 'packed' and p_status in ('shipped', 'cancelled')) or
    (saved.status = 'shipped' and p_status = 'delivered')
  ) then
    raise exception 'Order: This status change is not allowed.';
  end if;

  if p_status = 'cancelled' then
    if saved.request_fingerprint is null then
      raise exception 'Order: Review legacy inventory manually before cancelling this order.';
    end if;
    if saved.payment_status <> 'unpaid' then
      raise exception 'Order: Resolve the payment before cancelling this order.';
    end if;
    -- The locked order and forward-only statuses prevent duplicate restocking.
    -- Match checkout's lock ordering to avoid cross-order inventory deadlocks.
    for item in select product_id, variant_id, sum(quantity)::integer as quantity
      from public.order_items where order_id = saved.id
      group by product_id, variant_id order by product_id, variant_id
    loop
      update public.product_variants set stock = stock + item.quantity
        where id = item.variant_id and product_id = item.product_id;
    end loop;
  end if;

  if p_status = 'delivered' and saved.payment_method = 'cod' then
    if saved.payment_status <> 'paid' and not coalesce(p_payment_received, false) then
      raise exception 'Order: Confirm COD payment was received before marking delivered.';
    end if;
    update public.payments set status = 'paid', verified_at = coalesce(verified_at, now())
      where order_id = saved.id and gateway = 'cod';
    if not found then raise exception 'Order: COD payment record is missing.'; end if;
    saved.payment_status := 'paid';
  elsif coalesce(p_payment_received, false) then
    raise exception 'Order: Payment collection can only be confirmed for a delivered COD order.';
  end if;
  update public.orders set status = p_status, payment_status = saved.payment_status
    where id = saved.id returning * into saved;
  return to_jsonb(saved);
end;
$$;

revoke all on function public.update_admin_order(uuid,text,text,boolean) from public, anon;
grant execute on function public.update_admin_order(uuid,text,text,boolean) to authenticated;
commit;
