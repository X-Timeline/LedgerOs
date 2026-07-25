-- =========================================================
-- Part A: Fixed-amount discounts on sales
-- Part B: Sales Returns & Purchase Returns
-- =========================================================

-- ---------------------------------------------------------
-- A) Discounts
-- ---------------------------------------------------------
alter table public.sales add column if not exists discount_amount numeric not null default 0 check (discount_amount >= 0);

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

    v_base_qty := v_quantity * v_conversion;
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

-- ---------------------------------------------------------
-- B) Sales Returns
-- A return restocks the EXACT original lots the sale drew from
-- (proportionally), and reverses the revenue/cost/profit and,
-- for credit sales, reduces what the customer owes.
-- ---------------------------------------------------------
create table public.sale_returns (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sale_line_id uuid not null references public.sale_lines(id) on delete cascade,
  quantity_returned numeric not null check (quantity_returned > 0),
  amount_returned numeric not null,
  cogs_returned numeric not null,
  restocked_lots jsonb not null default '[]'::jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index idx_sale_returns_line on public.sale_returns(sale_line_id);
create index idx_sale_returns_shop on public.sale_returns(shop_id, created_at);

alter table public.sale_returns enable row level security;
create policy "sale_returns_select" on public.sale_returns
  for select using (public.has_shop_access(shop_id));
create policy "sale_returns_insert" on public.sale_returns
  for insert with check (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager','Cashier'));

create or replace function public.create_sale_return(
  p_sale_line_id uuid,
  p_quantity_returned numeric,
  p_reason text default null
)
returns uuid as $$
declare
  v_line record;
  v_sale record;
  v_already_returned numeric;
  v_returnable numeric;
  v_proportion numeric;
  v_amount_returned numeric;
  v_cogs_returned numeric;
  v_restocked jsonb := '[]'::jsonb;
  v_lot jsonb;
  v_restock_qty numeric;
  v_return_id uuid;
begin
  select * into v_line from public.sale_lines where id = p_sale_line_id;
  if v_line is null then
    raise exception 'Sale line not found';
  end if;

  select * into v_sale from public.sales where id = v_line.sale_id;

  if not public.has_shop_access(v_sale.shop_id) then
    raise exception 'Not authorized for this shop';
  end if;
  if public.user_role_in_shop(v_sale.shop_id) not in ('Owner','Admin','Manager','Cashier') then
    raise exception 'Your role is not allowed to process returns';
  end if;

  select coalesce(sum(quantity_returned), 0) into v_already_returned
  from public.sale_returns where sale_line_id = p_sale_line_id;

  v_returnable := v_line.quantity - v_already_returned;
  if p_quantity_returned <= 0 or p_quantity_returned > v_returnable then
    raise exception 'Can only return up to % units (already returned: %)', v_returnable, v_already_returned;
  end if;

  v_proportion := p_quantity_returned / v_line.quantity;
  v_amount_returned := round(v_line.unit_price * p_quantity_returned, 2);

  select coalesce(sum((l->>'cost')::numeric), 0) * v_proportion into v_cogs_returned
  from jsonb_array_elements(v_line.lots_costed) l;
  v_cogs_returned := round(v_cogs_returned, 2);

  -- Restock proportionally into the SAME lots this line originally drew from
  for v_lot in select * from jsonb_array_elements(v_line.lots_costed)
  loop
    v_restock_qty := (v_lot->>'quantity')::numeric * v_proportion;

    update public.purchase_lots
      set remaining_quantity = remaining_quantity + v_restock_qty
      where id = (v_lot->>'lotId')::uuid;

    v_restocked := v_restocked || jsonb_build_object(
      'lotId', v_lot->>'lotId',
      'quantityRestocked', v_restock_qty
    );
  end loop;

  insert into public.sale_returns (shop_id, sale_line_id, quantity_returned, amount_returned, cogs_returned, restocked_lots, reason)
  values (v_sale.shop_id, p_sale_line_id, p_quantity_returned, v_amount_returned, v_cogs_returned, v_restocked, p_reason)
  returning id into v_return_id;

  -- Credit sale: reduce what the customer owes by the returned amount
  if v_sale.channel = 'CREDIT' and v_sale.customer_id is not null then
    insert into public.customer_debt_entries (shop_id, customer_id, type, amount)
    values (v_sale.shop_id, v_sale.customer_id, 'PAYMENT', v_amount_returned);
  end if;

  return v_return_id;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------
-- C) Purchase Returns (sending stock back to a supplier)
-- Only reduces stock on hand and logs the cost value returned.
-- Note: this does NOT automatically create a cash refund or adjust a
-- supplier balance, since PurchaseLot isn't linked to a specific
-- Supplier in the schema. Record that side manually via Supplier
-- Balance Entries if the purchase was on credit.
-- ---------------------------------------------------------
create table public.purchase_returns (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  purchase_lot_id uuid not null references public.purchase_lots(id),
  quantity_returned numeric not null check (quantity_returned > 0),
  amount_returned numeric not null,
  reason text,
  created_at timestamptz not null default now()
);
create index idx_purchase_returns_lot on public.purchase_returns(purchase_lot_id);
create index idx_purchase_returns_shop on public.purchase_returns(shop_id, created_at);

alter table public.purchase_returns enable row level security;
create policy "purchase_returns_select" on public.purchase_returns
  for select using (public.has_shop_access(shop_id));
create policy "purchase_returns_insert" on public.purchase_returns
  for insert with check (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager'));

create or replace function public.create_purchase_return(
  p_purchase_lot_id uuid,
  p_quantity_returned numeric,
  p_reason text default null
)
returns uuid as $$
declare
  v_lot record;
  v_unit_cost numeric;
  v_amount_returned numeric;
  v_return_id uuid;
begin
  select * into v_lot from public.purchase_lots where id = p_purchase_lot_id;
  if v_lot is null then
    raise exception 'Purchase lot not found';
  end if;

  if not public.has_shop_access(v_lot.shop_id) then
    raise exception 'Not authorized for this shop';
  end if;
  if public.user_role_in_shop(v_lot.shop_id) not in ('Owner','Admin','Manager') then
    raise exception 'Your role is not allowed to process purchase returns';
  end if;

  if p_quantity_returned <= 0 or p_quantity_returned > v_lot.remaining_quantity then
    raise exception 'Can only return up to % units currently in stock from this batch', v_lot.remaining_quantity;
  end if;

  v_unit_cost := v_lot.total_cost / nullif(v_lot.quantity, 0);
  v_amount_returned := round(v_unit_cost * p_quantity_returned, 2);

  update public.purchase_lots
    set remaining_quantity = remaining_quantity - p_quantity_returned
    where id = p_purchase_lot_id;

  insert into public.purchase_returns (shop_id, purchase_lot_id, quantity_returned, amount_returned, reason)
  values (v_lot.shop_id, p_purchase_lot_id, p_quantity_returned, v_amount_returned, p_reason)
  returning id into v_return_id;

  return v_return_id;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------
-- D) Make reports return-aware: Trading Account and P&L now net out
-- returns processed within the same date range (returns count against
-- the period they happen in, not the original sale's period).
-- ---------------------------------------------------------
create or replace function public.get_trading_account(p_shop_id uuid, p_start timestamptz, p_end timestamptz)
returns jsonb as $$
declare
  v_total_sales numeric;
  v_total_cogs numeric;
  v_returns_amount numeric;
  v_returns_cogs numeric;
begin
  if not public.has_shop_access(p_shop_id) then
    raise exception 'Not authorized for this shop';
  end if;

  select coalesce(sum(total_amount), 0), coalesce(sum(total_cogs), 0)
  into v_total_sales, v_total_cogs
  from public.sales
  where shop_id = p_shop_id and status = 'COMPLETE' and created_at between p_start and p_end;

  select coalesce(sum(sr.amount_returned), 0), coalesce(sum(sr.cogs_returned), 0)
  into v_returns_amount, v_returns_cogs
  from public.sale_returns sr
  where sr.shop_id = p_shop_id and sr.created_at between p_start and p_end;

  v_total_sales := v_total_sales - v_returns_amount;
  v_total_cogs := v_total_cogs - v_returns_cogs;

  return jsonb_build_object(
    'totalSales', v_total_sales,
    'totalCOGS', v_total_cogs,
    'grossProfit', v_total_sales - v_total_cogs
  );
end;
$$ language plpgsql security definer stable;

create or replace function public.get_business_trading_account(p_business_id uuid, p_start timestamptz, p_end timestamptz)
returns jsonb as $$
declare
  v_total_sales numeric;
  v_total_cogs numeric;
  v_returns_amount numeric;
  v_returns_cogs numeric;
begin
  if not public.has_business_access(p_business_id) then
    raise exception 'Not authorized for this business';
  end if;

  select coalesce(sum(s.total_amount), 0), coalesce(sum(s.total_cogs), 0)
  into v_total_sales, v_total_cogs
  from public.sales s
  join public.shops sh on sh.id = s.shop_id
  where sh.business_id = p_business_id
    and s.status = 'COMPLETE'
    and s.created_at between p_start and p_end;

  select coalesce(sum(sr.amount_returned), 0), coalesce(sum(sr.cogs_returned), 0)
  into v_returns_amount, v_returns_cogs
  from public.sale_returns sr
  join public.shops sh on sh.id = sr.shop_id
  where sh.business_id = p_business_id and sr.created_at between p_start and p_end;

  v_total_sales := v_total_sales - v_returns_amount;
  v_total_cogs := v_total_cogs - v_returns_cogs;

  return jsonb_build_object(
    'totalSales', v_total_sales,
    'totalCOGS', v_total_cogs,
    'grossProfit', v_total_sales - v_total_cogs
  );
end;
$$ language plpgsql security definer;
