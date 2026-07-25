-- =========================================================
-- Fix: unit-conversion regression reintroduced by 0014.
--
-- 0014 redefined create_sale() to add discount support, but the
-- replacement was written from a copy of the function that predates the
-- 0007 fix. It has `v_base_qty := v_quantity * v_conversion` again.
--
-- conversion_to_base is sell-units-per-base-unit (e.g. packet = 20,
-- meaning 1 carton = 20 packets - this is what the frontend's Add
-- Product form actually collects: "per 1 carton = [20] packets").
-- Converting a SOLD quantity of sell-units back into base units must
-- DIVIDE by conversion_to_base, not multiply. With the bug back,
-- selling 3 packets decrements stock as if 60 cartons were sold
-- instead of 0.15.
--
-- This migration is identical to 0014's version of create_sale in every
-- other respect (discount support, role check, credit-sale handling) -
-- only the one line is corrected. Everything from 0014 (discount_amount
-- column, sale_returns/purchase_returns tables and RPCs, the
-- return-aware get_trading_account) is untouched and still correct.
-- =========================================================

create or replace function public.create_sale(
  p_shop_id uuid,
  p_customer_id uuid,
  p_channel public.sale_channel_enum,
  p_lines jsonb,
  p_status public.sale_status_enum default 'COMPLETE',
  p_discount_amount numeric default 0
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

  if public.user_role_in_shop(p_shop_id) not in ('Owner','Admin','Manager','Cashier') then
    raise exception 'Your role is not allowed to record sales';
  end if;

  if p_channel = 'CREDIT' and p_customer_id is null then
    raise exception 'A customer is required for a credit sale';
  end if;

  if p_discount_amount < 0 then
    raise exception 'Discount cannot be negative';
  end if;

  insert into public.sales (shop_id, customer_id, channel, status, discount_amount)
  values (p_shop_id, p_customer_id, p_channel, p_status, p_discount_amount)
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

    -- FIX: was `v_quantity * v_conversion` again (0014 regression).
    v_base_qty := v_quantity / v_conversion;

    v_lots_costed := public.consume_inventory(p_shop_id, v_product_id, v_base_qty);

    select coalesce(sum((l->>'cost')::numeric), 0) into v_line_cost
    from jsonb_array_elements(v_lots_costed) l;

    insert into public.sale_lines (sale_id, product_id, unit_sold, quantity, unit_price, lots_costed)
    values (v_sale_id, v_product_id, v_unit_sold, v_quantity, v_unit_price, v_lots_costed);

    v_total_amount := v_total_amount + (v_quantity * v_unit_price);
    v_total_cogs := v_total_cogs + v_line_cost;
  end loop;

  if p_discount_amount > v_total_amount then
    raise exception 'Discount cannot be larger than the sale total';
  end if;

  v_total_amount := v_total_amount - p_discount_amount;

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
