# backend/app/main.py
import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client

from backend.config import APP_ENV

app = FastAPI(
    title="short-man backend API",
    version="0.2.0",
    description="Short-man 서비스의 Backend API 문서입니다."
)

# CORS 설정 (배포용)
ALLOWED_ORIGINS = [
    "https://devshortman.github.io",    # GitHub Pages
    "http://localhost:5173",             # 로컬 개발
    "http://127.0.0.1:5173",             # 로컬 개발 (대체)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,      # 특정 도메인만 허용
    allow_credentials=False,             # 쿠키 사용 안 함 (중요!)
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# Supabase Client 설정
# ------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing Supabase environment keys.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ------------------------------------------------------
# Swagger Response 모델 정의 ⬇⬇⬇
# ------------------------------------------------------

# 기존 Trends 모델
class TrendItem(BaseModel):
    id: int
    weekly_set_id: int
    item_id: int
    rank: int

class TrendResponse(BaseModel):
    items: List[TrendItem]
    count: int

# 새로운 Shorts 모델
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


# ------------------------------------------------------
# Health Check
# ------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "env": APP_ENV}


# ------------------------------------------------------
# Trends (Supabase 연동 + Swagger 모델 적용)
# ------------------------------------------------------
@app.get(
    "/trends",
    response_model=TrendResponse,
    summary="주간 인기 아이템 조회",
    description="Supabase weekly_items 테이블에서 상위 인기 아이템을 조회합니다."
)
async def trends(
    limit: int = Query(
        20,
        ge=1,
        le=100,
        description="가져올 데이터 개수 (1~100 사이)"
    )
):
    """
    Supabase weekly_items 테이블에서 데이터 조회.
    limit 값으로 최대 N개를 가져오며, rank 오름차순으로 정렬함.
    """

    try:
        response = (
            supabase.table("weekly_items")
            .select("*")
            .order("rank", desc=False)
            .limit(limit)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase query error: {e}")

    data = getattr(response, "data", None)
    error = getattr(response, "error", None)

    if error:
        raise HTTPException(status_code=500, detail=str(error))

    if data is None:
        data = []

    return TrendResponse(items=data, count=len(data))


# ------------------------------------------------------
# NEW: 지역별 Shorts 조회
# ------------------------------------------------------
@app.get(
    "/api/v1/shorts/regional",
    response_model=ShortsRegionalResponse,
    summary="지역별 Shorts 조회",
    description="한국/해외/중국 지역별로 최신 Shorts를 조회합니다."
)
async def get_regional_shorts(
    limit_per_region: int = Query(
        12,
        ge=1,
        le=50,
        description="지역당 가져올 개수 (기본 12개)"
    )
):
    """
    지역별 Shorts 조회
    - 한국: 12개
    - 해외: 12개
    - 중국: 12개
    총 36개
    """
    try:
        result = {
            "korea": [],
            "global": [],
            "china": []
        }
        
        for region in ["korea", "global", "china"]:
            response = (
                supabase.table("shorts_items")
                .select("*")
                .eq("region", region)
                .order("crawled_at", desc=True)
                .limit(limit_per_region)
                .execute()
            )
            
            if response.data:
                result[region if region != "global" else "global"] = response.data
        
        total = len(result["korea"]) + len(result["global"]) + len(result["china"])
        
        return {
            "korea": result["korea"],
            "global_": result["global"],
            "china": result["china"],
            "total_count": total
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")


@app.get(
    "/api/v1/shorts",
    response_model=ShortsResponse,
    summary="전체 Shorts 조회",
    description="최신 Shorts를 조회합니다."
)
async def get_shorts(
    limit: int = Query(
        36,
        ge=1,
        le=100,
        description="가져올 데이터 개수"
    ),
    region: Optional[str] = Query(
        None,
        description="지역 필터 (korea, global, china)"
    ),
    platform: Optional[str] = Query(
        None,
        description="플랫폼 필터 (instagram, youtube, tiktok)"
    )
):
    """
    Shorts 조회 (필터링 가능)
    """
    try:
        query = supabase.table("shorts_items").select("*")
        
        if region:
            query = query.eq("region", region)
        
        if platform:
            query = query.eq("platform", platform)
        
        response = query.order("crawled_at", desc=True).limit(limit).execute()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")

    data = getattr(response, "data", None)
    error = getattr(response, "error", None)

    if error:
        raise HTTPException(status_code=500, detail=str(error))

    if data is None:
        data = []

    return ShortsResponse(items=data, count=len(data))
