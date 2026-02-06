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
