-- 목적: 플랫폼별 상세 테이블 추가 (items와 1:1)
-- 전제: public.items, public.platforms, public.regions 존재

-- TikTok 플랫폼이 없으면 추가
insert into public.platforms(code, name)
select 'tiktok', 'TikTok'
where not exists (select 1 from public.platforms where code='tiktok');

-- China 지역이 없으면 추가
insert into public.regions(code, name)
select 'CN', 'China'
where not exists (select 1 from public.regions where code='CN');

-- YouTube Shorts 상세
create table if not exists public.items_youtube (
  item_id bigint primary key references public.items(id) on delete cascade,
  video_id text,            -- 유튜브 videoId
  channel_id text,
  channel_title text,
  duration_seconds int,
  extra jsonb               -- 안긁히는 것 임시 저장
);

-- Instagram Reels 상세
create table if not exists public.items_instagram (
  item_id bigint primary key references public.items(id) on delete cascade,
  ig_media_id text,
  ig_user_id text,
  is_reel boolean,
  music_title text,
  extra jsonb
);

-- TikTok 상세
create table if not exists public.items_tiktok (
  item_id bigint primary key references public.items(id) on delete cascade,
  tt_video_id text,
  tiktok_user_id text,
  digg_count bigint,
  share_count bigint,
  extra jsonb
);

-- 성능을 위한 보조 인덱스 (선택)
create index if not exists idx_items_platform_region_created
  on public.items(platform_id, region_id, created_at desc);

-- PostgREST 캐시 리로드
notify pgrst, 'reload schema';
