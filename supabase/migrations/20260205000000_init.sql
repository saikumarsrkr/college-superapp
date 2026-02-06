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
