create table if not exists demo_products (
  id text primary key,
  name text not null,
  brand text not null,
  category text not null check (category in ('skincare', 'sunscreen', 'makeup', 'haircare', 'fragrance')),
  volume text not null,
  expiration_date date not null,
  production_date date,
  notes text not null,
  demo_photo_uri text,
  barcode text,
  primary_ocr_cues text[] not null default '{}',
  secondary_ocr_cues text[] not null default '{}',
  packaging_color text not null,
  ingredients_summary text not null,
  routine_advice text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists demo_products_barcode_uidx
  on demo_products (barcode)
  where barcode is not null;

create index if not exists demo_products_enabled_sort_idx
  on demo_products (enabled, sort_order);
