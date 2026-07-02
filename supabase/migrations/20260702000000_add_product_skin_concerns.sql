-- Add skin type and concern tags to admin_products so the Gippy AI consultant
-- can recommend products from Supabase instead of the deleted local src/data.
-- Both columns default to an empty array so existing rows keep working.
alter table public.admin_products
  add column if not exists skin_types text[] not null default '{}'::text[];

alter table public.admin_products
  add column if not exists concerns text[] not null default '{}'::text[];

-- Help the chatbot filter by skin type / concern efficiently.
create index if not exists admin_products_skin_types_idx
  on public.admin_products using gin (skin_types)
  where published = true;

create index if not exists admin_products_concerns_idx
  on public.admin_products using gin (concerns)
  where published = true;
