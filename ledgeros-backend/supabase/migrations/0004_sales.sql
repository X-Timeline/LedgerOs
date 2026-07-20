-- =========================================================
-- LedgerOS — Stage: Sales (Sale / SaleLine) — uses the costing engine
-- =========================================================

create type public.sale_channel_enum as enum ('CASH', 'BANK', 'CREDIT');
create type public.sale_status_enum as enum ('COMPLETE', 'PENDING');

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id),
  total_amount numeric not null default 0,
  total_cogs numeric not null default 0,
  total_profit numeric not null default 0,
  channel public.sale_channel_enum not null,
  status public.sale_status_enum not null default 'COMPLETE',
  created_at timestamptz not null default now()
);
create index idx_sales_shop on public.sales(shop_id, created_at);

create table public.sale_lines (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  unit_sold text not null,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  lots_costed jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_sale_lines_sale on public.sale_lines(sale_id);

alter table public.sales enable row level security;
alter table public.sale_lines enable row level security;

create policy "sales_access" on public.sales
  for all using (public.has_shop_access(shop_id)) with check (public.has_shop_access(shop_id));
create policy "sale_lines_access" on public.sale_lines
  for all using (public.has_shop_access((select shop_id from public.sales where id = sale_id)));

-- ---------------------------------------------------------
-- create_sale RPC
-- p_lines is a jsonb array like:
-- [{"productId": "...", "unitSold": "packet", "quantity": 3, "unitPrice": 1500}]
--
-- This runs the costing engine per line, computes profit on the SERVER
-- (never trusts frontend math), and if channel = CREDIT, automatically
-- creates the customer debt charge too.
-- ---------------------------------------------------------
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

    v_base_qty := v_quantity * v_conversion;

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
