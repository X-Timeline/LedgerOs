-- =========================================================
-- LedgerOS — Stage 2: Products / ProductUnit / PurchaseLot + Costing Engine
-- =========================================================

-- Shared enums used across many tables
create type public.costing_method_enum as enum ('FIFO', 'LIFO', 'WEIGHTED_AVG');
create type public.channel_enum as enum ('CASH', 'BANK');

-- ---------------------------------------------------------
-- Product
-- ---------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  base_unit text not null,
  costing_method public.costing_method_enum not null default 'FIFO',
  created_at timestamptz not null default now()
);

create index idx_products_shop on public.products(shop_id);

-- ---------------------------------------------------------
-- ProductUnit (alternative sell units, e.g. "packet" from a "carton")
-- ---------------------------------------------------------
create table public.product_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  unit_name text not null,
  conversion_to_base numeric not null check (conversion_to_base > 0),
  created_at timestamptz not null default now()
);

create index idx_product_units_product on public.product_units(product_id);

-- ---------------------------------------------------------
-- PurchaseLot (every stock purchase = one batch/lot with its own cost)
-- ---------------------------------------------------------
create table public.purchase_lots (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric not null check (quantity > 0),
  total_cost numeric not null check (total_cost >= 0),
  remaining_quantity numeric not null check (remaining_quantity >= 0),
  purchase_date timestamptz not null default now(),
  channel public.channel_enum not null,
  created_at timestamptz not null default now()
);

create index idx_purchase_lots_product on public.purchase_lots(product_id, purchase_date);
create index idx_purchase_lots_shop on public.purchase_lots(shop_id);

-- remaining_quantity starts equal to quantity on insert
create or replace function public.set_initial_remaining_quantity()
returns trigger as $$
begin
  if new.remaining_quantity is null then
    new.remaining_quantity := new.quantity;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_remaining_quantity
  before insert on public.purchase_lots
  for each row execute function public.set_initial_remaining_quantity();

-- Helper: does the user have access to this product's shop?
create or replace function public.has_product_access(p_product_id uuid)
returns boolean as $$
  select public.has_shop_access(shop_id)
  from public.products where id = p_product_id;
$$ language sql security definer stable;

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
alter table public.products enable row level security;
alter table public.product_units enable row level security;
alter table public.purchase_lots enable row level security;

create policy "products_access" on public.products
  for all using (public.has_shop_access(shop_id))
  with check (public.has_shop_access(shop_id));

create policy "product_units_access" on public.product_units
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

create policy "purchase_lots_access" on public.purchase_lots
  for all using (public.has_shop_access(shop_id))
  with check (public.has_shop_access(shop_id));

-- ---------------------------------------------------------
-- THE COSTING ENGINE
-- Works out which lot(s) a sale should draw stock from, and the correct
-- cost, based on the product's costing_method (FIFO / LIFO / WEIGHTED_AVG).
--
-- This is NOT called directly by the frontend. Stage 3's Sale-creation
-- logic calls this on the server, so nobody can fake the cost or profit.
-- ---------------------------------------------------------
create or replace function public.consume_inventory(
  p_shop_id uuid,
  p_product_id uuid,
  p_quantity_base numeric
)
returns jsonb as $$
declare
  v_method public.costing_method_enum;
  v_remaining_needed numeric := p_quantity_base;
  v_lot record;
  v_take numeric;
  v_unit_cost numeric;
  v_avg_unit_cost numeric;
  v_results jsonb := '[]'::jsonb;
begin
  if not public.has_shop_access(p_shop_id) then
    raise exception 'Not authorized for this shop';
  end if;

  if p_quantity_base <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select costing_method into v_method
  from public.products
  where id = p_product_id and shop_id = p_shop_id;

  if v_method is null then
    raise exception 'Product not found in this shop';
  end if;

  if v_method = 'WEIGHTED_AVG' then
    select coalesce(sum(total_cost * remaining_quantity / nullif(quantity, 0)) / nullif(sum(remaining_quantity), 0), 0)
    into v_avg_unit_cost
    from public.purchase_lots
    where product_id = p_product_id and remaining_quantity > 0;

    if v_avg_unit_cost is null or v_avg_unit_cost = 0 then
      raise exception 'No stock available for this product';
    end if;

    for v_lot in
      select * from public.purchase_lots
      where product_id = p_product_id and remaining_quantity > 0
      order by purchase_date asc
      for update
    loop
      exit when v_remaining_needed <= 0;
      v_take := least(v_lot.remaining_quantity, v_remaining_needed);

      update public.purchase_lots
        set remaining_quantity = remaining_quantity - v_take
        where id = v_lot.id;

      v_results := v_results || jsonb_build_object(
        'lotId', v_lot.id,
        'quantity', v_take,
        'unitCost', v_avg_unit_cost,
        'cost', round(v_take * v_avg_unit_cost, 2)
      );

      v_remaining_needed := v_remaining_needed - v_take;
    end loop;

  elsif v_method = 'LIFO' then
    for v_lot in
      select * from public.purchase_lots
      where product_id = p_product_id and remaining_quantity > 0
      order by purchase_date desc
      for update
    loop
      exit when v_remaining_needed <= 0;
      v_take := least(v_lot.remaining_quantity, v_remaining_needed);
      v_unit_cost := v_lot.total_cost / nullif(v_lot.quantity, 0);

      update public.purchase_lots
        set remaining_quantity = remaining_quantity - v_take
        where id = v_lot.id;

      v_results := v_results || jsonb_build_object(
        'lotId', v_lot.id,
        'quantity', v_take,
        'unitCost', v_unit_cost,
        'cost', round(v_take * v_unit_cost, 2)
      );

      v_remaining_needed := v_remaining_needed - v_take;
    end loop;

  else
    -- FIFO (default)
    for v_lot in
      select * from public.purchase_lots
      where product_id = p_product_id and remaining_quantity > 0
      order by purchase_date asc
      for update
    loop
      exit when v_remaining_needed <= 0;
      v_take := least(v_lot.remaining_quantity, v_remaining_needed);
      v_unit_cost := v_lot.total_cost / nullif(v_lot.quantity, 0);

      update public.purchase_lots
        set remaining_quantity = remaining_quantity - v_take
        where id = v_lot.id;

      v_results := v_results || jsonb_build_object(
        'lotId', v_lot.id,
        'quantity', v_take,
        'unitCost', v_unit_cost,
        'cost', round(v_take * v_unit_cost, 2)
      );

      v_remaining_needed := v_remaining_needed - v_take;
    end loop;
  end if;

  if v_remaining_needed > 0 then
    raise exception 'Not enough stock: missing % units', v_remaining_needed;
  end if;

  return v_results;
end;
$$ language plpgsql security definer;
