-- 20_views.weekly_top.sql
-- 목적: 홈/릴스/숏츠 등 화면에서 바로 쓰는 읽기 전용 뷰
-- 홈: 한국/글로벌(플랫폼 NULL)
create or replace view public.v_home_week_kr as
select wi.rank, i.*
from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='KR')
  and ws.platform_id is null
order by wi.rank asc;
create or replace view public.v_home_week_global as
select wi.rank, i.*
from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='GLOBAL')
  and ws.platform_id is null
order by wi.rank asc;
-- 릴스(Instagram) KR/Global
create or replace view public.v_reels_week_kr as
select wi.rank, i.*
from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='KR')
  and ws.platform_id = (select id from public.platforms where code='instagram')
order by wi.rank asc;
create or replace view public.v_reels_week_global as
select wi.rank, i.*
from public.weekly_sets ws
join public.weekly_items wi on wi.weekly_set_id = ws.id
join public.items i on i.id = wi.item_id
where ws.region_id = (select id from public.regions where code='GLOBAL')
  and ws.platform_id = (select id from public.platforms where code='instagram')
order by wi.rank asc;
-- (선택) 숏츠 뷰 2개 추가 가능: v_shorts_week_kr, v_shorts_week_global
