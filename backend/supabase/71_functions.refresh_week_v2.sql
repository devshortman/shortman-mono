-- 목적: 주간 세트 갱신 시 KR/GLOBAL/CN × (NULL = 홈, instagram, youtube_shorts, tiktok) 모두 생성

create or replace function public.refresh_week()
returns void
language plpgsql
security definer
as $$
declare
  y int := extract(isoyear from now())::int;
  w int := extract(week    from now())::int;
  r record;      -- region
  p record;      -- platform (NULL 포함)
  ws record;
begin
  -- 지역: KR, GLOBAL, CN
  for r in
    select id from public.regions where code in ('KR','GLOBAL','CN')
  loop
    -- 플랫폼: NULL(홈), instagram, youtube_shorts, tiktok
    for p in
      select null::bigint as pid
      union all select id from public.platforms where code in ('instagram','youtube_shorts','tiktok')
    loop
      insert into public.weekly_sets(iso_year, iso_week, label, region_id, platform_id)
      select y, w,
             to_char(date_trunc('week', now()), 'YYYY"-W"IW ("MM/DD') || '–' ||
             to_char(date_trunc('week', now()) + interval '6 day', 'MM/DD")'),
             r.id, p.pid
      on conflict (iso_year, iso_week, region_id, platform_id) do nothing;
    end loop;
  end loop;

  -- 랭킹 재구성: 최신순 기반(원하면 좋아요 가중치 등으로 바꿔도 됨)
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

notify pgrst, 'reload schema';