-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Students)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  xp integer default 0,
  attendance_rate numeric(5,2) default 100.00,
  cgpa numeric(3,2) default 0.0,
  ghost_mode boolean default false,
  created_at timestamptz default now()
);

-- 2. CLASSES (Timetable)
create table classes (
  id uuid default uuid_generate_v4() primary key,
  code text not null, -- e.g., CS-101
  name text not null,
  room text,
  start_time time,
  end_time time,
  day_of_week text, -- 'Monday', etc.
  status text default 'scheduled' -- scheduled, ongoing, completed, cancelled
);

-- 3. ATTENDANCE LOGS
create table attendance_logs (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  class_id uuid references classes(id),
  status text check (status in ('present', 'absent', 'late', 'excused')),
  verified_at timestamptz,
  verified_by uuid references profiles(id), -- Peer verification
  created_at timestamptz default now()
);

-- 4. TICKETS (Governance)
create table tickets (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  title text not null,
  description text,
  category text, -- 'Maintenance', 'IT', 'Hygiene'
  status text default 'open', -- open, in-progress, resolved, overdue
  priority text default 'medium',
  sla_due_at timestamptz,
  created_at timestamptz default now()
);

-- 5. SKILLS (Arena)
create table skills (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text,
  prerequisite_id uuid references skills(id),
  xp_reward integer default 100
);

create table student_skills (
  student_id uuid references profiles(id),
  skill_id uuid references skills(id),
  unlocked_at timestamptz default now(),
  primary key (student_id, skill_id)
);

-- 6. MEALS (Dining)
create table meals (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- 'Breakfast', 'Lunch'
  items text,
  served_at time,
  date date default current_date
);

create table meal_ratings (
  id uuid default uuid_generate_v4() primary key,
  meal_id uuid references meals(id),
  student_id uuid references profiles(id),
  rating integer check (rating >= 1 and rating <= 5),
  photo_url text,
  created_at timestamptz default now()
);

-- 7. DOCUMENTS (Vault)
create table documents (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  name text not null,
  type text, -- 'Identity', 'Academic', 'Financial'
  file_url text not null,
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- SEED DATA (Mock Data for Demo)
insert into classes (code, name, room, start_time, end_time, day_of_week) values
('CS-201', 'Data Structures', 'CS-201', '09:00', '10:00', 'Monday'),
('CS-305', 'Machine Learning', 'CS-305', '11:00', '12:00', 'Monday'),
('CS-102', 'Database Systems', 'CS-102', '14:00', '15:00', 'Monday');

insert into meals (name, items, served_at) values
('Breakfast', 'Idli, Sambar, Chutney', '07:30'),
('Lunch', 'Rice, Dal, Paneer', '12:30'),
('Snacks', 'Samosa, Tea', '16:30'),
('Dinner', 'Roti, Sabzi, Rice', '20:00');

insert into skills (name, xp_reward) values 
('Python', 100), ('Data Science', 200), ('Web Dev', 150);
-- 1. ACADEMIC & PRODUCTIVITY
create table resources (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  category text, -- 'Notes', 'Papers', 'Lab Manuals'
  file_url text not null,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table faculty (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  specialization text, -- 'AI', 'Soil Science', 'Network Security'
  is_available boolean default true,
  office_hours text
);

-- 2. LIFESTYLE & CANTEEN
create table canteen_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric(10,2),
  stock_status text, -- 'Available', 'Low Stock', 'Sold Out'
  nutritional_info jsonb -- { "calories": 250, "protein": "10g" }
);

create table orders (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  items jsonb, -- Array of item IDs and quantities
  status text default 'cooking', -- 'cooking', 'ready', 'delivered'
  total_price numeric(10,2),
  created_at timestamptz default now()
);

-- 3. HOSTEL & OUT-PASS
create table out_passes (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  reason text,
  destination text,
  exit_time timestamptz,
  expected_return timestamptz,
  approval_status text default 'pending' -- 'pending', 'approved', 'rejected'
);

-- 4. ARENA & SKILLS (Enhancements)
alter table profiles add column if not exists branch text; -- 'CSE', 'Ag', 'Mech'
alter table profiles add column if not exists growth_score integer default 0;

create table leaderboards (
  id uuid default uuid_generate_v4() primary key,
  month text, -- 'Feb-2026'
  student_id uuid references profiles(id),
  rank integer,
  score integer
);

-- 5. COMMUNITY (Anonymous)
create table anonymous_posts (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  upvotes integer default 0,
  is_verified_truth boolean default false, -- Peer verification flag
  created_at timestamptz default now()
);

-- 6. CYBERSECURITY MODE
create table ctf_challenges (
  id uuid default uuid_generate_v4() primary key,
  title text,
  difficulty text, -- 'Easy', 'Hard', 'Insane'
  points integer,
  flag_hash text -- Hidden
);
-- 1. ACADEMIC & FACULTY
create table faculty_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users, -- If faculty have login
  name text not null,
  role text, -- 'Professor', 'HOD', 'Assistant'
  department text,
  specialization text[], -- ['AI', 'Cybersecurity']
  is_available boolean default false,
  current_location text, -- 'Cabin 304', 'Lab 2'
  office_hours text
);

-- 2. LIBRARY & RESOURCES
create table library_books (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  author text,
  isbn text,
  total_copies int default 1,
  available_copies int default 1,
  location text -- 'Shelf A-12'
);

create table library_loans (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references library_books(id),
  student_id uuid references profiles(id),
  due_date timestamptz not null,
  returned_at timestamptz,
  fine_amount numeric(10,2) default 0.00
);

-- 3. HOSTEL & ISSUES (Enhanced)
create table hostel_issues (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  block text not null,
  room_number text not null,
  category text not null, -- 'Water', 'Electricity', 'WiFi'
  description text,
  photo_url text,
  status text default 'open', -- 'open', 'acknowledged', 'in_progress', 'resolved'
  assigned_to text, -- 'Warden', 'Vendor'
  priority text default 'normal',
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table mess_feedback (
  id uuid default uuid_generate_v4() primary key,
  meal_date date default current_date,
  meal_type text, -- 'Lunch', 'Dinner'
  rating int check (rating >= 1 and rating <= 5),
  hygiene_rating int check (hygiene_rating >= 1 and hygiene_rating <= 5),
  comment text,
  is_verified boolean default false -- Peer verified
);

-- 4. COMMUNITY & TRUTH SHARE
create table truth_posts (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  category text, -- 'Faculty', 'Campus', 'Events'
  is_anonymous boolean default true,
  upvotes int default 0,
  verification_count int default 0, -- "Verified by X students"
  decay_factor numeric(3,2) default 1.0, -- Visibility decay
  created_at timestamptz default now()
);

-- 5. STARTUP INCUBATOR
create table startup_ideas (
  id uuid default uuid_generate_v4() primary key,
  founder_id uuid references profiles(id),
  title text not null,
  description text,
  skills_needed text[], -- ['Frontend', 'Marketing']
  stage text -- 'Idea', 'MVP', 'Growth'
);

-- 6. WALLET
create table wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  amount numeric(10,2) not null,
  type text, -- 'credit', 'debit'
  purpose text, -- 'Canteen', 'Fine', 'Print'
  created_at timestamptz default now()
);
-- Add role to profiles
alter table profiles add column if not exists role text default 'student' check (role in ('student', 'admin', 'faculty'));

-- Policy: Admins can update everything (simplistic version for MVP)
create policy "Admins can update all profiles"
on profiles for update
using (auth.uid() in (select id from profiles where role = 'admin'));

-- Policy: Admins can insert/update classes
create policy "Admins can manage classes"
on classes for all
using (auth.uid() in (select id from profiles where role = 'admin'));

-- Policy: Admins can manage meals
create policy "Admins can manage meals"
on meals for all
using (auth.uid() in (select id from profiles where role = 'admin'));

-- Policy: Admins can manage skills
create policy "Admins can manage skills"
on skills for all
using (auth.uid() in (select id from profiles where role = 'admin'));

-- Create a function to promote a user to admin (for ease of use)
create or replace function make_admin(user_email text)
returns void as $$
begin
  update profiles set role = 'admin' where email = user_email;
end;
$$ language plpgsql security definer;
-- Enable Realtime for specific tables
begin;
  -- Remove them first to avoid errors if they exist (clean slate logic)
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table meals, classes, skills, profiles;
commit;
-- 1. Enable RLS on key tables
alter table profiles enable row level security;
alter table classes enable row level security;
alter table meals enable row level security;
alter table skills enable row level security;

-- 2. POLICIES FOR MEALS
-- Everyone can view meals
create policy "Anyone can view meals"
on meals for select
using (true);

-- Only admins can modify meals (insert, update, delete)
create policy "Admins can modify meals"
on meals for all
using (
  auth.uid() in (select id from profiles where role = 'admin')
);

-- 3. POLICIES FOR CLASSES
-- Everyone can view classes
create policy "Anyone can view classes"
on classes for select
using (true);

-- Only admins can modify classes
create policy "Admins can modify classes"
on classes for all
using (
  auth.uid() in (select id from profiles where role = 'admin')
);

-- 4. POLICIES FOR SKILLS
-- Everyone can view skills
create policy "Anyone can view skills"
on skills for select
using (true);

-- Only admins can modify skills
create policy "Admins can modify skills"
on skills for all
using (
  auth.uid() in (select id from profiles where role = 'admin')
);

-- 5. POLICIES FOR PROFILES
-- Users can view their own profile (and maybe others for peer verify? lets allow auth users to read all for now)
create policy "Authenticated users can view profiles"
on profiles for select
to authenticated
using (true);

-- Users can update their own profile
create policy "Users can update own profile"
on profiles for update
to authenticated
using (auth.uid() = id);

-- Users can insert their own profile (required for sign-up)
create policy "Users can insert own profile"
on profiles for insert
to authenticated
with check (auth.uid() = id);

-- Admins can do everything on profiles
create policy "Admins can manage all profiles"
on profiles for all
using (
  auth.uid() in (select id from profiles where role = 'admin')
);

-- 6. AUTO-PROFILE CREATION (Trigger)
-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'student');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid conflicts on reset
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
-- 1. CLEANUP DUPLICATE POLICIES
drop policy if exists "Admins can update all profiles" on profiles;
drop policy if exists "Admins can manage classes" on classes;
drop policy if exists "Admins can manage meals" on meals;
drop policy if exists "Admins can manage skills" on skills;

-- 2. PROTECT ROLE COLUMN
-- Function to prevent role changes by non-admins
create or replace function public.handle_profile_update()
returns trigger as $$
declare
  is_admin boolean;
begin
  -- If role is being changed
  if new.role is distinct from old.role then
    -- Check if the user making the request is an admin
    select (role = 'admin') into is_admin
    from public.profiles
    where id = auth.uid();

    -- If not admin, raise error (allow if it's the system/service_role which bypasses RLS/Triggers usually, but here we are explicit)
    if is_admin is not true then
      raise exception 'Only administrators can change user roles.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Trigger
drop trigger if exists on_profile_update on profiles;
create trigger on_profile_update
  before update on profiles
  for each row
  execute procedure public.handle_profile_update();
-- 1. DROP EXISTING POLICIES CAUSING RECURSION
drop policy if exists "Admins can manage all profiles" on profiles;
drop policy if exists "Admins can modify meals" on meals;
drop policy if exists "Admins can modify classes" on classes;
drop policy if exists "Admins can modify skills" on skills;

drop policy if exists "Admins can manage meals" on meals;
drop policy if exists "Admins can manage classes" on classes;
drop policy if exists "Admins can manage skills" on skills;

-- 2. CREATE A SECURE FUNCTION TO CHECK ADMIN STATUS (Bypasses RLS to avoid recursion)
create or replace function public.is_admin()
returns boolean as $$
begin
  -- Access profiles directly using security definer to bypass RLS for this specific check
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 3. RE-APPLY POLICIES USING THE FUNCTION
-- Profiles
create policy "Admins can manage all profiles"
on profiles for all
using (public.is_admin());

-- Meals
create policy "Admins can modify meals"
on meals for all
using (public.is_admin());

-- Classes
create policy "Admins can modify classes"
on classes for all
using (public.is_admin());

-- Skills
create policy "Admins can modify skills"
on skills for all
using (public.is_admin());
-- 1. MESSAGES TABLE
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) not null,
  receiver_id uuid references profiles(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 2. ENABLE RLS
alter table messages enable row level security;

-- 3. POLICIES

-- View: Users can see messages they sent OR received
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Users can view their own messages') then
    create policy "Users can view their own messages"
      on messages for select
      using (auth.uid() = sender_id or auth.uid() = receiver_id);
  end if;
end $$;

-- Insert: Users can only send messages from themselves
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Users can send messages') then
    create policy "Users can send messages"
      on messages for insert
      with check (auth.uid() = sender_id);
  end if;
end $$;

-- Update: Users can mark messages sent TO them as read
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Recipients can mark as read') then
    create policy "Recipients can mark as read"
      on messages for update
      using (auth.uid() = receiver_id)
      with check (auth.uid() = receiver_id);
  end if;
end $$;

-- 4. INDEXES
create index if not exists messages_sender_id_idx on messages(sender_id);
create index if not exists messages_receiver_id_idx on messages(receiver_id);
create index if not exists messages_created_at_idx on messages(created_at);
-- 1. Add username to profiles
alter table profiles add column if not exists username text unique;

-- 2. Update existing profiles to have a mock username based on email
update profiles 
set username = split_part(email, '@', 1) 
where username is null;

-- 3. Add Index for search performance
create index if not exists profiles_username_idx on profiles(username);
-- DROP EXISTING (To ensure clean slate)
drop table if exists resources;
drop table if exists faculty;

-- 1. RESOURCES TABLE
create table resources (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text check (type in ('PDF', 'DOCX', 'LINK', 'VIDEO')),
  size text,
  author_name text,
  url text,
  created_at timestamptz default now()
);

-- 2. FACULTY TABLE
create table faculty (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text,
  status text check (status in ('available', 'busy', 'offline')),
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. ENABLE RLS
alter table resources enable row level security;
alter table faculty enable row level security;

-- 4. POLICIES
create policy "Everyone can view resources" on resources for select using (true);
create policy "Everyone can view faculty" on faculty for select using (true);

-- 5. SEED DATA
insert into resources (title, type, size, author_name) values
('Data Structures Notes', 'PDF', '2.4 MB', 'Prof. Sharma'),
('ML Lab Manual v2', 'DOCX', '1.1 MB', 'Dr. Emily'),
('Cybersec Research Paper', 'PDF', '4.5 MB', 'IEEE');

insert into faculty (name, role, status) values
('Dr. Arjun Singh', 'HOD - CSE', 'available'),
('Prof. Neha Gupta', 'AI Specialist', 'busy'),
('Mr. Rahul Verma', 'Cyber Labs', 'available');
-- 1. ENHANCE TICKETS TABLE
alter table tickets add column if not exists department text;

-- 2. ENABLE RLS
alter table tickets enable row level security;
alter table documents enable row level security;

-- 3. POLICIES

-- Tickets: Students see their own, Admins see all (handled by service role or explicit admin policy)
-- For MVP demo, let's allow students to see ALL public governance tickets (like a transparent system), 
-- but only edit their own.
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tickets' and policyname = 'View all tickets') then
    create policy "View all tickets" on tickets for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tickets' and policyname = 'Create tickets') then
    create policy "Create tickets" on tickets for insert with check (auth.uid() = student_id);
  end if;
end $$;

-- Documents: Strictly private
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'View own documents') then
    create policy "View own documents" on documents for select using (auth.uid() = student_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'Upload own documents') then
    create policy "Upload own documents" on documents for insert with check (auth.uid() = student_id);
  end if;
end $$;

-- 4. SEED DATA (Governance)
-- Use ON CONFLICT to make it idempotent, assuming 'id' or a unique constraint exists.
-- Tickets table doesn't have a unique title constraint usually, so we might insert duplicates if we run this often.
-- Ideally we check, but for MVP it's okay, or we can wrap in DO block.
-- Let's just insert for now as it's just data.
insert into tickets (title, description, category, department, status, priority, sla_due_at) values
('Library AC not working', 'Main reading hall AC is down', 'Maintenance', 'Facilities', 'resolved', 'high', now() - interval '2 days'),
('Hostel water pressure', '3rd floor C-block low pressure', 'Maintenance', 'Maintenance', 'in-progress', 'medium', now() + interval '18 hours'),
('Lab computer malfunction', 'PC-04 in AI Lab keeps restarting', 'IT', 'IT Support', 'pending', 'medium', now() + interval '36 hours'),
('Cafeteria hygiene', 'Tables not cleaned regularly', 'Hygiene', 'Health & Safety', 'overdue', 'high', now() - interval '12 hours');

-- 5. SEED DATA (Vault - Mock for demo user if they exist, or just placeholder)
-- Since we can't easily guess a valid student_id in SQL without auth context, we skip seeding specific user documents.
-- Instead, the UI will handle empty state.
-- 1. Add missing RLS policies for tickets
-- Ensure idempotency by dropping existing policies before creating
drop policy if exists "Delete own tickets" on tickets;
create policy "Delete own tickets" on tickets for delete using (auth.uid() = student_id);

drop policy if exists "Update own tickets" on tickets;
create policy "Update own tickets" on tickets for update using (auth.uid() = student_id);

-- 2. Add missing RLS policies for documents (Vault)
drop policy if exists "Delete own documents" on documents;
create policy "Delete own documents" on documents for delete using (auth.uid() = student_id);

-- 3. Enable Realtime for all dynamic tables idempotently
do $$
begin
  -- Add 'tickets' to publication if not present
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'tickets') then
    alter publication supabase_realtime add table tickets;
  end if;

  -- Add 'resources' to publication if not present
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'resources') then
    alter publication supabase_realtime add table resources;
  end if;

  -- Add 'faculty' to publication if not present
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'faculty') then
    alter publication supabase_realtime add table faculty;
  end if;

  -- Add 'documents' to publication if not present
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'documents') then
    alter publication supabase_realtime add table documents;
  end if;
end $$;
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
-- 9. Auto-deduct Inventory Trigger Function
create or replace function accept_order_and_deduct_inventory(p_order_id uuid)
returns void as $$
declare
  v_item record;
  v_recipe_key text;
  v_recipe_qty numeric;
  v_current_inv_qty numeric;
begin
  -- 1. Check if already processing/done
  perform 1 from canteen_orders 
  where id = p_order_id 
  and status not in ('pending', 'rejected', 'cancelled')
  for update; -- Lock row

  if found then
    raise exception 'Order is already being processed or completed';
  end if;

  -- 2. Update Order Status
  update canteen_orders 
  set status = 'preparing', updated_at = now()
  where id = p_order_id;

  -- 3. Loop through items in order
  for v_item in 
    select i.recipe, oi.quantity as order_qty, i.name
    from canteen_order_items oi
    join canteen_items i on oi.item_id = i.id
    where oi.order_id = p_order_id
    and i.recipe is not null
  loop
    -- Loop through recipe keys (inventory item names)
    for v_recipe_key, v_recipe_qty in select * from jsonb_each_text(v_item.recipe)
    loop
      -- Check stock
      select quantity into v_current_inv_qty 
      from canteen_inventory 
      where item_name = v_recipe_key
      for update; -- Lock inventory row

      if not found then
        -- Inventory item missing, maybe just log warning or fail?
        -- For now, let's fail to maintain integrity
        raise exception 'Inventory item % not found for product %', v_recipe_key, v_item.name;
      end if;

      if v_current_inv_qty < (v_recipe_qty::numeric * v_item.order_qty) then
        raise exception 'Insufficient stock for % (Need %, Have %)', v_recipe_key, (v_recipe_qty::numeric * v_item.order_qty), v_current_inv_qty;
      end if;

      -- Deduct
      update canteen_inventory
      set quantity = quantity - (v_recipe_qty::numeric * v_item.order_qty),
          last_updated = now()
      where item_name = v_recipe_key;
    end loop;
  end loop;
end;
$$ language plpgsql security definer;
-- 10. Atomic Order Creation Function
create or replace function create_canteen_order(
  p_user_id uuid,
  p_total_amount numeric,
  p_notes text,
  p_items jsonb -- Array of objects: [{item_id, quantity, price_at_time}]
)
returns uuid as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  -- 1. Create Order
  insert into canteen_orders (user_id, total_amount, notes, status, payment_status)
  values (p_user_id, p_total_amount, p_notes, 'pending', 'pending')
  returning id into v_order_id;

  -- 2. Create Order Items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into canteen_order_items (order_id, item_id, quantity, price_at_time)
    values (
      v_order_id,
      (v_item->>'item_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price_at_time')::numeric
    );
  end loop;

  return v_order_id;
exception
  when others then
    raise exception 'Failed to create order: %', sqlerrm;
end;
$$ language plpgsql security definer;
