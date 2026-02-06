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
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_profile_update on profiles;
create trigger on_profile_update
  before update on profiles
  for each row
  execute procedure public.handle_profile_update();
