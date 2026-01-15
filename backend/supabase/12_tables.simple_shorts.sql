-- backend/supabase/12_tables.simple_shorts.sql
-- 지역별 Shorts 아이템 저장 테이블

CREATE TABLE IF NOT EXISTS public.shorts_items (
    id BIGSERIAL PRIMARY KEY,
    
    -- 플랫폼 & 식별
    platform VARCHAR(20) NOT NULL,        -- 'instagram', 'youtube', 'tiktok'
    platform_id TEXT NOT NULL,            -- 플랫폼별 고유 ID
    region VARCHAR(20) NOT NULL,          -- 'korea', 'global', 'china'
    
    -- 기본 정보
    title TEXT NOT NULL,
    nickname TEXT,                        -- 채널/계정명
    avatar TEXT,                          -- 프로필 이미지 URL
    thumbnail TEXT,                       -- 썸네일 URL
    video_url TEXT NOT NULL,              -- 영상 URL
    
    -- 메타데이터
    description TEXT,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    
    -- 타임스탬프
    published_at TIMESTAMPTZ,             -- 원본 게시 시간
    crawled_at TIMESTAMPTZ DEFAULT NOW(), -- 크롤링 시간
    
    -- 중복 방지 제약조건
    CONSTRAINT unique_platform_item UNIQUE(platform, platform_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_shorts_platform ON public.shorts_items(platform);
CREATE INDEX IF NOT EXISTS idx_shorts_region ON public.shorts_items(region);
CREATE INDEX IF NOT EXISTS idx_shorts_crawled_at ON public.shorts_items(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_shorts_region_platform ON public.shorts_items(region, platform);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.shorts_items ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 (모든 사용자)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.shorts_items;
CREATE POLICY "Enable read access for all users" ON public.shorts_items
    FOR SELECT
    USING (true);

-- 쓰기 권한 (서비스 롤만)
DROP POLICY IF EXISTS "Enable insert for service role only" ON public.shorts_items;
CREATE POLICY "Enable insert for service role only" ON public.shorts_items
    FOR INSERT
    WITH CHECK (true);

-- 테이블 설명
COMMENT ON TABLE public.shorts_items IS '지역별 Shorts/Reels 아이템 저장 (한국/해외/중국)';
COMMENT ON COLUMN public.shorts_items.region IS '지역 구분: korea, global, china';
COMMENT ON COLUMN public.shorts_items.platform IS '플랫폼: instagram, youtube, tiktok';
