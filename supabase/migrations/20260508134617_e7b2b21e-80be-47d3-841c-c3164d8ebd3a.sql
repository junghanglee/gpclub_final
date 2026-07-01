
-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- B2B Inquiries
create table public.b2b_inquiries (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  position text not null,
  city text not null,
  channel text not null,
  monthly_volume text not null,
  brands text,
  name text not null,
  email text not null,
  phone text not null,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table public.b2b_inquiries enable row level security;

create policy "Anyone can submit inquiry" on public.b2b_inquiries`r`n  for insert to anon, authenticated with check (true);
create policy "Admins read inquiries" on public.b2b_inquiries
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update inquiries" on public.b2b_inquiries
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete inquiries" on public.b2b_inquiries
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create index b2b_inquiries_created_at_idx on public.b2b_inquiries (created_at desc);
