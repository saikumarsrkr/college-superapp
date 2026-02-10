-- 1. FIX FUNCTION LOGIC: Explicit existence check and locking
create or replace function public.accept_order_and_deduct_inventory(p_order_id uuid)
returns void 
security definer
set search_path = public
language plpgsql 
as $$
declare
  v_item record;
  v_recipe_key text;
  v_recipe_qty numeric;
  v_current_inv_qty numeric;
  v_status text;
begin
  -- 1. Check existence and lock row
  select status into v_status
  from canteen_orders 
  where id = p_order_id 
  for update; 

  if not found then
    raise exception 'Order not found';
  end if;

  if v_status not in ('pending', 'rejected', 'cancelled') then
    raise exception 'Order is already being processed or completed';
  end if;

  -- 2. Update Order Status
  update canteen_orders 
  set status = 'preparing', updated_at = now()
  where id = p_order_id;

  -- 3. Loop through items in order
  for v_item in 
    select i.recipe, oi.quantity as order_qty, i.name
    from canteen_order_items oi
    join canteen_items i on oi.item_id = i.id
    where oi.order_id = p_order_id
    and i.recipe is not null
  loop
    -- Loop through recipe keys (inventory item names)
    if v_item.recipe is not null then
        for v_recipe_key, v_recipe_qty in select key, value::numeric from jsonb_each_text(v_item.recipe)
        loop
          -- Check stock
          select quantity into v_current_inv_qty 
          from canteen_inventory 
          where item_name = v_recipe_key
          for update; 

          if not found then
            -- Skip missing items but maybe log?
            continue; 
          end if;

          if v_current_inv_qty < (v_recipe_qty * v_item.order_qty) then
            raise exception 'Insufficient stock for % (Need %, Have %)', v_recipe_key, (v_recipe_qty * v_item.order_qty), v_current_inv_qty;
          end if;

          -- Deduct
          update canteen_inventory
          set quantity = quantity - (v_recipe_qty * v_item.order_qty),
              last_updated = now()
          where item_name = v_recipe_key;
        end loop;
    end if;
  end loop;
end;
$$;

-- 2. FIX RLS: Add explicit WITH CHECK clauses
drop policy if exists "Staff Manage Canteen" on canteen_orders;
create policy "Staff Manage Canteen" on canteen_orders for all 
using (auth.uid() in (select id from profiles where role in ('admin', 'canteen_admin', 'canteen_runner')))
with check (auth.uid() in (select id from profiles where role in ('admin', 'canteen_admin', 'canteen_runner')));

drop policy if exists "Staff Manage Canteen Items" on canteen_items;
create policy "Staff Manage Canteen Items" on canteen_items for all 
using (auth.uid() in (select id from profiles where role in ('admin', 'canteen_admin')))
with check (auth.uid() in (select id from profiles where role in ('admin', 'canteen_admin')));
