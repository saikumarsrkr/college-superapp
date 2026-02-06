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

-- Admins can do everything on profiles
create policy "Admins can manage all profiles"
on profiles for all
using (
  auth.uid() in (select id from profiles where role = 'admin')
);
