-- 60_seed.dev.sql
-- 목적: 개발/테스트용 기초 데이터 입력
insert into public.platforms(code, name) values
  ('instagram', 'Instagram Reels'),
  ('youtube_shorts', 'YouTube Shorts')
on conflict (code) do nothing;
insert into public.regions(code, name) values
  ('KR', 'Korea'),
  ('GLOBAL', 'Global')
on conflict (code) do nothing;
-- 샘플 아이템(경로 규칙: thumbs/{slug}.jpg, previews/{slug}.mp4)
insert into public.items(slug, title, platform_id, region_id, href, author, tags, thumb_path, preview_path)
select 'demo-kr-ig-1','KR IG 데모 1',
       (select id from public.platforms where code='instagram'),
       (select id from public.regions where code='KR'),
       'https://instagram.com/p/xxxxx','creator_kr_1','{kr,trend}',
       'thumbs/demo-kr-ig-1.jpg','previews/demo-kr-ig-1.mp4'
where not exists (select 1 from public.items where slug='demo-kr-ig-1');
