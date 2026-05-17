-- 사용자 프로필 (일반 회원 마이페이지 · 어드민 목록 공용)
-- Supabase Dashboard → SQL Editor에서 적용 후, RLS로 본인만 읽기/쓰기

CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    nickname text,
    avatar text,
    youtube text,
    instagram text,
    tiktok text,
    is_blocked boolean NOT NULL DEFAULT false,
    block_reason text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 이미 존재하던 user_profiles 테이블은 CREATE 로 컬럼이 자동 추가되지 않음 → 아래 ALTER 만 다시 실행해도 됨 (멱등)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS youtube text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS tiktok text;

CREATE OR REPLACE FUNCTION public.set_user_profiles_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_user_profiles_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles (created_at DESC);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own profile" ON public.user_profiles;
CREATE POLICY "Users select own profile"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.user_profiles;
CREATE POLICY "Users insert own profile"
    ON public.user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_profiles IS '일반 회원 프로필(닉네임·SNS). service_role은 RLS 우회.';
