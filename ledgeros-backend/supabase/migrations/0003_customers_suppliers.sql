-- =========================================================
-- LedgerOS — Stage: Customers (debtors) & Suppliers (payables)
-- =========================================================

create type public.debt_entry_type_enum as enum ('CHARGE', 'PAYMENT');

-- ---------------------------------------------------------
-- Customer
-- ---------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);
create index idx_customers_shop on public.customers(shop_id);

create table public.customer_debt_entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  type public.debt_entry_type_enum not null,
  amount numeric not null check (amount > 0),
  channel public.channel_enum,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_customer_debt_customer on public.customer_debt_entries(customer_id, date);

-- ---------------------------------------------------------
-- Supplier
-- ---------------------------------------------------------
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);
create index idx_suppliers_shop on public.suppliers(shop_id);

create table public.supplier_balance_entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  type public.debt_entry_type_enum not null,
  amount numeric not null check (amount > 0),
  channel public.channel_enum,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_supplier_balance_supplier on public.supplier_balance_entries(supplier_id, date);

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table public.customers enable row level security;
alter table public.customer_debt_entries enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_balance_entries enable row level security;

create policy "customers_access" on public.customers
  for all using (public.has_shop_access(shop_id)) with check (public.has_shop_access(shop_id));
create policy "customer_debt_access" on public.customer_debt_entries
  for all using (public.has_shop_access(shop_id)) with check (public.has_shop_access(shop_id));
create policy "suppliers_access" on public.suppliers
  for all using (public.has_shop_access(shop_id)) with check (public.has_shop_access(shop_id));
create policy "supplier_balance_access" on public.supplier_balance_entries
  for all using (public.has_shop_access(shop_id)) with check (public.has_shop_access(shop_id));
