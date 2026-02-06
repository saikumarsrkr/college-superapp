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
