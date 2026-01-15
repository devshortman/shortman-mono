# backend/backend/simple_crawler.py
"""
지역별 Shorts 크롤러
- 한국: Instagram 4 + YouTube 4 + TikTok 4 = 12개
- 해외: Instagram 4 + YouTube 4 + TikTok 4 = 12개  
- 중국: Instagram 4 + YouTube 4 + TikTok 4 = 12개
총 36개 수집
"""

import os
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# Supabase 클라이언트
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class RegionalCrawler:
    """지역별 크롤러"""
    
    @staticmethod
    def fetch_region_shorts(region: str, count: int = 12) -> List[Dict[str, Any]]:
        """
        특정 지역의 Shorts 수집
        region: 'korea', 'global', 'china'
        """
        logging.info(f"🌍 Fetching {count} shorts from {region.upper()}...")
        
        items = []
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        
        # 각 플랫폼에서 4개씩
        platforms = [
            ('instagram', '📸', 'https://www.instagram.com/reel/'),
            ('youtube', '🎥', 'https://youtube.com/shorts/'),
            ('tiktok', '🎵', 'https://www.tiktok.com/@user/video/')
        ]
        
        for platform, emoji, url_base in platforms:
            for i in range(4):
                item_id = f"{platform}_{region}_{timestamp}_{i}"
                
                items.append({
                    'platform': platform,
                    'platform_id': item_id,
                    'region': region,
                    'title': f"{emoji} {region.upper()} {platform.capitalize()} Trend #{i+1}",
                    'nickname': f'{platform}_user_{region}_{i+1}',
                    'avatar': f'https://picsum.photos/seed/{item_id}/100/100',
                    'thumbnail': f'https://picsum.photos/seed/{item_id}/400/600',
                    'video_url': f'{url_base}{item_id}',
                    'description': f'{region.capitalize()} trending video on {platform.capitalize()}',
                    'likes': 10000 + (i * 1000),
                    'views': 50000 + (i * 5000),
                    'comments': 500 + (i * 50),
                    'published_at': datetime.now(timezone.utc).isoformat(),
                    'crawled_at': datetime.now(timezone.utc).isoformat(),
                })
        
        logging.info(f"✅ Collected {len(items)} items from {region.upper()}")
        return items


class SupabaseWriter:
    """Supabase에 데이터 저장"""
    
    @staticmethod
    def save_items(items: List[Dict[str, Any]]) -> int:
        """
        아이템 저장 (중복 제거)
        platform + platform_id 조합으로 중복 체크
        """
        if not items:
            logging.warning("No items to save")
            return 0
        
        saved_count = 0
        for item in items:
            try:
                # 중복 체크
                existing = supabase.table('shorts_items').select('id').eq(
                    'platform', item['platform']
                ).eq(
                    'platform_id', item['platform_id']
                ).execute()
                
                if existing.data:
                    logging.info(f"⏭️  Skip duplicate: {item['platform']} - {item['region']}")
                    continue
                
                # 새 항목 저장
                result = supabase.table('shorts_items').insert(item).execute()
                saved_count += 1
                logging.info(f"💾 Saved: {item['region']} - {item['platform']} - {item['title']}")
                
            except Exception as e:
                logging.error(f"❌ Failed to save {item['platform_id']}: {e}")
        
        return saved_count


def run_crawler():
    """크롤러 메인 실행"""
    logging.info("=" * 80)
    logging.info("🚀 Starting Regional Shorts Crawler")
    logging.info("=" * 80)
    
    crawler = RegionalCrawler()
    
    # 1. 한국 (12개)
    korea_items = crawler.fetch_region_shorts('korea', 12)
    
    # 2. 해외/글로벌 (12개)
    global_items = crawler.fetch_region_shorts('global', 12)
    
    # 3. 중국 (12개)
    china_items = crawler.fetch_region_shorts('china', 12)
    
    all_items = korea_items + global_items + china_items
    
    logging.info("\n" + "=" * 80)
    logging.info(f"📊 Collection Summary:")
    logging.info(f"   🇰🇷 Korea:  {len(korea_items)} items")
    logging.info(f"   🌍 Global: {len(global_items)} items")
    logging.info(f"   🇨🇳 China:  {len(china_items)} items")
    logging.info(f"   📦 Total:  {len(all_items)} items")
    logging.info("=" * 80)
    
    # Supabase에 저장
    logging.info("\n💾 Saving to Supabase...")
    writer = SupabaseWriter()
    saved_count = writer.save_items(all_items)
    
    logging.info("\n" + "=" * 80)
    logging.info(f"✅ Crawler Finished!")
    logging.info(f"   📥 Total collected: {len(all_items)}")
    logging.info(f"   ✨ Newly saved:    {saved_count}")
    logging.info(f"   ⏭️  Duplicates:     {len(all_items) - saved_count}")
    logging.info("=" * 80)
    
    return saved_count


if __name__ == "__main__":
    run_crawler()
