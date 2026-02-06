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
