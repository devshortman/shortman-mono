-- 회원 프로필 이미지 (공개 읽기, 본인만 업로드/삭제·같은 폴더만)
-- 객체 경로: {auth.uid}/파일명  (예: 550e8400-e29b-.../photo.jpg)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_authenticated_insert_own_folder" on storage.objects;
create policy "avatars_authenticated_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "avatars_authenticated_update_own_folder" on storage.objects;
create policy "avatars_authenticated_update_own_folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "avatars_authenticated_delete_own_folder" on storage.objects;
create policy "avatars_authenticated_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
