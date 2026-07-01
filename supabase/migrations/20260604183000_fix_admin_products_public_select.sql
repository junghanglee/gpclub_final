drop policy if exists "Public can view published admin products" on public.admin_products;
drop policy if exists "Admins can read admin products" on public.admin_products;

create policy "Public can view published admin products"
  on public.admin_products
  for select
  to anon, authenticated
  using (published = true);

create policy "Admins can read admin products"
  on public.admin_products
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));
