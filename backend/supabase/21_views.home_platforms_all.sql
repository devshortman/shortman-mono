-- 목적: 홈/플랫폼별(KR/GLOBAL/CHINA) 주간 랭킹 뷰 확장

-- 홈(플랫폼 NULL) KR / GLOBAL / CHINA
create or replace view public.v_home_week_kr as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='KR')
  and ws.platform_id is null
order by wi.rank asc;

create or replace view public.v_home_week_global as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='GLOBAL')
  and ws.platform_id is null
order by wi.rank asc;

create or replace view public.v_home_week_cn as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='CN')
  and ws.platform_id is null
order by wi.rank asc;

-- Reels(Instagram)
create or replace view public.v_reels_week_kr as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='KR')
  and ws.platform_id = (select id from public.platforms where code='instagram')
order by wi.rank asc;

create or replace view public.v_reels_week_global as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='GLOBAL')
  and ws.platform_id = (select id from public.platforms where code='instagram')
order by wi.rank asc;

create or replace view public.v_reels_week_cn as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='CN')
  and ws.platform_id = (select id from public.platforms where code='instagram')
order by wi.rank asc;

-- Shorts(YouTube)
create or replace view public.v_shorts_week_kr as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='KR')
  and ws.platform_id = (select id from public.platforms where code='youtube_shorts')
order by wi.rank asc;

create or replace view public.v_shorts_week_global as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='GLOBAL')
  and ws.platform_id = (select id from public.platforms where code='youtube_shorts')
order by wi.rank asc;

create or replace view public.v_shorts_week_cn as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='CN')
  and ws.platform_id = (select id from public.platforms where code='youtube_shorts')
order by wi.rank asc;

-- TikTok
create or replace view public.v_tiktok_week_kr as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='KR')
  and ws.platform_id = (select id from public.platforms where code='tiktok')
order by wi.rank asc;

create or replace view public.v_tiktok_week_global as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='GLOBAL')
  and ws.platform_id = (select id from public.platforms where code='tiktok')
order by wi.rank asc;

create or replace view public.v_tiktok_week_cn as
select wi.rank, i.* from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='CN')
  and ws.platform_id = (select id from public.platforms where code='tiktok')
order by wi.rank asc;

notify pgrst, 'reload schema';