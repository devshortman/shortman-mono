import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client

# render.yaml 실행 기준: cd backend/backend && uvicorn app.main:app
# → 실행 위치 backend/backend/ 이므로 config.py는 한 단계 위
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import APP_ENV

# ------------------------------------------------------
# App
# ------------------------------------------------------
app = FastAPI(
    title="short-man backend API",
    version="0.3.0",
    description="Short-man 서비스의 Backend API 문서입니다."
)

# ------------------------------------------------------
# CORS
# ------------------------------------------------------
PROD_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://devshortman.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("APP_ENV") != "prod" else PROD_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# Supabase
# ------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing env keys: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ------------------------------------------------------
# Models
# ------------------------------------------------------
class ShortsItem(BaseModel):
    id: int
    platform: str
    platform_id: str
    region: str
    title: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    thumbnail: Optional[str] = None
    video_url: str
    description: Optional[str] = None
    likes: Optional[int] = 0
    views: Optional[int] = 0
    comments: Optional[int] = 0
    published_at: Optional[str] = None
    crawled_at: Optional[str] = None

class ShortsResponse(BaseModel):
    items: List[ShortsItem]
    count: int

class ShortsRegionalResponse(BaseModel):
    korea: List[ShortsItem]
    global_: List[ShortsItem]
    china: List[ShortsItem]
    total_count: int

class TrendItem(BaseModel):
    id: int
    weekly_set_id: int
    item_id: int
    rank: int

class TrendResponse(BaseModel):
    items: List[TrendItem]
    count: int

# ------------------------------------------------------
# Health
# ------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "env": APP_ENV}

# ------------------------------------------------------
# Shorts - 지역별
# ------------------------------------------------------
@app.get("/api/v1/shorts/regional", response_model=ShortsRegionalResponse,
         summary="지역별 Shorts 조회")
async def get_regional_shorts(
    limit_per_region: int = Query(16, ge=1, le=50)
):
    result = {"korea": [], "global": [], "china": []}
    for region in ["korea", "global", "china"]:
        try:
            resp = (
                supabase.table("shorts_items")
                .select("*")
                .eq("region", region)
                .order("crawled_at", desc=True)
                .limit(limit_per_region)
                .execute()
            )
            if resp.data:
                result[region] = resp.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DB error region={region}: {e}")

    return {
        "korea": result["korea"],
        "global_": result["global"],
        "china": result["china"],
        "total_count": sum(len(v) for v in result.values())
    }

# ------------------------------------------------------
# Shorts - 전체/필터
# ------------------------------------------------------
@app.get("/api/v1/shorts", response_model=ShortsResponse,
         summary="전체 Shorts 조회")
async def get_shorts(
    limit: int = Query(36, ge=1, le=100),
    region: Optional[str] = Query(None),
    platform: Optional[str] = Query(None)
):
    try:
        query = supabase.table("shorts_items").select("*")
        if region:
            query = query.eq("region", region)
        if platform:
            query = query.eq("platform", platform)
        resp = query.order("crawled_at", desc=True).limit(limit).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    data = resp.data or []
    return ShortsResponse(items=data, count=len(data))

# ------------------------------------------------------
# Trends (레거시)
# ------------------------------------------------------
@app.get("/trends", response_model=TrendResponse,
         summary="주간 인기 아이템 조회")
async def trends(limit: int = Query(20, ge=1, le=100)):
    try:
        resp = (
            supabase.table("weekly_items")
            .select("*")
            .order("rank", desc=False)
            .limit(limit)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    data = resp.data or []
    return TrendResponse(items=data, count=len(data))

# ------------------------------------------------------
# Ad - 키워드 기반 크롤링 추가
# ------------------------------------------------------
class AdRequest(BaseModel):
    keyword: str
    region: str = "korea"
    platforms: List[str] = ["youtube", "tiktok", "instagram"]
    max_results: int = 20

class AdResponse(BaseModel):
    keyword: str
    region: str
    total: int

@app.post("/api/v0/ad", response_model=AdResponse, summary="키워드 기반 숏폼 추가")
async def add_ad(req: AdRequest):
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from add_ad import run_ad
        total = run_ad(
            keyword=req.keyword,
            region=req.region,
            platforms=req.platforms,
            max_results=req.max_results,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crawl error: {e}")
    return AdResponse(keyword=req.keyword, region=req.region, total=total)
