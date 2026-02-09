-- 1. Add missing RLS policies for tickets
-- Ensure idempotency by dropping existing policies before creating
drop policy if exists "Delete own tickets" on tickets;
create policy "Delete own tickets" on tickets for delete using (auth.uid() = student_id);

drop policy if exists "Update own tickets" on tickets;
create policy "Update own tickets" on tickets for update using (auth.uid() = student_id);

-- 2. Add missing RLS policies for documents (Vault)
drop policy if exists "Delete own documents" on documents;
create policy "Delete own documents" on documents for delete using (auth.uid() = student_id);

-- 3. Enable Realtime for all dynamic tables idempotently
do $$
begin
  -- Add 'tickets' to publication if not present
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'tickets') then
    alter publication supabase_realtime add table tickets;
  end if;

  -- Add 'resources' to publication if not present
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'resources') then
    alter publication supabase_realtime add table resources;
  end if;

  -- Add 'faculty' to publication if not present
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'faculty') then
    alter publication supabase_realtime add table faculty;
  end if;

  -- Add 'documents' to publication if not present
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'documents') then
    alter publication supabase_realtime add table documents;
  end if;
end $$;
