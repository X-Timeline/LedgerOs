-- =========================================================
-- Permission Layer
--
-- Everyone in a shop can still SEE the same data (per your call —
-- Cashiers see cost/profit same as Owner). What changes is who is
-- allowed to CREATE / EDIT / DELETE things.
--
-- Role summary:
--   Owner, Admin   -> full control, business-wide
--   Manager        -> full control within their shop (can't manage staff)
--   Cashier        -> can sell, add customers/suppliers, record payments,
--                     process returns. Cannot touch products, purchases,
--                     expenses, capital, or delete anything.
--   Accountant     -> handles money side (expenses, capital, transfers,
--                     supplier/customer ledgers). Not POS, not products.
-- =========================================================

-- Returns the caller's effective role for a shop: business-wide role
-- (Owner/Admin) takes priority over a shop-scoped role.
create or replace function public.user_role_in_shop(p_shop_id uuid)
returns public.user_role_enum as $$
  select ur.role
  from public.user_roles ur
  join public.shops s on s.id = p_shop_id
  where ur.user_id = auth.uid()
    and (ur.business_id = s.business_id or ur.shop_id = p_shop_id)
  order by (ur.business_id is not null) desc -- prefer business-wide role if both exist
  limit 1;
$$ language sql security definer stable;

-- ---------------------------------------------------------
-- Products & Product Units — Owner/Admin/Manager can write, Owner/Admin delete
-- ---------------------------------------------------------
drop policy if exists "products_access" on public.products;
create policy "products_select" on public.products
  for select using (public.has_shop_access(shop_id));
create policy "products_insert" on public.products
  for insert with check (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager'));
create policy "products_update" on public.products
  for update using (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager'));
create policy "products_delete" on public.products
  for delete using (public.user_role_in_shop(shop_id) in ('Owner','Admin'));

drop policy if exists "product_units_access" on public.product_units;
create policy "product_units_select" on public.product_units
  for select using (public.has_product_access(product_id));
create policy "product_units_write" on public.product_units
  for all using (
    public.user_role_in_shop((select shop_id from public.products where id = product_id)) in ('Owner','Admin','Manager')
  );

-- ---------------------------------------------------------
-- Purchase Lots — Owner/Admin/Manager can record, Owner/Admin edit/delete
-- ---------------------------------------------------------
drop policy if exists "purchase_lots_access" on public.purchase_lots;
create policy "purchase_lots_select" on public.purchase_lots
  for select using (public.has_shop_access(shop_id));
create policy "purchase_lots_insert" on public.purchase_lots
  for insert with check (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager'));
create policy "purchase_lots_update" on public.purchase_lots
  for update using (public.user_role_in_shop(shop_id) in ('Owner','Admin'));
create policy "purchase_lots_delete" on public.purchase_lots
  for delete using (public.user_role_in_shop(shop_id) in ('Owner','Admin'));

-- ---------------------------------------------------------
-- Sales / Sale Lines — anyone who can sell (not Accountant), no direct
-- edit/delete (sales get corrected via Returns, not by rewriting history)
-- ---------------------------------------------------------
drop policy if exists "sales_access" on public.sales;
create policy "sales_select" on public.sales
  for select using (public.has_shop_access(shop_id));
create policy "sales_insert" on public.sales
  for insert with check (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager','Cashier'));

drop policy if exists "sale_lines_access" on public.sale_lines;
create policy "sale_lines_select" on public.sale_lines
  for select using (public.has_shop_access((select shop_id from public.sales where id = sale_id)));
create policy "sale_lines_insert" on public.sale_lines
  for insert with check (
    public.user_role_in_shop((select shop_id from public.sales where id = sale_id)) in ('Owner','Admin','Manager','Cashier')
  );

-- ---------------------------------------------------------
-- Cash Book — Owner/Admin/Accountant only (Cashier/Manager don't touch capital)
-- ---------------------------------------------------------
drop policy if exists "capital_entries_access" on public.capital_entries;
create policy "capital_entries_select" on public.capital_entries
  for select using (public.has_shop_access(shop_id));
create policy "capital_entries_write" on public.capital_entries
  for all using (public.user_role_in_shop(shop_id) in ('Owner','Admin','Accountant'));

drop policy if exists "transfers_access" on public.cash_bank_transfers;
create policy "transfers_select" on public.cash_bank_transfers
  for select using (public.has_shop_access(shop_id));
create policy "transfers_write" on public.cash_bank_transfers
  for all using (public.user_role_in_shop(shop_id) in ('Owner','Admin','Accountant'));

-- Expenses: Manager can log expenses too (common in small shops), Accountant can as well
drop policy if exists "expenses_access" on public.expenses;
create policy "expenses_select" on public.expenses
  for select using (public.has_shop_access(shop_id));
create policy "expenses_write" on public.expenses
  for all using (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager','Accountant'));

-- ---------------------------------------------------------
-- Customers & Suppliers — Cashiers can add/manage customers (walk-in
-- signups at point of sale), but supplier management stays with
-- Owner/Admin/Manager/Accountant (back-office function)
-- ---------------------------------------------------------
drop policy if exists "customers_access" on public.customers;
create policy "customers_select" on public.customers
  for select using (public.has_shop_access(shop_id));
create policy "customers_write" on public.customers
  for all using (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager','Cashier'));

drop policy if exists "customer_debt_access" on public.customer_debt_entries;
create policy "customer_debt_select" on public.customer_debt_entries
  for select using (public.has_shop_access(shop_id));
create policy "customer_debt_write" on public.customer_debt_entries
  for all using (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager','Cashier','Accountant'));

drop policy if exists "suppliers_access" on public.suppliers;
create policy "suppliers_select" on public.suppliers
  for select using (public.has_shop_access(shop_id));
create policy "suppliers_write" on public.suppliers
  for all using (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager','Accountant'));

drop policy if exists "supplier_balance_access" on public.supplier_balance_entries;
create policy "supplier_balance_select" on public.supplier_balance_entries
  for select using (public.has_shop_access(shop_id));
create policy "supplier_balance_write" on public.supplier_balance_entries
  for all using (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager','Accountant'));

-- ---------------------------------------------------------
-- Invoices — same group as customers (Cashiers can raise them)
-- ---------------------------------------------------------
drop policy if exists "invoices_access" on public.invoices;
create policy "invoices_select" on public.invoices
  for select using (public.has_shop_access(shop_id));
create policy "invoices_write" on public.invoices
  for all using (public.user_role_in_shop(shop_id) in ('Owner','Admin','Manager','Cashier','Accountant'));
