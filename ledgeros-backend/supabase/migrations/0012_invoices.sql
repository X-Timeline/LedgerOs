-- =========================================================
-- Invoices — a lightweight, standalone bill-tracking feature.
-- (Separate from CustomerDebtEntry, which tracks debt from actual sales.
-- This is for ad-hoc invoices you send out that aren't tied to a POS sale.)
--
-- Safe to run more than once — it checks what already exists first.
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_status_enum') then
    create type public.invoice_status_enum as enum ('PENDING', 'PAID');
  end if;
end
$$;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  amount numeric not null check (amount > 0),
  due_date date not null,
  status public.invoice_status_enum not null default 'PENDING',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoices_shop on public.invoices(shop_id, due_date);

alter table public.invoices enable row level security;

drop policy if exists "invoices_access" on public.invoices;
create policy "invoices_access" on public.invoices
  for all using (public.has_shop_access(shop_id)) with check (public.has_shop_access(shop_id));
