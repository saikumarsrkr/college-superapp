-- 10. Atomic Order Creation Function
create or replace function create_canteen_order(
  p_user_id uuid,
  p_total_amount numeric,
  p_notes text,
  p_items jsonb -- Array of objects: [{item_id, quantity, price_at_time}]
)
returns uuid as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  -- 1. Create Order
  insert into canteen_orders (user_id, total_amount, notes, status, payment_status)
  values (p_user_id, p_total_amount, p_notes, 'pending', 'pending')
  returning id into v_order_id;

  -- 2. Create Order Items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into canteen_order_items (order_id, item_id, quantity, price_at_time)
    values (
      v_order_id,
      (v_item->>'item_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price_at_time')::numeric
    );
  end loop;

  return v_order_id;
exception
  when others then
    raise exception 'Failed to create order: %', sqlerrm;
end;
$$ language plpgsql security definer;
