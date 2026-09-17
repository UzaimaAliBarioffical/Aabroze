-- =================================================================
-- AABROZE E-Commerce — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- =================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =================================================================
-- PROFILES (extends Supabase auth.users)
-- =================================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  phone      text,
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update timestamp trigger
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =================================================================
-- CATEGORIES
-- =================================================================
create table public.categories (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  description   text,
  image_url     text,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- =================================================================
-- PRODUCTS
-- =================================================================
create table public.products (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  slug              text not null unique,
  sku               text unique,
  description       text,
  fabric            text,
  color             text,
  care_instructions text,
  price             numeric(10,2) not null check (price >= 0),
  sale_price        numeric(10,2) check (sale_price >= 0 and (sale_price is null or sale_price < price)),
  category_id       uuid references public.categories(id) on delete set null,
  is_featured       boolean not null default false,
  is_new_arrival    boolean not null default false,
  is_published      boolean not null default false,
  is_archived       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.update_updated_at();

-- =================================================================
-- PRODUCT IMAGES
-- =================================================================
create table public.product_images (
  id                   uuid primary key default uuid_generate_v4(),
  product_id           uuid not null references public.products(id) on delete cascade,
  url                  text not null,
  cloudinary_public_id text,
  alt_text             text,
  display_order        integer not null default 0,
  is_video             boolean not null default false,
  created_at           timestamptz not null default now()
);

-- =================================================================
-- PRODUCT VARIANTS (size × stock)
-- =================================================================
create table public.product_variants (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  size       text not null,
  stock      integer not null default 0 check (stock >= 0),
  sku_suffix text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size)
);

create trigger product_variants_updated_at
  before update on public.product_variants
  for each row execute procedure public.update_updated_at();

-- =================================================================
-- ORDERS
-- =================================================================
create table public.orders (
  id                uuid primary key default uuid_generate_v4(),
  order_number      text not null unique,
  user_id           uuid references auth.users(id) on delete set null,
  customer_name     text not null,
  customer_email    text,
  customer_phone    text not null,
  customer_whatsapp text,
  province          text not null,
  city              text not null,
  address           text not null,
  postal_code       text,
  order_notes       text,
  subtotal          numeric(10,2) not null check (subtotal >= 0),
  delivery_charges  numeric(10,2) not null default 0 check (delivery_charges >= 0),
  total             numeric(10,2) not null check (total >= 0),
  payment_method    text not null check (payment_method in ('cod', 'jazzcash', 'easypaisa')),
  payment_status    text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  status            text not null default 'pending' check (status in ('pending','confirmed','packed','shipped','delivered','cancelled')),
  idempotency_key   text not null unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.update_updated_at();

-- =================================================================
-- ORDER ITEMS
-- =================================================================
create table public.order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete restrict,
  variant_id   uuid not null references public.product_variants(id) on delete restrict,
  product_name text not null,
  size         text not null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(10,2) not null check (unit_price >= 0),
  total_price  numeric(10,2) not null check (total_price >= 0),
  image_url    text,
  created_at   timestamptz not null default now()
);

-- =================================================================
-- PAYMENTS
-- =================================================================
create table public.payments (
  id                 uuid primary key default uuid_generate_v4(),
  order_id           uuid not null unique references public.orders(id) on delete cascade,
  gateway            text not null check (gateway in ('cod', 'jazzcash', 'easypaisa')),
  gateway_reference  text,
  amount             numeric(10,2) not null check (amount >= 0),
  currency           text not null default 'PKR',
  status             text not null default 'unpaid' check (status in ('unpaid', 'paid', 'failed', 'refunded')),
  raw_response       jsonb,
  verified_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger payments_updated_at
  before update on public.payments
  for each row execute procedure public.update_updated_at();

-- =================================================================
-- NEWSLETTER SUBSCRIBERS
-- =================================================================
create table public.newsletter_subscribers (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- =================================================================
-- SITE SETTINGS (key-value store)
-- =================================================================
create table public.site_settings (
  key        text primary key,
  value      text not null default '',
  label      text,
  updated_at timestamptz not null default now()
);

-- Seed default settings
insert into public.site_settings (key, label, value) values
  ('announcement_bar_text',  'Announcement Bar',        'Free delivery on orders above Rs. 3,000 | Cash on Delivery Available'),
  ('announcement_bar_active','Announcement Bar Active',  'true'),
  ('owner_whatsapp',         'Owner WhatsApp Number',   '923000000000'),
  ('owner_email',            'Owner Email',             'hello@aabroze.com'),
  ('business_hours',         'Business Hours',          'Mon – Sat: 10am – 7pm'),
  ('instagram_url',          'Instagram URL',           'https://instagram.com/aabroze'),
  ('facebook_url',           'Facebook URL',            'https://facebook.com/aabroze'),
  ('address',                'Business Address',        'Lahore, Pakistan'),
  ('free_shipping_threshold','Free Shipping Threshold (PKR)', '3000')
on conflict do nothing;

-- =================================================================
-- INDEXES
-- =================================================================
create index idx_products_slug           on public.products(slug);
create index idx_products_category       on public.products(category_id);
create index idx_products_published      on public.products(is_published, is_archived);
create index idx_products_featured       on public.products(is_featured) where is_featured = true;
create index idx_products_new_arrival    on public.products(is_new_arrival) where is_new_arrival = true;
create index idx_products_created        on public.products(created_at desc);
create index idx_product_images_product  on public.product_images(product_id, display_order);
create index idx_product_variants_product on public.product_variants(product_id);
create index idx_orders_number           on public.orders(order_number);
create index idx_orders_status           on public.orders(status);
create index idx_orders_created          on public.orders(created_at desc);
create index idx_order_items_order       on public.order_items(order_id);
create index idx_categories_slug         on public.categories(slug);

-- =================================================================
-- ROW LEVEL SECURITY
-- =================================================================
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_images       enable row level security;
alter table public.product_variants     enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.payments             enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.site_settings        enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── Profiles ────────────────────────────────────────────────────
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select using (public.is_admin());

-- ─── Categories (public read) ─────────────────────────────────────
create policy "Public can read active categories"
  on public.categories for select using (is_active = true);

create policy "Admins manage categories"
  on public.categories for all using (public.is_admin());

-- ─── Products (public read published) ────────────────────────────
create policy "Public can read published products"
  on public.products for select
  using (is_published = true and is_archived = false);

create policy "Admins manage products"
  on public.products for all using (public.is_admin());

-- ─── Product Images ───────────────────────────────────────────────
create policy "Public can read product images"
  on public.product_images for select
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.is_published = true and p.is_archived = false
  ));

create policy "Admins manage product images"
  on public.product_images for all using (public.is_admin());

-- ─── Product Variants ─────────────────────────────────────────────
create policy "Public can read product variants"
  on public.product_variants for select
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.is_published = true and p.is_archived = false
  ));

create policy "Admins manage product variants"
  on public.product_variants for all using (public.is_admin());

-- ─── Orders ───────────────────────────────────────────────────────
create policy "Customers read own orders"
  on public.orders for select using (user_id = auth.uid());

create policy "Anyone can create an order"
  on public.orders for insert with check (true);

create policy "Admins manage all orders"
  on public.orders for all using (public.is_admin());

-- ─── Order Items ──────────────────────────────────────────────────
create policy "Customers read own order items"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  ));

create policy "Service role can insert order items"
  on public.order_items for insert with check (true);

create policy "Admins manage all order items"
  on public.order_items for all using (public.is_admin());

-- ─── Payments ─────────────────────────────────────────────────────
create policy "Admins manage payments"
  on public.payments for all using (public.is_admin());

create policy "Service role can insert payments"
  on public.payments for insert with check (true);

-- ─── Newsletter ───────────────────────────────────────────────────
create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert with check (true);

create policy "Admins manage subscribers"
  on public.newsletter_subscribers for all using (public.is_admin());

-- ─── Site Settings ────────────────────────────────────────────────
create policy "Public can read settings"
  on public.site_settings for select using (true);

create policy "Admins manage settings"
  on public.site_settings for all using (public.is_admin());

-- =================================================================
-- SEED CATEGORIES
-- =================================================================
insert into public.categories (name, slug, description, display_order, is_active) values
  ('Casual Wear',     'casual-wear',     'Everyday comfortable Pakistani fashion', 1, true),
  ('Semi-Formal',     'semi-formal',     'Elegant semi-formal eastern wear',        2, true),
  ('New Arrivals',    'new-arrivals',    'Latest additions to the collection',      3, true),
  ('Collections',     'collections',     'Curated seasonal collections',            4, true)
on conflict do nothing;

-- =================================================================
-- SEED SAMPLE PRODUCTS (Replace before launch)
-- =================================================================
-- NOTE: All names, prices, and descriptions below are placeholders.
-- ⚠️  REPLACE BEFORE LAUNCH — confirm with brand owner.
-- =================================================================
insert into public.products (
  name, slug, sku, description, fabric, color, care_instructions,
  price, sale_price, is_featured, is_new_arrival, is_published
) values
(
  '[REPLACE] Ivory Lawn Suit',
  'ivory-lawn-suit',
  'ABZ-001',
  '[REPLACE BEFORE LAUNCH] A beautifully crafted ivory lawn suit perfect for summer days.',
  '[REPLACE] Premium Lawn',
  'Ivory',
  'Gentle machine wash. Do not bleach. Iron on low heat.',
  3500, null, true, true, false
),
(
  '[REPLACE] Dusty Rose Karandi Set',
  'dusty-rose-karandi-set',
  'ABZ-002',
  '[REPLACE BEFORE LAUNCH] Warm toned karandi ensemble for the cooler season.',
  '[REPLACE] Karandi',
  'Dusty Rose',
  'Dry clean recommended.',
  4200, 3800, true, true, false
),
(
  '[REPLACE] Sage Green Embroidered Suit',
  'sage-green-embroidered-suit',
  'ABZ-003',
  '[REPLACE BEFORE LAUNCH] Hand-embroidered sage green suit for semi-formal occasions.',
  '[REPLACE] Cambric',
  'Sage Green',
  'Hand wash cold. Do not tumble dry.',
  5500, null, false, true, false
),
(
  '[REPLACE] Maroon Printed Lawn',
  'maroon-printed-lawn',
  'ABZ-004',
  '[REPLACE BEFORE LAUNCH] Rich maroon printed lawn with matching dupatta.',
  '[REPLACE] Lawn',
  'Maroon',
  'Machine wash cold.',
  3200, 2800, true, false, false
),
(
  '[REPLACE] Beige Linen Co-ord Set',
  'beige-linen-coord-set',
  'ABZ-005',
  '[REPLACE BEFORE LAUNCH] Minimal beige linen two-piece for effortless everyday style.',
  '[REPLACE] Linen',
  'Beige',
  'Hand wash recommended.',
  4800, null, true, false, false
),
(
  '[REPLACE] Midnight Blue Formal Suit',
  'midnight-blue-formal-suit',
  'ABZ-006',
  '[REPLACE BEFORE LAUNCH] Sophisticated midnight blue formal suit for special occasions.',
  '[REPLACE] Chiffon',
  'Midnight Blue',
  'Dry clean only.',
  6500, 5800, false, true, false
)
on conflict do nothing;
