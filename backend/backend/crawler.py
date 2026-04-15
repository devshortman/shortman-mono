from __future__ import annotations

import os
import sys
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Literal, List
from datetime import datetime, timezone, timedelta

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

REGION_QUERY: dict[Region, str] = {
    "korea":  "한국 쇼츠 트렌드",
    "global": "trending shorts",
    "china":  "中国 短视频 热门",
}

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

def utc_iso(dt: Optional[datetime] = None) -> str:
    if dt is None:
        dt = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()

def safe_int(x) -> Optional[int]:
    try:
        return int(x)
    except Exception:
        return None


# ------------------------------------------------------
# YouTube Crawler
# ------------------------------------------------------
class YouTubeCrawler:
    BASE = "https://www.googleapis.com/youtube/v3"

    def __init__(self, region: Region, api_key: str):
        self.region = region
        self.api_key = api_key

    def fetch(self) -> List[ShortItem]:
        query = REGION_QUERY[self.region]
        items = []

        # 최근 7일치만
        published_after = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")

        try:
            resp = httpx.get(
                f"{self.BASE}/search",
                params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "videoDuration": "short",
                    "maxResults": 20,
                    "order": "viewCount",
                    "publishedAfter": published_after,
                    "key": self.api_key,
                },
                timeout=15,
            )
            resp.raise_for_status()
        except Exception as e:
            logging.error("YouTube search error region=%s: %s", self.region, e)
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
                region=self.region,
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

        logging.info("YouTube region=%s fetched %d items", self.region, len(items))
        return items


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
            "crawled_at":  utc_iso(),
        } for it in items]
        self.sb.table("shorts_items").upsert(
            rows, on_conflict="platform,platform_id"
        ).execute()
        logging.info("Upserted %d rows to shorts_items", len(rows))
        return len(rows)


# ------------------------------------------------------
# Runner
# ------------------------------------------------------
def main():
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        logging.error("YOUTUBE_API_KEY not set")
        return

    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    writer = SupabaseWriter(sb)

    total = 0
    for region in ("korea", "global", "china"):
        crawler = YouTubeCrawler(region, api_key)
        items = crawler.fetch()
        total += writer.upsert_batch(items)

    logging.info("Crawl done. Total upserted: %d", total)

if __name__ == "__main__":
    main()
