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
