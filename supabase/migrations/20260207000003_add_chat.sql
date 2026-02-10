-- 1. MESSAGES TABLE
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
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
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Users can view their own messages') then
    create policy "Users can view their own messages"
      on messages for select
      using (auth.uid() = sender_id or auth.uid() = receiver_id);
  end if;
end $$;

-- Insert: Users can only send messages from themselves
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Users can send messages') then
    create policy "Users can send messages"
      on messages for insert
      with check (auth.uid() = sender_id);
  end if;
end $$;

-- Update: Users can mark messages sent TO them as read
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Recipients can mark as read') then
    create policy "Recipients can mark as read"
      on messages for update
      using (auth.uid() = receiver_id)
      with check (auth.uid() = receiver_id);
  end if;
end $$;

-- 4. INDEXES
create index if not exists messages_sender_id_idx on messages(sender_id);
create index if not exists messages_receiver_id_idx on messages(receiver_id);
create index if not exists messages_created_at_idx on messages(created_at);
