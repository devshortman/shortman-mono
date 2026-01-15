-- 10_tables.core.sql
-- 목적: 핵심 테이블(플랫폼/지역/아이템/주간세트/주간랭킹) 생성
create table if not exists public.platforms(
  id bigserial primary key,
  code text unique not null,   -- 'instagram','youtube_shorts'
  name text not null
);
create table if not exists public.regions(
  id bigserial primary key,
  code text unique not null,   -- 'KR','GLOBAL'
  name text not null
);
create table if not exists public.items(
  id bigserial primary key,
  slug text unique not null,   -- 내부 식별자
  title text not null,
  platform_id bigint references public.platforms(id),
  region_id  bigint references public.regions(id),
  href text,                   -- 원문 링크
  author text,                 -- 계정/채널
  tags text[],                 -- {kr,trend}
  thumb_path text,             -- thumbs/{slug}.jpg
  preview_path text,           -- previews/{slug}.mp4
  created_at timestamptz default now()
);
create table if not exists public.weekly_sets(
  id bigserial primary key,
  iso_year int not null,
  iso_week int not null,
  label text not null,         -- '2025-W38 (09/15–09/21)'
  region_id bigint references public.regions(id),
  platform_id bigint references public.platforms(id), -- 홈 전용이면 NULL
  created_at timestamptz default now(),
  unique(iso_year, iso_week, region_id, platform_id)
);
create table if not exists public.weekly_items(
  id bigserial primary key,
  weekly_set_id bigint references public.weekly_sets(id) on delete cascade,
  item_id bigint references public.items(id),
  rank int check (rank between 1 and 100),
  unique(weekly_set_id, rank),
  unique(weekly_set_id, item_id)
);
create index if not exists items_created_at_idx on public.items (created_at desc);
create index if not exists weekly_items_rank_idx on public.weekly_items (weekly_set_id, rank);
