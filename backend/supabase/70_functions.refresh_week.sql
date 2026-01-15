-- 70_functions.refresh_week.sql
-- 목적: 이번 주 기준 weekly_sets 업서트, weekly_items 1..20 재구성
create or replace function public.refresh_week()
returns void
language plpgsql
security definer
as $$
declare
  y int := extract(isoyear from now())::int;
  w int := extract(week    from now())::int;
  instagram_id bigint;
  ws record;
begin
  select id into instagram_id from public.platforms where code='instagram';
  insert into public.weekly_sets(iso_year, iso_week, label, region_id, platform_id)
  select y, w,
         to_char(date_trunc('week', now()), 'YYYY"-W"IW ("MM/DD') || '–' ||
         to_char(date_trunc('week', now()) + interval '6 day', 'MM/DD")') as label,
         r.id, p.pid
  from public.regions r
  cross join (values (null::bigint), (instagram_id)) p(pid)
  on conflict (iso_year, iso_week, region_id, platform_id) do nothing;
  for ws in select id, region_id, platform_id from public.weekly_sets where iso_year=y and iso_week=w loop
    delete from public.weekly_items where weekly_set_id = ws.id;
    insert into public.weekly_items(weekly_set_id, item_id, rank)
    select ws.id, id, rn
    from (
      select i.id, row_number() over (order by i.created_at desc) as rn
      from public.items i
      where i.region_id = ws.region_id
        and (ws.platform_id is null or i.platform_id = ws.platform_id)
      order by i.created_at desc
      limit 20
    ) t
    order by rn;
  end loop;
end;
$$;
