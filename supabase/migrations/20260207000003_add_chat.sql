-- 1. MESSAGES TABLE
create table messages (
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
create policy "Users can view their own messages"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Insert: Users can only send messages from themselves
create policy "Users can send messages"
  on messages for insert
  with check (auth.uid() = sender_id);

-- Update: Users can mark messages sent TO them as read
create policy "Recipients can mark as read"
  on messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- 4. INDEXES
create index messages_sender_id_idx on messages(sender_id);
create index messages_receiver_id_idx on messages(receiver_id);
create index messages_created_at_idx on messages(created_at);
