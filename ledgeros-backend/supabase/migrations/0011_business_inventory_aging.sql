-- =========================================================
-- Fills in the last missing business-wide report: Inventory Aging.
-- Same shape as get_inventory_aging, just across every shop in the business.
-- =========================================================

create or replace function public.get_business_inventory_aging(p_business_id uuid)
returns table(product_id uuid, product_name text, oldest_lot_date timestamptz, days_old numeric, remaining_quantity numeric)
as $$
begin
  if not public.has_business_access(p_business_id) then
    raise exception 'Not authorized for this business';
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
  join public.shops sh on sh.id = pl.shop_id
  where sh.business_id = p_business_id and pl.remaining_quantity > 0
  group by p.id, p.name
  order by min(pl.purchase_date) asc;
end;
$$ language plpgsql security definer;
