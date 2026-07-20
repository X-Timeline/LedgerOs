-- =========================================================
-- LedgerOS — Stage 1: Business / Shop / User / UserRole + Auth
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Role enum
-- ---------------------------------------------------------
create type public.user_role_enum as enum ('Owner','Admin','Manager','Cashier','Accountant');

-- ---------------------------------------------------------
-- Profiles (extends auth.users — this is your "User" table)
-- ---------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text unique not null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- Business (tenant root)
-- ---------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id),
  currency text not null default 'NGN',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Shop (sub-tenant)
-- ---------------------------------------------------------
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  shop_code text not null unique,
  created_at timestamptz not null default now()
);

-- Auto-generate a unique shop join code on insert
create or replace function public.generate_shop_code()
returns text as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substr(md5(random()::text), 1, 6));
    select exists(select 1 from public.shops where shop_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$ language plpgsql;

create or replace function public.set_shop_code()
returns trigger as $$
begin
  if new.shop_code is null then
    new.shop_code := public.generate_shop_code();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_shop_code
  before insert on public.shops
  for each row execute function public.set_shop_code();

-- ---------------------------------------------------------
-- UserRole (join table)
-- Exactly one of business_id / shop_id must be set:
--   business_id set  -> Owner/Admin, business-wide (sees all shops)
--   shop_id set      -> Manager/Cashier/Accountant, scoped to one shop
-- ---------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  role public.user_role_enum not null,
  created_at timestamptz not null default now(),
  constraint one_scope_only check (
    (business_id is not null and shop_id is null) or
    (business_id is null and shop_id is not null)
  )
);

-- A user can only hold one role per business, and one role per shop
create unique index uq_user_business_role on public.user_roles(user_id, business_id) where business_id is not null;
create unique index uq_user_shop_role on public.user_roles(user_id, shop_id) where shop_id is not null;

create index idx_user_roles_user on public.user_roles(user_id);
create index idx_shops_business on public.shops(business_id);

-- ---------------------------------------------------------
-- Access-check helpers (security definer -> bypass RLS recursion)
-- ---------------------------------------------------------
create or replace function public.has_business_access(p_business_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and business_id = p_business_id
  );
$$ language sql security definer stable;

create or replace function public.has_shop_access(p_shop_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.shops s on s.id = p_shop_id
    where ur.user_id = auth.uid()
      and (ur.shop_id = p_shop_id or ur.business_id = s.business_id)
  );
$$ language sql security definer stable;

-- ---------------------------------------------------------
-- Signup flow RPCs
-- ---------------------------------------------------------

-- Owner: creates Business + first Shop, gets Owner role
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
    returning id, shop_code into v_shop_id, v_shop_code;

  insert into public.user_roles(user_id, business_id, role)
    values (auth.uid(), v_business_id, 'Owner');

  return query select v_business_id, v_shop_id, v_shop_code;
end;
$$ language plpgsql security definer;

-- Staff: joins a shop using its shopCode, gets a shop-scoped role
create or replace function public.join_shop_with_code(p_shop_code text, p_role public.user_role_enum default 'Cashier')
returns uuid as $$
declare
  v_shop_id uuid;
begin
  if p_role = 'Owner' then
    raise exception 'Cannot self-assign Owner role';
  end if;

  select id into v_shop_id from public.shops where shop_code = upper(p_shop_code);
  if v_shop_id is null then
    raise exception 'Invalid shop code';
  end if;

  insert into public.user_roles(user_id, shop_id, role)
    values (auth.uid(), v_shop_id, p_role)
  on conflict (user_id, shop_id) where shop_id is not null do nothing;

  return v_shop_id;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.shops enable row level security;
alter table public.user_roles enable row level security;

-- Profiles: users can see/update only themselves
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Businesses: visible to owner, or anyone with business-wide access
create policy "businesses_select" on public.businesses
  for select using (owner_id = auth.uid() or public.has_business_access(id));
create policy "businesses_update_owner" on public.businesses
  for update using (owner_id = auth.uid());

-- Shops: visible to anyone with business-wide or shop-scoped access
create policy "shops_select" on public.shops
  for select using (public.has_shop_access(id));
create policy "shops_insert_owner_admin" on public.shops
  for insert with check (public.has_business_access(business_id));

-- User roles: users see their own rows; Owner/Admin manage all roles in their business
create policy "user_roles_select_own" on public.user_roles
  for select using (user_id = auth.uid());
create policy "user_roles_manage_owner_admin" on public.user_roles
  for all using (
    (business_id is not null and public.has_business_access(business_id))
    or (shop_id is not null and exists(
      select 1 from public.shops s
      where s.id = shop_id and public.has_business_access(s.business_id)
    ))
  );
