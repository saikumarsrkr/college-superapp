-- 9. Auto-deduct Inventory Trigger Function
create or replace function accept_order_and_deduct_inventory(p_order_id uuid)
returns void as $$
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
    for v_recipe_key, v_recipe_qty in select * from jsonb_each_text(v_item.recipe)
    loop
      -- Check stock
      select quantity into v_current_inv_qty 
      from canteen_inventory 
      where item_name = v_recipe_key
      for update; -- Lock inventory row

      if not found then
        -- Inventory item missing, maybe just log warning or fail?
        -- For now, let's fail to maintain integrity
        raise exception 'Inventory item % not found for product %', v_recipe_key, v_item.name;
      end if;

      if v_current_inv_qty < (v_recipe_qty::numeric * v_item.order_qty) then
        raise exception 'Insufficient stock for % (Need %, Have %)', v_recipe_key, (v_recipe_qty::numeric * v_item.order_qty), v_current_inv_qty;
      end if;

      -- Deduct
      update canteen_inventory
      set quantity = quantity - (v_recipe_qty::numeric * v_item.order_qty),
          last_updated = now()
      where item_name = v_recipe_key;
    end loop;
  end loop;
end;
$$ language plpgsql security definer;
