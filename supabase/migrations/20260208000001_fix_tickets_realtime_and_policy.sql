-- 1. Add missing RLS policies for tickets
create policy "Delete own tickets" on tickets for delete using (auth.uid() = student_id);
create policy "Update own tickets" on tickets for update using (auth.uid() = student_id);

-- 2. Add missing RLS policies for documents (Vault)
create policy "Delete own documents" on documents for delete using (auth.uid() = student_id);

-- 3. Enable Realtime for all dynamic tables
-- We reconstruct the publication to include everything needed for the "Super App"
alter publication supabase_realtime add table tickets, resources, faculty, documents;
