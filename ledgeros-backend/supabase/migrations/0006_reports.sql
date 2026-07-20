-- =========================================================
-- LedgerOS — Stage: Reports (all computed live, nothing stored/duplicated)
-- =========================================================

-- ---------------------------------------------------------
-- Cash Book: money in/out split by CASH vs BANK, for one shop
-- ---------------------------------------------------------
create or replace function public.get_cash_book(p_shop_id uuid, p_start timestamptz, p_end timestamptz)
returns jsonb as $$
declare
  v_cash_in numeric := 0;
  v_cash_out numeric := 0;
  v_bank_in numeric := 0;
  v_bank_out numeric := 0;
begin
  if not public.has_shop_access(p_shop_id) then
    raise exception 'Not authorized for this shop';
  end if;

  -- Capital injections / withdrawals
  select coalesce(sum(case when direction = 'IN' and channel = 'CASH' then amount else 0 end), 0),
         coalesce(sum(case when direction = 'OUT' and channel = 'CASH' then amount else 0 end), 0),
         coalesce(sum(case when direction = 'IN' and channel = 'BANK' then amount else 0 end), 0),
         coalesce(sum(case when direction = 'OUT' and channel = 'BANK' then amount else 0 end), 0)
  into v_cash_in, v_cash_out, v_bank_in, v_bank_out
  from public.capital_entries
  where shop_id = p_shop_id and date between p_start and p_end;

  -- Sales (cash/bank only — CREDIT sales don't move cash until paid)
  v_cash_in := v_cash_in + coalesce((
    select sum(total_amount) from public.sales
    where shop_id = p_shop_id and channel = 'CASH' and status = 'COMPLETE'
      and created_at between p_start and p_end), 0);
  v_bank_in := v_bank_in + coalesce((
    select sum(total_amount) from public.sales
    where shop_id = p_shop_id and channel = 'BANK' and status = 'COMPLETE'
      and created_at between p_start and p_end), 0);

  -- Customer debt payments coming in
  v_cash_in := v_cash_in + coalesce((
    select sum(amount) from public.customer_debt_entries
    where shop_id = p_shop_id and type = 'PAYMENT' and channel = 'CASH'
      and date between p_start and p_end), 0);
  v_bank_in := v_bank_in + coalesce((
    select sum(amount) from public.customer_debt_entries
    where shop_id = p_shop_id and type = 'PAYMENT' and channel = 'BANK'
      and date between p_start and p_end), 0);

  -- Purchases (stock bought = cash/bank out)
  v_cash_out := v_cash_out + coalesce((
    select sum(total_cost) from public.purchase_lots
    where shop_id = p_shop_id and channel = 'CASH'
      and purchase_date between p_start and p_end), 0);
  v_bank_out := v_bank_out + coalesce((
    select sum(total_cost) from public.purchase_lots
    where shop_id = p_shop_id and channel = 'BANK'
      and purchase_date between p_start and p_end), 0);

  -- Supplier payments going out
  v_cash_out := v_cash_out + coalesce((
    select sum(amount) from public.supplier_balance_entries
    where shop_id = p_shop_id and type = 'PAYMENT' and channel = 'CASH'
      and date between p_start and p_end), 0);
  v_bank_out := v_bank_out + coalesce((
    select sum(amount) from public.supplier_balance_entries
    where shop_id = p_shop_id and type = 'PAYMENT' and channel = 'BANK'
      and date between p_start and p_end), 0);

  -- Expenses
  v_cash_out := v_cash_out + coalesce((
    select sum(amount) from public.expenses
    where shop_id = p_shop_id and channel = 'CASH'
      and date between p_start and p_end), 0);
  v_bank_out := v_bank_out + coalesce((
    select sum(amount) from public.expenses
    where shop_id = p_shop_id and channel = 'BANK'
      and date between p_start and p_end), 0);

  -- Cash <-> Bank transfers (net to zero overall, but shift between the two)
  select
    v_cash_in + coalesce(sum(case when direction = 'BANK_TO_CASH' then amount else 0 end), 0),
    v_cash_out + coalesce(sum(case when direction = 'CASH_TO_BANK' then amount else 0 end), 0),
    v_bank_in + coalesce(sum(case when direction = 'CASH_TO_BANK' then amount else 0 end), 0),
    v_bank_out + coalesce(sum(case when direction = 'BANK_TO_CASH' then amount else 0 end), 0)
  into v_cash_in, v_cash_out, v_bank_in, v_bank_out
  from public.cash_bank_transfers
  where shop_id = p_shop_id and date between p_start and p_end;

  return jsonb_build_object(
    'cash', jsonb_build_object('in', v_cash_in, 'out', v_cash_out, 'net', v_cash_in - v_cash_out),
    'bank', jsonb_build_object('in', v_bank_in, 'out', v_bank_out, 'net', v_bank_in - v_bank_out)
  );
end;
$$ language plpgsql security definer stable;

-- ---------------------------------------------------------
-- Trading Account (Gross Profit): Sales - COGS
-- ---------------------------------------------------------
create or replace function public.get_trading_account(p_shop_id uuid, p_start timestamptz, p_end timestamptz)
returns jsonb as $$
declare
  v_total_sales numeric;
  v_total_cogs numeric;
begin
  if not public.has_shop_access(p_shop_id) then
    raise exception 'Not authorized for this shop';
  end if;

  select coalesce(sum(total_amount), 0), coalesce(sum(total_cogs), 0)
  into v_total_sales, v_total_cogs
  from public.sales
  where shop_id = p_shop_id and status = 'COMPLETE' and created_at between p_start and p_end;

  return jsonb_build_object(
    'totalSales', v_total_sales,
    'totalCOGS', v_total_cogs,
    'grossProfit', v_total_sales - v_total_cogs
  );
end;
$$ language plpgsql security definer stable;

-- ---------------------------------------------------------
-- Profit & Loss (Net Profit): Gross Profit - Expenses
-- ---------------------------------------------------------
create or replace function public.get_profit_and_loss(p_shop_id uuid, p_start timestamptz, p_end timestamptz)
returns jsonb as $$
declare
  v_trading jsonb;
  v_gross_profit numeric;
  v_total_expenses numeric;
begin
  v_trading := public.get_trading_account(p_shop_id, p_start, p_end);
  v_gross_profit := (v_trading->>'grossProfit')::numeric;

  select coalesce(sum(amount), 0) into v_total_expenses
  from public.expenses
  where shop_id = p_shop_id and date between p_start and p_end;

  return jsonb_build_object(
    'grossProfit', v_gross_profit,
    'totalExpenses', v_total_expenses,
    'netProfit', v_gross_profit - v_total_expenses
  );
end;
$$ language plpgsql security definer stable;

-- ---------------------------------------------------------
-- Balance Sheet (point-in-time snapshot, as of a given date)
-- ---------------------------------------------------------
create or replace function public.get_balance_sheet(p_shop_id uuid, p_as_of timestamptz)
returns jsonb as $$
declare
  v_cash_book jsonb;
  v_cash numeric;
  v_bank numeric;
  v_inventory_value numeric;
  v_customer_debt numeric;
  v_supplier_balance numeric;
  v_assets numeric;
  v_liabilities numeric;
begin
  if not public.has_shop_access(p_shop_id) then
    raise exception 'Not authorized for this shop';
  end if;

  v_cash_book := public.get_cash_book(p_shop_id, '-infinity'::timestamptz, p_as_of);
  v_cash := (v_cash_book->'cash'->>'net')::numeric;
  v_bank := (v_cash_book->'bank'->>'net')::numeric;

  select coalesce(sum(remaining_quantity * (total_cost / nullif(quantity, 0))), 0)
  into v_inventory_value
  from public.purchase_lots
  where shop_id = p_shop_id and purchase_date <= p_as_of;

  select coalesce(sum(case when type = 'CHARGE' then amount else -amount end), 0)
  into v_customer_debt
  from public.customer_debt_entries
  where shop_id = p_shop_id and date <= p_as_of;

  select coalesce(sum(case when type = 'CHARGE' then amount else -amount end), 0)
  into v_supplier_balance
  from public.supplier_balance_entries
  where shop_id = p_shop_id and date <= p_as_of;

  v_assets := v_cash + v_bank + v_inventory_value + v_customer_debt;
  v_liabilities := v_supplier_balance;

  return jsonb_build_object(
    'cash', v_cash,
    'bank', v_bank,
    'inventoryValue', v_inventory_value,
    'customerDebtOwed', v_customer_debt,
    'supplierBalanceOwed', v_supplier_balance,
    'assets', v_assets,
    'liabilities', v_liabilities,
    'equity', v_assets - v_liabilities
  );
end;
$$ language plpgsql security definer stable;

-- ---------------------------------------------------------
-- Inventory Aging: per product, age of oldest unconsumed lot
-- ---------------------------------------------------------
create or replace function public.get_inventory_aging(p_shop_id uuid)
returns table(product_id uuid, product_name text, oldest_lot_date timestamptz, days_old numeric, remaining_quantity numeric)
as $$
begin
  if not public.has_shop_access(p_shop_id) then
    raise exception 'Not authorized for this shop';
  end if;

  return query
  select
    p.id,
    p.name,
    min(pl.purchase_date),
    extract(day from now() - min(pl.purchase_date)),
    sum(pl.remaining_quantity)
  from public.purchase_lots pl
  join public.products p on p.id = pl.product_id
  where pl.shop_id = p_shop_id and pl.remaining_quantity > 0
  group by p.id, p.name
  order by min(pl.purchase_date) asc;
end;
$$ language plpgsql security definer stable;

-- ---------------------------------------------------------
-- Business-level (aggregate across all shops in a business)
-- Same reports, just summed. Cash book + P&L shown here; the same
-- "loop over shop_ids" pattern applies to any other report if needed.
-- ---------------------------------------------------------
create or replace function public.get_business_cash_book(p_business_id uuid, p_start timestamptz, p_end timestamptz)
returns jsonb as $$
declare
  v_shop record;
  v_cash_in numeric := 0; v_cash_out numeric := 0;
  v_bank_in numeric := 0; v_bank_out numeric := 0;
  v_shop_report jsonb;
begin
  if not public.has_business_access(p_business_id) then
    raise exception 'Not authorized for this business';
  end if;

  for v_shop in select id from public.shops where business_id = p_business_id loop
    v_shop_report := public.get_cash_book(v_shop.id, p_start, p_end);
    v_cash_in := v_cash_in + (v_shop_report->'cash'->>'in')::numeric;
    v_cash_out := v_cash_out + (v_shop_report->'cash'->>'out')::numeric;
    v_bank_in := v_bank_in + (v_shop_report->'bank'->>'in')::numeric;
    v_bank_out := v_bank_out + (v_shop_report->'bank'->>'out')::numeric;
  end loop;

  return jsonb_build_object(
    'cash', jsonb_build_object('in', v_cash_in, 'out', v_cash_out, 'net', v_cash_in - v_cash_out),
    'bank', jsonb_build_object('in', v_bank_in, 'out', v_bank_out, 'net', v_bank_in - v_bank_out)
  );
end;
$$ language plpgsql security definer;

create or replace function public.get_business_profit_and_loss(p_business_id uuid, p_start timestamptz, p_end timestamptz)
returns jsonb as $$
declare
  v_shop record;
  v_gross_profit numeric := 0;
  v_total_expenses numeric := 0;
  v_shop_report jsonb;
begin
  if not public.has_business_access(p_business_id) then
    raise exception 'Not authorized for this business';
  end if;

  for v_shop in select id from public.shops where business_id = p_business_id loop
    v_shop_report := public.get_profit_and_loss(v_shop.id, p_start, p_end);
    v_gross_profit := v_gross_profit + (v_shop_report->>'grossProfit')::numeric;
    v_total_expenses := v_total_expenses + (v_shop_report->>'totalExpenses')::numeric;
  end loop;

  return jsonb_build_object(
    'grossProfit', v_gross_profit,
    'totalExpenses', v_total_expenses,
    'netProfit', v_gross_profit - v_total_expenses
  );
end;
$$ language plpgsql security definer;
