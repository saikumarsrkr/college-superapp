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
