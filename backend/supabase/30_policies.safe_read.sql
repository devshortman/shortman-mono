-- 30_policies.safe_read.sql
-- 목적: RLS 활성화 + 공개 SELECT 정책(읽기만 허용)
alter table if exists public.items        enable row level security;
alter table if exists public.weekly_sets  enable row level security;
alter table if exists public.weekly_items enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='items' and policyname='public_select_items'
  ) then
    create policy public_select_items on public.items for select using (true);
  end if;
end$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='weekly_sets' and policyname='public_select_weekly_sets'
  ) then
    create policy public_select_weekly_sets on public.weekly_sets for select using (true);
  end if;
end$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where scheaname='public' and tablename='weekly_items' and policyname='public_select_weekly_items'
  ) then
    create policy public_select_weekly_items on public.weekly_items for select using (true);
  end if;
end$$;
