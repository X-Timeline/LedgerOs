-- =========================================================
-- Add a shop to an EXISTING business (separate from
-- create_business_with_shop, which creates a business + its first shop
-- together and is only meant for first-time signup).
-- =========================================================

create or replace function public.add_shop_to_business(p_business_id uuid, p_shop_name text)
returns table(shop_id uuid, shop_code text) as $$
declare
  v_shop_id uuid;
  v_shop_code text;
begin
  if not public.has_business_access(p_business_id) then
    raise exception 'Not authorized for this business';
  end if;

  insert into public.shops(business_id, name)
    values (p_business_id, p_shop_name)
    returning shops.id, shops.shop_code into v_shop_id, v_shop_code;

  return query select v_shop_id, v_shop_code;
end;
$$ language plpgsql security definer;
