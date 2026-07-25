-- =========================================================
-- Fix: "column reference shop_code is ambiguous" when creating a business+shop
--
-- Cause: create_business_with_shop() RETURNS TABLE(... shop_code text),
-- which creates an output variable named shop_code. That name collided
-- with the real shops.shop_code column inside the INSERT ... RETURNING
-- clause, so Postgres couldn't tell which one you meant.
--
-- Fix: qualify the column with the table name (shops.shop_code) so
-- there's no ambiguity. The function's inputs/outputs stay identical,
-- so nothing else in your app needs to change.
-- =========================================================

create or replace function public.create_business_with_shop(p_business_name text, p_shop_name text)
returns table(business_id uuid, shop_id uuid, shop_code text) as $$
declare
  v_business_id uuid;
  v_shop_id uuid;
  v_shop_code text;
begin
  insert into public.businesses(name, owner_id)
    values (p_business_name, auth.uid())
    returning id into v_business_id;

  insert into public.shops(business_id, name)
    values (v_business_id, p_shop_name)
    returning shops.id, shops.shop_code into v_shop_id, v_shop_code;

  insert into public.user_roles(user_id, business_id, role)
    values (auth.uid(), v_business_id, 'Owner');

  return query select v_business_id, v_shop_id, v_shop_code;
end;
$$ language plpgsql security definer;
