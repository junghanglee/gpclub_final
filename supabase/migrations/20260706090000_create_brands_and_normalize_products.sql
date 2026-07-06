create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  slug text not null,
  name text not null,
  description text,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_key_not_blank check (btrim(key) <> ''),
  constraint brands_slug_not_blank check (btrim(slug) <> ''),
  constraint brands_name_not_blank check (btrim(name) <> '')
);

create unique index if not exists brands_key_unique_idx on public.brands (key);
create unique index if not exists brands_slug_unique_idx on public.brands (slug);
create index if not exists brands_public_sort_idx
  on public.brands (published, sort_order, name);

alter table public.brands enable row level security;

drop policy if exists "Public can view published brands" on public.brands;
create policy "Public can view published brands"
  on public.brands
  for select
  to anon, authenticated
  using (published = true);

drop policy if exists "Admins can view all brands" on public.brands;
create policy "Admins can view all brands"
  on public.brands
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can insert brands" on public.brands;
create policy "Admins can insert brands"
  on public.brands
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update brands" on public.brands;
create policy "Admins can update brands"
  on public.brands
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete brands" on public.brands;
create policy "Admins can delete brands"
  on public.brands
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create or replace function public.set_brands_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_brands_updated_at on public.brands;
create trigger set_brands_updated_at
before update on public.brands
for each row execute function public.set_brands_updated_at();

insert into public.brands (key, slug, name, description, published, sort_order)
values
  ('jmsolution', 'jmsolution', 'JMsolution', 'K-beauty skincare and sheet mask portfolio.', true, 10),
  ('jmella', 'jmella', 'JMELLA', 'Perfume body and hair care portfolio.', true, 20),
  ('gpclub', 'gpclub', 'GPCLUB', 'GPCLUB curated B2B product sets.', true, 30),
  ('unknown-brand', 'unknown-brand', 'Unknown Brand', 'Fallback brand for repaired legacy product rows.', false, 999)
on conflict (key) do update
set slug = excluded.slug,
    name = excluded.name,
    description = excluded.description,
    published = excluded.published,
    sort_order = excluded.sort_order;

alter table public.admin_products
  add column if not exists brand_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admin_products_brand_id_fkey'
      and conrelid = 'public.admin_products'::regclass
  ) then
    alter table public.admin_products
      add constraint admin_products_brand_id_fkey
      foreign key (brand_id)
      references public.brands(id)
      on update cascade
      on delete restrict;
  end if;
end;
$$;

with normalized_products as (
  select
    id,
    case
      when regexp_replace(lower(btrim(brand_name)), '[^a-z0-9]+', '', 'g') = 'jmsolution' then 'jmsolution'
      when regexp_replace(lower(btrim(brand_name)), '[^a-z0-9]+', '', 'g') = 'jmella' then 'jmella'
      when regexp_replace(lower(btrim(brand_name)), '[^a-z0-9]+', '', 'g') = 'gpclub' then 'gpclub'
      else 'unknown-brand'
    end as brand_key
  from public.admin_products
), matched_brands as (
  select normalized_products.id, brands.id as brand_id
  from normalized_products
  join public.brands on brands.key = normalized_products.brand_key
)
update public.admin_products as product
set brand_id = matched_brands.brand_id
from matched_brands
where product.id = matched_brands.id
  and product.brand_id is distinct from matched_brands.brand_id;

update public.admin_products as product
set brand_name = brand.name
from public.brands as brand
where product.brand_id = brand.id
  and product.brand_name is distinct from brand.name;

do $$
begin
  if exists (select 1 from public.admin_products where brand_id is null) then
    raise exception 'Cannot enforce admin_products.brand_id not null: unbackfilled rows remain';
  end if;

  alter table public.admin_products
    alter column brand_id set not null;
end;
$$;

create index if not exists admin_products_brand_id_idx
  on public.admin_products (brand_id);

create index if not exists admin_products_public_brand_sort_idx
  on public.admin_products (published, brand_id, sort_order desc, created_at desc);

create or replace function public.sync_admin_product_brand_name()
returns trigger
language plpgsql
as $$
declare
  brand_display_name text;
begin
  if new.brand_id is not null then
    select name into brand_display_name
    from public.brands
    where id = new.brand_id;

    if brand_display_name is null then
      raise exception 'Brand % does not exist', new.brand_id;
    end if;

    new.brand_name = brand_display_name;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_admin_product_brand_name on public.admin_products;
create trigger sync_admin_product_brand_name
before insert or update of brand_id, brand_name on public.admin_products
for each row execute function public.sync_admin_product_brand_name();

create or replace function public.sync_product_brand_names_after_brand_update()
returns trigger
language plpgsql
as $$
begin
  if old.name is distinct from new.name then
    update public.admin_products
    set brand_name = new.name
    where brand_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_product_brand_names_after_brand_update on public.brands;
create trigger sync_product_brand_names_after_brand_update
after update of name on public.brands
for each row execute function public.sync_product_brand_names_after_brand_update();
