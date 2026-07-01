create table if not exists public.admin_products (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null default '',
  product_name text not null default '',
  product_type text not null default '',
  short_intro text not null default '',
  detail_html text,
  media jsonb not null default '[]'::jsonb,
  conditions jsonb not null default '[]'::jsonb,
  cover_image_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  is_new boolean not null default false,
  is_popular boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_products enable row level security;

drop policy if exists "Public can view published admin products" on public.admin_products;
create policy "Public can view published admin products"
  on public.admin_products
  for select
  using (published = true or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can insert admin products" on public.admin_products;
create policy "Admins can insert admin products"
  on public.admin_products
  for insert
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update admin products" on public.admin_products;
create policy "Admins can update admin products"
  on public.admin_products
  for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete admin products" on public.admin_products;
create policy "Admins can delete admin products"
  on public.admin_products
  for delete
  using (public.has_role(auth.uid(), 'admin'));

create index if not exists admin_products_public_sort_idx
  on public.admin_products (published, sort_order desc, created_at desc);

create or replace function public.set_admin_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_admin_products_updated_at on public.admin_products;
create trigger set_admin_products_updated_at
before update on public.admin_products
for each row execute function public.set_admin_products_updated_at();
