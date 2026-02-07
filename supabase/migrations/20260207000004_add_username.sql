-- 1. Add username to profiles
alter table profiles add column if not exists username text unique;

-- 2. Update existing profiles to have a mock username based on email
update profiles 
set username = split_part(email, '@', 1) 
where username is null;

-- 3. Add Index for search performance
create index if not exists profiles_username_idx on profiles(username);
