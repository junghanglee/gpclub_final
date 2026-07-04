insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-media',
  'event-media',
  true,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads event media" on storage.objects;
create policy "Public reads event media"
on storage.objects for select
using (bucket_id = 'event-media');

drop policy if exists "Admins upload event media" on storage.objects;
create policy "Admins upload event media"
on storage.objects for insert to authenticated
with check (bucket_id = 'event-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update event media" on storage.objects;
create policy "Admins update event media"
on storage.objects for update to authenticated
using (bucket_id = 'event-media' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'event-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete event media" on storage.objects;
create policy "Admins delete event media"
on storage.objects for delete to authenticated
using (bucket_id = 'event-media' and public.has_role(auth.uid(), 'admin'));
