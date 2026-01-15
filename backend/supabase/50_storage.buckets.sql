-- 50_storage.buckets.sql
-- 목적: thumbs(공개) / previews(비공개) 버킷과 접근 정책
insert into storage.buckets (id, name, public)
values ('thumbs', 'thumbs', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('previews', 'previews', false)
on conflict (id) do nothing;
-- thumbs: 공개 읽기 (정적 이미지)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'thumbs public read'
  ) then
    create policy "thumbs public read"
      on storage.objects for select
      using (bucket_id = 'thumbs');
  end if;
end$$;
-- previews: 기본 비공개(서명 URL로만 접근)
