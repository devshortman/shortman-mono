-- 목적: 부족했던 플랫폼/지역 시드 보강
insert into public.platforms(code, name)
select 'tiktok','TikTok'
where not exists (select 1 from public.platforms where code='tiktok');

insert into public.regions(code, name)
select 'CN','China'
where not exists (select 1 from public.regions where code='CN');

notify pgrst, 'reload schema';