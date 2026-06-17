-- User-owned product inventory (linked to Supabase Auth users by email/id)

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  category text not null,
  purchase_date timestamptz,
  expiration_date timestamptz not null,
  opened_date timestamptz,
  pao_months integer,
  location text,
  barcode text,
  photo_url text,
  usage_count integer default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on products (user_id);
create index if not exists products_expiration_date_idx on products (expiration_date);
create index if not exists products_user_created_at_idx on products (user_id, created_at desc);

alter table products enable row level security;

create policy "Users can view own products"
  on products for select
  using (auth.uid() = user_id);

create policy "Users can insert own products"
  on products for insert
  with check (auth.uid() = user_id);

create policy "Users can update own products"
  on products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own products"
  on products for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh on edits
create or replace function set_products_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_products_updated_at();
