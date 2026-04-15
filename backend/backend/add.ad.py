from __future__ import annotations

import os
import sys
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Literal, List

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from supabase import create_client, Client

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOG_LEVEL

logging.basicConfig(
    level=getattr(logging, str(LOG_LEVEL).upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(message)s"
)

Region = Literal["korea", "global", "china"]
Platform = Literal["youtube", "instagram", "tiktok"]


@dataclass
class ShortItem:
    platform: Platform
    platform_id: str
    region: Region
    title: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    description: Optional[str] = None
    likes: Optional[int] = None
    views: Optional[int] = None
    comments: Optional[int] = None
    published_at: Optional[str] = None


def safe_int(x) -> Optional[int]:
    try:
        return int(x)
    except Exception:
        return None


# ------------------------------------------------------
# YouTube
# ------------------------------------------------------
class YouTubeAdCrawler:
    BASE = "https://www.googleapis.com/youtube/v3"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def fetch(self, keyword: str, region: Region, max_results: int = 20) -> List[ShortItem]:
        items = []
        try:
            resp = httpx.get(
                f"{self.BASE}/search",
                params={
                    "part": "snippet",
                    "q": keyword,
                    "type": "video",
                    "videoDuration": "short",
                    "maxResults": max_results,
                    "order": "viewCount",
                    "key": self.api_key,
                },
                timeout=15,
            )
            resp.raise_for_status()
        except Exception as e:
            logging.error("YouTube search error keyword=%s: %s", keyword, e)
            return items

        video_ids = []
        for item in resp.json().get("items", []):
            vid = item.get("id", {}).get("videoId")
            if vid:
                video_ids.append(vid)

        if not video_ids:
            return items

        try:
            stats_resp = httpx.get(
                f"{self.BASE}/videos",
                params={
                    "part": "statistics,snippet",
                    "id": ",".join(video_ids),
                    "key": self.api_key,
                },
                timeout=15,
            )
            stats_resp.raise_for_status()
        except Exception as e:
            logging.error("YouTube videos error: %s", e)
            return items

        for item in stats_resp.json().get("items", []):
            vid = item["id"]
            snip = item.get("snippet", {})
            stats = item.get("statistics", {})
            thumb = (
                snip.get("thumbnails", {}).get("high", {}).get("url")
                or snip.get("thumbnails", {}).get("default", {}).get("url")
            )
            items.append(ShortItem(
                platform="youtube",
                platform_id=vid,
                region=region,
                title=snip.get("title", ""),
                nickname=snip.get("channelTitle"),
                thumbnail=thumb,
                video_url=f"https://www.youtube.com/shorts/{vid}",
                description=snip.get("description", "")[:200],
                likes=safe_int(stats.get("likeCount")),
                views=safe_int(stats.get("viewCount")),
                comments=safe_int(stats.get("commentCount")),
                published_at=snip.get("publishedAt"),
            ))

        logging.info("YouTube keyword=%s region=%s fetched %d items", keyword, region, len(items))
        return items


# ------------------------------------------------------
# TikTok (키 없으면 스킵)
# ------------------------------------------------------
class TikTokAdCrawler:
    def __init__(self, api_key: Optional[str]):
        self.api_key = api_key

    def fetch(self, keyword: str, region: Region, max_results: int = 20) -> List[ShortItem]:
        if not self.api_key:
            logging.warning("TIKTOK_API_KEY not set, skipping TikTok")
            return []
        # TODO: TikTok API 연동 (키 발급 후 구현)
        logging.warning("TikTok crawler not yet implemented")
        return []


# ------------------------------------------------------
# Instagram (키 없으면 스킵)
# ------------------------------------------------------
class InstagramAdCrawler:
    def __init__(self, api_key: Optional[str]):
        self.api_key = api_key

    def fetch(self, keyword: str, region: Region, max_results: int = 20) -> List[ShortItem]:
        if not self.api_key:
            logging.warning("INSTAGRAM_API_KEY not set, skipping Instagram")
            return []
        # TODO: Instagram API 연동 (키 발급 후 구현)
        logging.warning("Instagram crawler not yet implemented")
        return []


# ------------------------------------------------------
# Supabase Writer
# ------------------------------------------------------
class SupabaseWriter:
    def __init__(self, sb: Client):
        self.sb = sb

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8), reraise=True)
    def upsert_batch(self, items: List[ShortItem]) -> int:
        if not items:
            return 0
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        rows = [{
            "platform":    it.platform,
            "platform_id": it.platform_id,
            "region":      it.region,
            "title":       it.title or "",
            "nickname":    it.nickname,
            "avatar":      it.avatar,
            "thumbnail":   it.thumbnail,
            "video_url":   it.video_url or "",
            "description": it.description,
            "likes":       it.likes,
            "views":       it.views,
            "comments":    it.comments,
            "published_at": it.published_at,
            "crawled_at":  now,
        } for it in items]
        self.sb.table("shorts_items").upsert(
            rows, on_conflict="platform,platform_id"
        ).execute()
        logging.info("Upserted %d rows to shorts_items", len(rows))
        return len(rows)


# ------------------------------------------------------
# Main entry (키워드 + 지역 + 플랫폼 지정)
# ------------------------------------------------------
def run_ad(
    keyword: str,
    region: Region = "korea",
    platforms: List[Platform] = ["youtube", "tiktok", "instagram"],
    max_results: int = 20,
) -> int:
    youtube_key = os.getenv("YOUTUBE_API_KEY")
    tiktok_key = os.getenv("TIKTOK_API_KEY")
    instagram_key = os.getenv("INSTAGRAM_API_KEY")

    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    writer = SupabaseWriter(sb)

    all_items: List[ShortItem] = []

    if "youtube" in platforms:
        if youtube_key:
            all_items += YouTubeAdCrawler(youtube_key).fetch(keyword, region, max_results)
        else:
            logging.warning("YOUTUBE_API_KEY not set, skipping YouTube")

    if "tiktok" in platforms:
        all_items += TikTokAdCrawler(tiktok_key).fetch(keyword, region, max_results)

    if "instagram" in platforms:
        all_items += InstagramAdCrawler(instagram_key).fetch(keyword, region, max_results)

    total = writer.upsert_batch(all_items)
    logging.info("Ad crawl done. keyword=%s region=%s total=%d", keyword, region, total)
    return total


if __name__ == "__main__":
    # 직접 실행 테스트용
    import sys
    keyword = sys.argv[1] if len(sys.argv) > 1 else "한국 트렌드"
    region = sys.argv[2] if len(sys.argv) > 2 else "korea"
    run_ad(keyword, region)
