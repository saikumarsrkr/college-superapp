-- 1. FIX SCHEMA: Add category_id to canteen_items if missing
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'canteen_items' and column_name = 'category_id') then
        alter table canteen_items add column category_id uuid references canteen_categories(id) on delete set null;
    end if;
end $$;

-- 2. ADD INDEXES (Idempotent)
create index if not exists idx_canteen_items_category_id on canteen_items(category_id);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_tickets_student_id on tickets(student_id);
create index if not exists idx_canteen_orders_user_id on canteen_orders(user_id);
create index if not exists idx_canteen_order_items_order_id on canteen_order_items(order_id);

-- 3. FIX FUNCTION SECURITY: Add search_path to RPC function
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
begin
  -- 1. Check if already processing/done
  perform 1 from canteen_orders 
  where id = p_order_id 
  and status not in ('pending', 'rejected', 'cancelled')
  for update; -- Lock row

  if found then
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
          for update; -- Lock inventory row

          if not found then
            -- If inventory item doesn't exist, ignore (or could raise warning)
            -- For MVP, strict inventory might be annoying if keys mismatch
            -- raise exception 'Inventory item % not found', v_recipe_key;
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
