-- 1. ENHANCE TICKETS TABLE
alter table tickets add column if not exists department text;

-- 2. ENABLE RLS
alter table tickets enable row level security;
alter table documents enable row level security;

-- 3. POLICIES

-- Tickets: Students see their own, Admins see all (handled by service role or explicit admin policy)
-- For MVP demo, let's allow students to see ALL public governance tickets (like a transparent system), 
-- but only edit their own.
create policy "View all tickets" on tickets for select using (true);
create policy "Create tickets" on tickets for insert with check (auth.uid() = student_id);

-- Documents: Strictly private
create policy "View own documents" on documents for select using (auth.uid() = student_id);
create policy "Upload own documents" on documents for insert with check (auth.uid() = student_id);

-- 4. SEED DATA (Governance)
insert into tickets (title, description, category, department, status, priority, sla_due_at) values
('Library AC not working', 'Main reading hall AC is down', 'Maintenance', 'Facilities', 'resolved', 'high', now() - interval '2 days'),
('Hostel water pressure', '3rd floor C-block low pressure', 'Maintenance', 'Maintenance', 'in-progress', 'medium', now() + interval '18 hours'),
('Lab computer malfunction', 'PC-04 in AI Lab keeps restarting', 'IT', 'IT Support', 'pending', 'medium', now() + interval '36 hours'),
('Cafeteria hygiene', 'Tables not cleaned regularly', 'Hygiene', 'Health & Safety', 'overdue', 'high', now() - interval '12 hours');

-- 5. SEED DATA (Vault - Mock for demo user if they exist, or just placeholder)
-- Since we can't easily guess a valid student_id in SQL without auth context, we skip seeding specific user documents.
-- Instead, the UI will handle empty state.
