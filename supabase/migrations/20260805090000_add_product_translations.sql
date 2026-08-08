alter table public.admin_products
  add column if not exists translations jsonb not null default '{}'::jsonb;

comment on column public.admin_products.translations is
  'Localized product copy keyed by vi and en: product_name, short_intro, detail_html.';
