-- =========================================================
-- LedgerOS — Stage: Cash Book (CapitalEntry / CashBankTransfer / Expense)
-- =========================================================

create type public.capital_direction_enum as enum ('IN', 'OUT');
create type public.transfer_direction_enum as enum ('CASH_TO_BANK', 'BANK_TO_CASH');
create type public.expense_category_enum as enum
  ('Fuel', 'Salary', 'Electricity', 'Transport', 'Tax', 'Rent', 'Maintenance', 'Misc');

create table public.capital_entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  direction public.capital_direction_enum not null,
  amount numeric not null check (amount > 0),
  channel public.channel_enum not null,
  note text,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_capital_entries_shop on public.capital_entries(shop_id, date);

create table public.cash_bank_transfers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  direction public.transfer_direction_enum not null,
  amount numeric not null check (amount > 0),
  note text,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_transfers_shop on public.cash_bank_transfers(shop_id, date);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  category public.expense_category_enum not null,
  amount numeric not null check (amount > 0),
  channel public.channel_enum not null,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_expenses_shop on public.expenses(shop_id, date);

alter table public.capital_entries enable row level security;
alter table public.cash_bank_transfers enable row level security;
alter table public.expenses enable row level security;

create policy "capital_entries_access" on public.capital_entries
  for all using (public.has_shop_access(shop_id)) with check (public.has_shop_access(shop_id));
create policy "transfers_access" on public.cash_bank_transfers
  for all using (public.has_shop_access(shop_id)) with check (public.has_shop_access(shop_id));
create policy "expenses_access" on public.expenses
  for all using (public.has_shop_access(shop_id)) with check (public.has_shop_access(shop_id));
