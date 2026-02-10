-- 1. SECURITY HARDENING: Fix search_path for Security Definer functions
-- This prevents malicious users from hijacking function execution path

create or replace function public.handle_new_user()
returns trigger 
security definer 
set search_path = public
language plpgsql 
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'student');
  return new;
end;
$$;

create or replace function public.create_canteen_order(
  p_user_id uuid,
  p_total_amount numeric,
  p_notes text,
  p_items jsonb
) returns uuid 
security definer 
set search_path = public
language plpgsql 
as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  -- Validate input
  if p_total_amount < 0 then
    raise exception 'Total amount cannot be negative';
  end if;

  insert into canteen_orders (user_id, total_amount, notes, status, payment_status)
  values (p_user_id, p_total_amount, p_notes, 'pending', 'pending')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into canteen_order_items (order_id, item_id, quantity, price_at_time)
    values (v_order_id, (v_item->>'item_id')::uuid, (v_item->>'quantity')::integer, (v_item->>'price_at_time')::numeric);
  end loop;
  
  return v_order_id;
end;
$$;

-- 2. SCHEMA FIXES: Ensure columns exist before indexing
do $$
begin
    -- Add category_id to canteen_items if missing
    if not exists (select 1 from information_schema.columns where table_name = 'canteen_items' and column_name = 'category_id') then
        alter table canteen_items add column category_id uuid references canteen_categories(id) on delete set null;
    end if;
end $$;

-- 3. PERFORMANCE: Add missing indexes for RLS policies
-- RLS policies filter by these columns constantly. Indexes are mandatory for performance.

create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_tickets_student_id on tickets(student_id);
create index if not exists idx_canteen_orders_user_id on canteen_orders(user_id);
create index if not exists idx_canteen_order_items_order_id on canteen_order_items(order_id);
create index if not exists idx_canteen_items_category_id on canteen_items(category_id);

-- 4. BUG FIXES: Ensure RLS policies allow Canteen Runner/Admin to work properly

-- Ensure canteen staff can update order status
drop policy if exists "Staff Manage Canteen" on canteen_orders;
create policy "Staff Manage Canteen" on canteen_orders for all using (
  auth.uid() in (select id from profiles where role in ('admin', 'canteen_admin', 'canteen_runner'))
);

-- Ensure canteen admin can manage items (Runner cannot)
drop policy if exists "Staff Manage Canteen Items" on canteen_items;
create policy "Staff Manage Canteen Items" on canteen_items for all using (
  auth.uid() in (select id from profiles where role in ('admin', 'canteen_admin'))
);

-- Ensure everyone can view categories
drop policy if exists "Public Read Canteen Cats" on canteen_categories;
create policy "Public Read Canteen Cats" on canteen_categories for select using (true);
