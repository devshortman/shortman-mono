-- 기존에 user_profiles 가 이미 있을 때 부족한 SNS 컬럼만 채우기 (Supabase SQL Editor에 그대로 붙여넣기 가능)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS youtube text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS tiktok text;
