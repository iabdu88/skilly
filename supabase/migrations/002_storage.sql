-- Create storage buckets
insert into storage.buckets (id, name, public) values ('course-media', 'course-media', true);
insert into storage.buckets (id, name, public) values ('outfits', 'outfits', true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policies
create policy "course-media public read" on storage.objects for select
  using (bucket_id = 'course-media');

create policy "course-media trainer upload" on storage.objects for insert
  with check (bucket_id = 'course-media' and (select role from public.users where id = auth.uid()) = 'trainer');

create policy "outfits public read" on storage.objects for select
  using (bucket_id = 'outfits');

create policy "outfits employee upload" on storage.objects for insert
  with check (bucket_id = 'outfits' and auth.uid() is not null);

create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars own upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);
