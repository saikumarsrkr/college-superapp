BEGIN;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Students)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'student' check (role in ('student', 'admin', 'faculty', 'canteen_runner', 'canteen_admin')),
  xp integer default 0,
  attendance_rate numeric(5,2) default 100.00,
  cgpa numeric(3,2) default 0.0,
  ghost_mode boolean default false,
  username text unique,
  created_at timestamptz default now()
);

-- 2. CLASSES (Timetable)
create table if not exists classes (
  id uuid default uuid_generate_v4() primary key,
  code text not null,
  name text not null,
  room text,
  start_time time,
  end_time time,
  day_of_week text,
  status text default 'scheduled'
);

-- 3. TICKETS (Governance)
create table if not exists tickets (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  title text not null,
  description text,
  category text,
  department text,
  status text default 'open',
  priority text default 'medium',
  created_at timestamptz default now()
);

-- 4. MEALS (Dining)
create table if not exists meals (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  items text,
  served_at time,
  date date default current_date
);

-- 5. SKILLS (Arena)
create table if not exists skills (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text,
  xp_reward integer default 100
);

-- 6. CANTEEN TABLES
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

create table if not exists canteen_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists canteen_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  image_url text,
  category_id uuid references canteen_categories(id) on delete set null,
  is_available boolean default true,
  daily_limit integer,
  current_stock integer,
  recipe jsonb,
  created_at timestamptz default now()
);

create table if not exists canteen_inventory (
  id uuid default uuid_generate_v4() primary key,
  item_name text not null unique,
  quantity numeric default 0,
  unit text default 'units',
  min_threshold numeric default 10,
  last_updated timestamptz default now()
);

create table if not exists canteen_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create table if not exists canteen_orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  status order_status default 'pending',
  payment_status payment_status default 'pending',
  total_amount numeric not null check (total_amount >= 0),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists canteen_order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references canteen_orders(id) on delete cascade not null,
  item_id uuid references canteen_items(id) on delete set null,
  quantity integer not null check (quantity > 0),
  price_at_time numeric not null check (price_at_time >= 0)
);

-- 7. ENABLE ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table classes enable row level security;
alter table tickets enable row level security;
alter table meals enable row level security;
alter table skills enable row level security;
alter table canteen_categories enable row level security;
alter table canteen_items enable row level security;
alter table canteen_inventory enable row level security;
alter table canteen_settings enable row level security;
alter table canteen_orders enable row level security;
alter table canteen_order_items enable row level security;

-- 8. POLICIES (Simplified for MVP)
drop policy if exists "Public Read" on profiles;
create policy "Public Read" on profiles for select using (true);

drop policy if exists "Public Read Classes" on classes;
create policy "Public Read Classes" on classes for select using (true);

drop policy if exists "Public Read Meals" on meals;
create policy "Public Read Meals" on meals for select using (true);

drop policy if exists "Public Read Skills" on skills;
create policy "Public Read Skills" on skills for select using (true);

drop policy if exists "Public Read Canteen Items" on canteen_items;
create policy "Public Read Canteen Items" on canteen_items for select using (true);

drop policy if exists "Public Read Canteen Cats" on canteen_categories;
create policy "Public Read Canteen Cats" on canteen_categories for select using (true);

-- Student Policies
drop policy if exists "Student Own Tickets" on tickets;
create policy "Student Own Tickets" on tickets for all using (auth.uid() = student_id);

drop policy if exists "Student Own Orders" on canteen_orders;
create policy "Student Own Orders" on canteen_orders for select using (auth.uid() = user_id);

drop policy if exists "Student Create Orders" on canteen_orders;
create policy "Student Create Orders" on canteen_orders for insert with check (auth.uid() = user_id);

drop policy if exists "Student Own Order Items" on canteen_order_items;
create policy "Student Own Order Items" on canteen_order_items for select using (
  exists (select 1 from canteen_orders where id = order_id and user_id = auth.uid())
);

-- Admin/Staff Policies (Allow all for roles)
drop policy if exists "Staff Manage All" on profiles;
create policy "Staff Manage All" on profiles for all using (
  auth.uid() in (select id from profiles where role in ('admin', 'canteen_admin', 'canteen_runner'))
);

drop policy if exists "Staff Manage Canteen" on canteen_orders;
create policy "Staff Manage Canteen" on canteen_orders for all using (
  auth.uid() in (select id from profiles where role in ('admin', 'canteen_admin', 'canteen_runner'))
);

drop policy if exists "Staff Manage Canteen Items" on canteen_items;
create policy "Staff Manage Canteen Items" on canteen_items for all using (
  auth.uid() in (select id from profiles where role in ('admin', 'canteen_admin'))
);

-- 9. TRIGGERS & FUNCTIONS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'student');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function create_canteen_order(
  p_user_id uuid,
  p_total_amount numeric,
  p_notes text,
  p_items jsonb
) returns uuid as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  insert into canteen_orders (user_id, total_amount, notes, status, payment_status)
  values (p_user_id, p_total_amount, p_notes, 'pending', 'pending')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into canteen_order_items (order_id, item_id, quantity, price_at_time)
    values (v_order_id, (v_item->>'item_id')::uuid, (v_item->>'quantity')::integer, (v_item->>'price_at_time')::numeric);
  end loop;
  return v_order_id;
end;
$$ language plpgsql security definer;

-- 10. REALTIME
-- Create publication only if not exists
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

alter publication supabase_realtime add table canteen_orders, tickets, meals;

COMMIT;
