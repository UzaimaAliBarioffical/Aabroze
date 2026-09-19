-- Apply after 002. Checkout writes commit or roll back together.
begin;
alter table public.orders add column request_fingerprint text;
drop policy if exists "Anyone can create an order" on public.orders;
drop policy if exists "Service role can insert order items" on public.order_items;
drop policy if exists "Service role can insert payments" on public.payments;
-- Prevent profile updates from granting the customer admin privileges.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create table public.order_email_jobs (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  recipient text not null check (recipient in ('owner', 'customer')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid, locked_until timestamptz, sent_at timestamptz, last_error text,
  unique (order_id, recipient)
);
alter table public.order_email_jobs enable row level security;
revoke all on public.order_email_jobs from anon, authenticated;
grant select on public.order_email_jobs to authenticated;
grant select, update on public.order_email_jobs to service_role;
create index order_email_jobs_due on public.order_email_jobs (next_attempt_at) where sent_at is null;
create policy "Admins read email delivery status" on public.order_email_jobs
  for select using (public.is_admin());

create or replace function public.place_store_order(
  p_customer jsonb, p_items jsonb, p_user_id uuid, p_fingerprint text,
  p_shipping numeric, p_free_threshold numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  saved public.orders%rowtype;
  entry record;
  variant public.product_variants%rowtype;
  product public.products%rowtype;
  prepared jsonb := '[]'::jsonb;
  subtotal numeric := 0;
  shipping numeric;
  price numeric;
  photo text;
  key text := p_customer->>'idempotency_key';
begin
  if key is null or p_fingerprint is null or p_customer->>'payment_method' is distinct from 'cod' then
    raise exception 'Checkout: Invalid checkout request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(key, 0));
  select * into saved from public.orders where idempotency_key = key;
  if found then
    if saved.request_fingerprint is distinct from p_fingerprint then
      raise exception 'Checkout: This checkout was already used with different details. Please start a new checkout.';
    end if;
    return jsonb_build_object('duplicate', true, 'order', to_jsonb(saved) ||
      jsonb_build_object('items', (select jsonb_agg(to_jsonb(i)) from public.order_items i where order_id = saved.id)));
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50
    or p_shipping is null or p_shipping < 0 then
    raise exception 'Checkout: Invalid cart';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_items) as x(variant_id uuid)
    group by variant_id having count(*) > 1) then
    raise exception 'Checkout: Duplicate sizes in cart';
  end if;
  -- Stable locking order; inventory cannot change between validation and deduction.
  for entry in select * from jsonb_to_recordset(p_items)
    as x(product_id uuid, variant_id uuid, quantity integer) order by product_id, variant_id
  loop
    if entry.quantity is null or entry.quantity not between 1 and 10 then
      raise exception 'Checkout: Invalid quantity';
    end if;
    select * into product from public.products where id = entry.product_id for share;
    if not found or not product.is_published or product.is_archived then
      raise exception 'Checkout: A product is no longer available';
    end if;
    select * into variant from public.product_variants where id = entry.variant_id for update;
    if not found or variant.product_id <> entry.product_id then
      raise exception 'Checkout: Product and size do not match';
    end if;
    if variant.stock < entry.quantity then
      raise exception 'Checkout: % (%) does not have enough stock', product.name, variant.size;
    end if;
    price := coalesce(variant.price, product.sale_price, product.price);
    subtotal := subtotal + price * entry.quantity;
    select url into photo from public.product_images where product_id = product.id
      and not is_video order by display_order, id limit 1;
    prepared := prepared || jsonb_build_array(jsonb_build_object(
      'product_id', product.id, 'variant_id', variant.id, 'product_name', product.name,
      'size', variant.size, 'quantity', entry.quantity, 'unit_price', price,
      'total_price', price * entry.quantity, 'image_url', photo));
    update public.product_variants set stock = stock - entry.quantity where id = variant.id;
  end loop;
  shipping := case when p_free_threshold > 0 and subtotal >= p_free_threshold then 0 else p_shipping end;
  insert into public.orders (order_number, user_id, customer_name, customer_email, customer_phone,
    customer_whatsapp, province, city, address, postal_code, order_notes, subtotal,
    delivery_charges, total, payment_method, payment_status, status, idempotency_key, request_fingerprint)
  values ('ABZ-' || to_char(now() at time zone 'Asia/Karachi', 'YYYYMMDD') || '-' || upper(replace(uuid_generate_v4()::text, '-', '')),
    p_user_id, p_customer->>'full_name', p_customer->>'email', p_customer->>'phone',
    nullif(p_customer->>'whatsapp', ''), p_customer->>'province', p_customer->>'city',
    p_customer->>'address', nullif(p_customer->>'postal_code', ''), nullif(p_customer->>'order_notes', ''),
    subtotal, shipping, subtotal + shipping, 'cod', 'unpaid', 'pending', key, p_fingerprint)
  returning * into saved;
  insert into public.order_items (order_id, product_id, variant_id, product_name, size, quantity, unit_price, total_price, image_url)
    select saved.id, x.* from jsonb_to_recordset(prepared) as x(product_id uuid, variant_id uuid,
      product_name text, size text, quantity integer, unit_price numeric, total_price numeric, image_url text);
  insert into public.payments (order_id, gateway, amount, currency, status)
    values (saved.id, 'cod', saved.total, 'PKR', 'unpaid');
  insert into public.order_email_jobs (order_id, recipient) values (saved.id, 'owner'), (saved.id, 'customer');
  return jsonb_build_object('duplicate', false, 'order', to_jsonb(saved) || jsonb_build_object('items', prepared));
end;
$$;
revoke all on function public.place_store_order(jsonb,jsonb,uuid,text,numeric,numeric) from public, anon, authenticated;
grant execute on function public.place_store_order(jsonb,jsonb,uuid,text,numeric,numeric) to service_role;

create or replace function public.claim_order_emails(p_order_id uuid default null)
returns setof public.order_email_jobs language sql security definer set search_path = public as $$
  update public.order_email_jobs j set attempts = attempts + 1,
    lease_token = uuid_generate_v4(), locked_until = now() + interval '5 minutes'
  where j.id in (select id from public.order_email_jobs
    where sent_at is null and next_attempt_at <= now()
      and (locked_until is null or locked_until < now())
      and (p_order_id is null or order_id = p_order_id)
    order by next_attempt_at for update skip locked limit 10)
  returning j.*;
$$;
revoke all on function public.claim_order_emails(uuid) from public, anon, authenticated;
grant execute on function public.claim_order_emails(uuid) to service_role;

-- Missing sizes start unavailable; preserve existing aliases, stock and prices.
insert into public.product_variants (product_id, size, stock)
select p.id, s.size, 0 from public.products p
cross join (values ('S','small'), ('M','medium'), ('L','large'), ('XL','xl')) s(size, alias)
where not exists (select 1 from public.product_variants v where v.product_id = p.id
  and lower(trim(v.size)) in (lower(s.size), s.alias));
commit;
