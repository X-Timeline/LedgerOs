-- =========================================================
-- LedgerOS — Stage: Fixes found in code review
--
-- 1) create_sale had unit conversion backwards. product_units.conversion_to_base
--    is "how many sell-units make up 1 base-unit" (e.g. packet = 20, meaning
--    1 carton = 20 packets — this matches what the frontend's Add Product form
--    actually collects: "per 1 carton = [20] packets"). Converting a sold
--    quantity back into base units must therefore DIVIDE by conversion_to_base,
--    not multiply. The bug: selling 3 packets was reducing stock as if 60
--    cartons had been sold, instead of 0.15 cartons.
--
-- 2) join_shop_with_code let the caller pass ANY non-Owner role as a function
--    argument — since this is a client-supplied parameter, anyone with a shop
--    code could join as "Manager" or "Accountant" instead of "Cashier". Locked
--    it down to always assign Cashier; role upgrades should go through an
--    Owner/Admin-only path (not built yet — flagging as a follow-up, since the
--    Team.jsx frontend already expects per-invite role assignment, not a
--    single shared code with a client-chosen role).
-- =========================================================

create or replace function public.create_sale(
  p_shop_id uuid,
  p_customer_id uuid,
  p_channel public.sale_channel_enum,
  p_lines jsonb,
  p_status public.sale_status_enum default 'COMPLETE'
)
returns uuid as $$
declare
  v_sale_id uuid;
  v_line jsonb;
  v_product_id uuid;
  v_unit_sold text;
  v_quantity numeric;
  v_unit_price numeric;
  v_conversion numeric;
  v_base_unit text;
  v_base_qty numeric;
  v_lots_costed jsonb;
  v_line_cost numeric;
  v_total_amount numeric := 0;
  v_total_cogs numeric := 0;
begin
  if not public.has_shop_access(p_shop_id) then
    raise exception 'Not authorized for this shop';
  end if;

  if p_channel = 'CREDIT' and p_customer_id is null then
    raise exception 'A customer is required for a credit sale';
  end if;

  insert into public.sales (shop_id, customer_id, channel, status)
  values (p_shop_id, p_customer_id, p_channel, p_status)
  returning id into v_sale_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_product_id := (v_line->>'productId')::uuid;
    v_unit_sold := v_line->>'unitSold';
    v_quantity := (v_line->>'quantity')::numeric;
    v_unit_price := (v_line->>'unitPrice')::numeric;

    select base_unit into v_base_unit from public.products where id = v_product_id;

    if v_unit_sold = v_base_unit then
      v_conversion := 1;
    else
      select conversion_to_base into v_conversion
      from public.product_units
      where product_id = v_product_id and unit_name = v_unit_sold;

      if v_conversion is null then
        raise exception 'Unknown sell unit % for this product', v_unit_sold;
      end if;
    end if;

    -- FIX: was `v_quantity * v_conversion`. conversion_to_base is sell-units
    -- per base-unit (e.g. 20 packets per carton), so converting a sold
    -- quantity of sell-units back to base-units requires dividing.
    v_base_qty := v_quantity / v_conversion;

    v_lots_costed := public.consume_inventory(p_shop_id, v_product_id, v_base_qty);

    select coalesce(sum((l->>'cost')::numeric), 0) into v_line_cost
    from jsonb_array_elements(v_lots_costed) l;

    insert into public.sale_lines (sale_id, product_id, unit_sold, quantity, unit_price, lots_costed)
    values (v_sale_id, v_product_id, v_unit_sold, v_quantity, v_unit_price, v_lots_costed);

    v_total_amount := v_total_amount + (v_quantity * v_unit_price);
    v_total_cogs := v_total_cogs + v_line_cost;
  end loop;

  update public.sales
  set total_amount = v_total_amount,
      total_cogs = v_total_cogs,
      total_profit = v_total_amount - v_total_cogs
  where id = v_sale_id;

  if p_channel = 'CREDIT' then
    insert into public.customer_debt_entries (shop_id, customer_id, type, amount)
    values (p_shop_id, p_customer_id, 'CHARGE', v_total_amount);
  end if;

  return v_sale_id;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------
-- Fix 2: lock join_shop_with_code to always assign Cashier.
-- Drop the old signature (role was a caller-supplied parameter) and
-- replace with a version that takes no role argument at all.
-- ---------------------------------------------------------
drop function if exists public.join_shop_with_code(text, public.user_role_enum);

create or replace function public.join_shop_with_code(p_shop_code text)
returns uuid as $$
declare
  v_shop_id uuid;
begin
  select id into v_shop_id from public.shops where shop_code = upper(p_shop_code);
  if v_shop_id is null then
    raise exception 'Invalid shop code';
  end if;

  insert into public.user_roles(user_id, shop_id, role)
    values (auth.uid(), v_shop_id, 'Cashier')
  on conflict (user_id, shop_id) where shop_id is not null do nothing;

  return v_shop_id;
end;
$$ language plpgsql security definer;
