-- =========================================================
-- Default selling price on products + a real audit trail for
-- product changes (so "who changed the price, and when" is answerable).
-- =========================================================

alter table public.products
  add column if not exists default_price numeric check (default_price is null or default_price >= 0);

-- ---------------------------------------------------------
-- Audit log — general purpose (entity/entityId), starting with products.
-- Stores who made the change (denormalized at write time, so viewing
-- history never depends on being able to read someone else's profile).
-- ---------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid,
  user_name text,
  user_email text,
  action text not null, -- INSERT | UPDATE | DELETE
  entity text not null, -- 'product', etc. (more entities can log here later)
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entity on public.audit_logs(entity, entity_id, created_at);
create index idx_audit_logs_shop on public.audit_logs(shop_id, created_at);

alter table public.audit_logs enable row level security;

-- Read-only for everyone with shop access. No insert/update/delete policy
-- for regular users on purpose — only the trigger function (below) writes
-- to this table, so the log itself can't be edited or deleted by users.
create policy "audit_logs_select" on public.audit_logs
  for select using (public.has_shop_access(shop_id));

-- ---------------------------------------------------------
-- Trigger: logs every insert/update/delete on products automatically
-- ---------------------------------------------------------
create or replace function public.log_product_change()
returns trigger as $$
declare
  v_user_name text;
  v_user_email text;
begin
  select name, email into v_user_name, v_user_email
  from public.profiles where id = auth.uid();

  insert into public.audit_logs (shop_id, user_id, user_name, user_email, action, entity, entity_id, before, after)
  values (
    coalesce(new.shop_id, old.shop_id),
    auth.uid(),
    v_user_name,
    v_user_email,
    TG_OP,
    'product',
    coalesce(new.id, old.id),
    case when TG_OP = 'INSERT' then null else to_jsonb(old) end,
    case when TG_OP = 'DELETE' then null else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_product_change on public.products;
create trigger trg_log_product_change
  after insert or update or delete on public.products
  for each row execute function public.log_product_change();
