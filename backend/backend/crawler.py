# backend/crawler.py
from __future__ import annotations

import logging
from dataclasses import dataclass, asdict
from typing import Iterable, Optional, Literal, List, Dict, Any
from datetime import datetime, timezone

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from supabase import create_client, Client

# 우리 프로젝트의 통일된 설정/ENV 로딩
from backend.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    LOG_LEVEL,
)

# ---- logging ----
logging.basicConfig(level=getattr(logging, str(LOG_LEVEL).upper(), logging.INFO),
                    format="%(asctime)s %(levelname)s %(message)s")

# ---- Types ----
Region = Literal["korea", "global", "china"]
Platform = Literal["youtube", "instagram", "tiktok"]

@dataclass
class ShortItem:
    platform: Platform
    platform_id: str
    region: Region
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    thumbnail: Optional[str] = None
    source: Optional[str] = None
    description: Optional[str] = None
    likes: Optional[int] = None
    video_url: Optional[str] = None
    published_at: Optional[str] = None  # ISO8601 (UTC 권장)
    extra: Dict[str, Any] | None = None

# ---- Helpers ----
def utc_iso(dt: Optional[datetime] = None) -> str:
    if dt is None:
        dt = datetime.utcnow().replace(tzinfo=timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()

def coerce_int(x: Any) -> Optional[int]:
    if x is None:
        return None
    try:
        return int(x)
    except Exception:
        return None

def validate_item(i: ShortItem) -> ShortItem:
    if i.platform not in ("youtube", "instagram", "tiktok"):
        raise ValueError(f"invalid platform: {i.platform}")
    if i.region not in ("korea", "global", "china"):
        raise ValueError(f"invalid region: {i.region}")
    i.likes = coerce_int(i.likes)
    if i.published_at is None:
        i.published_at = utc_iso()
    return i

# ---- Crawlers (stubs) ----
class BaseCrawler:
    region: Region
    def fetch(self) -> Iterable[ShortItem]:
        raise NotImplementedError

class YouTubeCrawler(BaseCrawler):
    def __init__(self, region: Region, api_key: str | None = None):
        self.region = region
        self.api_key = api_key

    def fetch(self) -> Iterable[ShortItem]:
        # TODO: 실제 API 연동
        logging.warning("YouTubeCrawler is stub; return 0 items (no API wired).")
        if False:
            yield  # 빈 제너레이터 유지
        return

class InstagramCrawler(BaseCrawler):
    def __init__(self, region: Region):
        self.region = region

    def fetch(self) -> Iterable[ShortItem]:
        if False:
            yield
        return

class TikTokCrawler(BaseCrawler):
    def __init__(self, region: Region):
        self.region = region

    def fetch(self) -> Iterable[ShortItem]:
        if False:
            yield
        return

# ---- Supabase Client ----
def get_client() -> Client:
    assert SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ---- Writer ----
_PLATFORM_EXT_TABLE = {
    "youtube": "shorts_youtube",
    "instagram": "shorts_instagram",
    "tiktok": "shorts_tiktok",
}

class SupabaseWriter:
    def __init__(self, sb: Client):
        self.client = sb

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        retry=retry_if_exception_type(Exception),
    )
    def _upsert_common(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # rows: [{"platform":..., "platform_id":..., ...}, ...]
        res = self.client.table("shorts_common").upsert(
            rows, on_conflict="platform,platform_id"
        ).execute()
        # 일부 환경에서 representation이 비어올 수 있어 안전망으로 select 재조회는 호출부에서 처리
        return res.data or []

    def upsert_batch(self, items: List[ShortItem]) -> int:
        if not items:
            return 0

        prepared: List[Dict[str, Any]] = []
        for it in items:
            it = validate_item(it)
            prepared.append({
                "platform": it.platform,
                "platform_id": it.platform_id,
                "region": it.region,
                "author_nickname": it.nickname,
                "author_avatar": it.avatar,
                "thumbnail_url": it.thumbnail,
                "source_url": it.source,
                "description": it.description,
                "likes": it.likes,
                "video_url": it.video_url,
                "published_at": it.published_at,
            })

        data = self._upsert_common(prepared)

        # common_id 매핑 확보
        common_ids: Dict[tuple, int] = {}
        if data:
            for row in data:
                if "platform" in row and "platform_id" in row and "id" in row:
                    common_ids[(row["platform"], row["platform_id"])] = row["id"]
        # representation이 비어온 경우 재조회
        missing = [p for p in prepared if (p["platform"], p["platform_id"]) not in common_ids]
        for p in missing:
            q = (
                self.client.table("shorts_common")
                .select("id")
                .eq("platform", p["platform"])
                .eq("platform_id", p["platform_id"])
                .limit(1)
                .execute()
            )
            if q.data:
                common_ids[(p["platform"], p["platform_id"])] = q.data[0]["id"]

        # 확장 테이블 upsert
        ext_rows: Dict[str, List[Dict[str, Any]]] = {"shorts_youtube": [], "shorts_instagram": [], "shorts_tiktok": []}
        for it in items:
            key = (it.platform, it.platform_id)
            cid = common_ids.get(key)
            if not cid:
                logging.warning("missing common_id for %s", key)
                continue
            ext_rows[_PLATFORM_EXT_TABLE[it.platform]].append(
                {"common_id": cid, "extra": it.extra or {}}
            )

        total = 0
        for table, rows in ext_rows.items():
            if not rows:
                continue
            self.client.table(table).upsert(rows, on_conflict="common_id").execute()
            total += len(rows)

        return total

    def upsert(self, item: ShortItem) -> int:
        # 단건 편의 함수 (기존 인터페이스 유지)
        self.upsert_batch([item])
        # common_id 조회 반환
        q = (
            self.client.table("shorts_common")
            .select("id")
            .eq("platform", item.platform)
            .eq("platform_id", item.platform_id)
            .limit(1)
            .execute()
        )
        return q.data[0]["id"] if q.data else 0

# ---- Runner ----
def run_all(sb: Client):
    writer = SupabaseWriter(sb)
    crawlers: List[BaseCrawler] = [
        # YouTubeCrawler("korea", os.getenv("YOUTUBE_API_KEY")),
        InstagramCrawler("korea"),
        InstagramCrawler("global"),
        TikTokCrawler("korea"),
        TikTokCrawler("global"),
    ]

    # 수집 → 배치 업서트
    batch: List[ShortItem] = []
    for c in crawlers:
        for item in c.fetch():
            batch.append(item)

    total = writer.upsert_batch(batch)
    logging.info("Crawl finished. Upserted %s items.", total)

def seed_demo(sb: Client):
    demo = ShortItem(
        platform="instagram",
        platform_id=f"demo-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
        region="korea",
        nickname="demo_account",
        thumbnail="https://example.com/thumb.jpg",
        source="https://example.com/source",
        description=f"Auto demo @ {utc_iso()}",
        likes=123,
        video_url="https://example.com/video.mp4",
        published_at=utc_iso(),
        extra={"tags": ["kr", "trend"]},
    )
    cid = SupabaseWriter(sb).upsert(demo)
    logging.info("Seeded demo. common_id=%s", cid)

def main():
    sb = get_client()
    run_all(sb)
    # seed_demo(sb)  # 필요 시 테스트

if __name__ == "__main__":
    main()