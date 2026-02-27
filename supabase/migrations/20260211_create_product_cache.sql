create table if not exists product_cache (
  barcode text primary key,
  payload jsonb not null,
  confidence numeric,
  source text,
  updated_at timestamptz not null default now()
);

create index if not exists product_cache_updated_at_idx
  on product_cache (updated_at);
