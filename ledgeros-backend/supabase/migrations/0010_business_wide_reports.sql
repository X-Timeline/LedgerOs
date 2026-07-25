-- =========================================================
-- Fills in the missing business-wide (All Shops) reports:
-- Trading Account and Balance Sheet. Cash Book and P&L already
-- existed as get_business_cash_book / get_business_profit_and_loss.
-- =========================================================

create or replace function public.get_business_trading_account(p_business_id uuid, p_start timestamptz, p_end timestamptz)
returns jsonb as $$
declare
  v_total_sales numeric;
  v_total_cogs numeric;
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

  return jsonb_build_object(
    'totalSales', v_total_sales,
    'totalCOGS', v_total_cogs,
    'grossProfit', v_total_sales - v_total_cogs
  );
end;
$$ language plpgsql security definer;

create or replace function public.get_business_balance_sheet(p_business_id uuid, p_as_of timestamptz)
returns jsonb as $$
declare
  v_shop record;
  v_cash numeric := 0;
  v_bank numeric := 0;
  v_inventory_value numeric := 0;
  v_customer_debt numeric := 0;
  v_supplier_balance numeric := 0;
  v_shop_bs jsonb;
begin
  if not public.has_business_access(p_business_id) then
    raise exception 'Not authorized for this business';
  end if;

  for v_shop in select id from public.shops where business_id = p_business_id loop
    v_shop_bs := public.get_balance_sheet(v_shop.id, p_as_of);
    v_cash := v_cash + (v_shop_bs->>'cash')::numeric;
    v_bank := v_bank + (v_shop_bs->>'bank')::numeric;
    v_inventory_value := v_inventory_value + (v_shop_bs->>'inventoryValue')::numeric;
    v_customer_debt := v_customer_debt + (v_shop_bs->>'customerDebtOwed')::numeric;
    v_supplier_balance := v_supplier_balance + (v_shop_bs->>'supplierBalanceOwed')::numeric;
  end loop;

  return jsonb_build_object(
    'cash', v_cash,
    'bank', v_bank,
    'inventoryValue', v_inventory_value,
    'customerDebtOwed', v_customer_debt,
    'supplierBalanceOwed', v_supplier_balance,
    'assets', v_cash + v_bank + v_inventory_value + v_customer_debt,
    'liabilities', v_supplier_balance,
    'equity', (v_cash + v_bank + v_inventory_value + v_customer_debt) - v_supplier_balance
  );
end;
$$ language plpgsql security definer;
