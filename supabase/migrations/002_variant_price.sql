-- =================================================================
-- AABROZE — Variant-level pricing (nullable, backwards compatible)
-- Apply in Supabase SQL Editor after 001_initial_schema.sql
-- =================================================================

alter table public.product_variants
  add column if not exists price numeric(10,2)
  check (price is null or price >= 0);

comment on column public.product_variants.price is
  'Optional per-size price. When null, storefront uses product.sale_price ?? product.price.';

-- Keep placeholder owner contact in sync only if still the demo seed value.
update public.site_settings
set value = '923282301296', updated_at = now()
where key = 'owner_whatsapp' and value in ('923000000000', '');

update public.site_settings
set value = 'aabroze.pk@gmail.com', updated_at = now()
where key = 'owner_email' and value in ('hello@aabroze.com', '');

create or replace function public.decrement_variant_stock(p_variant_id uuid, p_qty integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  if p_qty is null or p_qty <= 0 then
    return false;
  end if;
  update public.product_variants
  set stock = stock - p_qty
  where id = p_variant_id and stock >= p_qty;
  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

revoke all on function public.decrement_variant_stock(uuid, integer) from public;
grant execute on function public.decrement_variant_stock(uuid, integer) to service_role;
