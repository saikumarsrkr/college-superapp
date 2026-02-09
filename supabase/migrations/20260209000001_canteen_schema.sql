-- Migration: Add Canteen Management Schema

-- 1. Canteen Categories
create table if not exists canteen_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

-- 2. Canteen Items
create table if not exists canteen_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  image_url text,
  category_id uuid references canteen_categories(id) on delete set null,
  is_available boolean default true,
  daily_limit integer, -- Max orders per day for this item (null = unlimited)
  current_stock integer, -- Simple stock tracking for limited items
  recipe jsonb, -- e.g. {"Bun": 1, "Patty": 1} - matches canteen_inventory.item_name
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Canteen Inventory (Raw Materials)
create table if not exists canteen_inventory (
  id uuid default uuid_generate_v4() primary key,
  item_name text not null unique,
  quantity numeric default 0,
  unit text default 'units', -- kg, liters, units, etc.
  min_threshold numeric default 10,
  last_updated timestamptz default now()
);

-- 4. Canteen Settings (Operating Hours, Status)
create table if not exists canteen_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Seed default settings
insert into canteen_settings (key, value) values
  ('is_open', 'true'),
  ('operating_hours', '08:00 - 18:00'),
  ('auto_accept_orders', 'false')
on conflict (key) do nothing;

-- 5. Canteen Orders
do $$ begin
  create type order_status as enum ('pending', 'preparing', 'ready', 'completed', 'rejected', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists canteen_orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null, -- References public profile for easier joining
  status order_status default 'pending',
  payment_status payment_status default 'pending',
  total_amount numeric not null check (total_amount >= 0),
  notes text, -- Special instructions
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Canteen Order Items
create table if not exists canteen_order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references canteen_orders(id) on delete cascade not null,
  item_id uuid references canteen_items(id) on delete set null,
  -- item_name text not null, -- Snapshot in case item is deleted (removed to avoid complexity for now, reliance on item_id or history table is better, but let's keep it simple)
  quantity integer not null check (quantity > 0),
  price_at_time numeric not null check (price_at_time >= 0)
);

-- 7. RLS Policies

-- Helper function to check if user is canteen staff
create or replace function is_canteen_staff()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('canteen_runner', 'canteen_admin', 'admin') -- admin implies super-admin
  );
end;
$$ language plpgsql security definer;

-- Enable RLS
alter table canteen_categories enable row level security;
alter table canteen_items enable row level security;
alter table canteen_inventory enable row level security;
alter table canteen_settings enable row level security;
alter table canteen_orders enable row level security;
alter table canteen_order_items enable row level security;

-- Policies

-- Categories: Public read, Staff write
drop policy if exists "Categories are viewable by everyone" on canteen_categories;
create policy "Categories are viewable by everyone" on canteen_categories for select using (true);

drop policy if exists "Staff can manage categories" on canteen_categories;
create policy "Staff can manage categories" on canteen_categories for all using (is_canteen_staff());

-- Items: Public read, Staff write
drop policy if exists "Items are viewable by everyone" on canteen_items;
create policy "Items are viewable by everyone" on canteen_items for select using (true);

drop policy if exists "Staff can manage items" on canteen_items;
create policy "Staff can manage items" on canteen_items for all using (is_canteen_staff());

-- Inventory: Staff only
drop policy if exists "Staff can manage inventory" on canteen_inventory;
create policy "Staff can manage inventory" on canteen_inventory for all using (is_canteen_staff());

-- Settings: Public read, Staff write
drop policy if exists "Settings are viewable by everyone" on canteen_settings;
create policy "Settings are viewable by everyone" on canteen_settings for select using (true);

drop policy if exists "Staff can manage settings" on canteen_settings;
create policy "Staff can manage settings" on canteen_settings for all using (is_canteen_staff());

-- Orders: Users see own, Staff see all
drop policy if exists "Users can view own orders" on canteen_orders;
create policy "Users can view own orders" on canteen_orders for select using (auth.uid() = user_id);

drop policy if exists "Staff can view all orders" on canteen_orders;
create policy "Staff can view all orders" on canteen_orders for select using (is_canteen_staff());

drop policy if exists "Users can create own orders" on canteen_orders;
create policy "Users can create own orders" on canteen_orders for insert with check (auth.uid() = user_id);

drop policy if exists "Staff can update orders" on canteen_orders;
create policy "Staff can update orders" on canteen_orders for update using (is_canteen_staff());

-- Order Items: Users see own (via join), Staff see all
drop policy if exists "Users can view own order items" on canteen_order_items;
create policy "Users can view own order items" on canteen_order_items for select using (
  exists (select 1 from canteen_orders where canteen_orders.id = order_id and canteen_orders.user_id = auth.uid())
);

drop policy if exists "Staff can view all order items" on canteen_order_items;
create policy "Staff can view all order items" on canteen_order_items for select using (is_canteen_staff());

drop policy if exists "Users can create own order items" on canteen_order_items;
create policy "Users can create own order items" on canteen_order_items for insert with check (
  exists (select 1 from canteen_orders where canteen_orders.id = order_id and canteen_orders.user_id = auth.uid())
);

-- 8. Enable Realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'canteen_orders') then
    alter publication supabase_realtime add table canteen_orders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'canteen_order_items') then
    alter publication supabase_realtime add table canteen_order_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'canteen_items') then
    alter publication supabase_realtime add table canteen_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'canteen_inventory') then
    alter publication supabase_realtime add table canteen_inventory;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'canteen_settings') then
    alter publication supabase_realtime add table canteen_settings;
  end if;
end $$;
