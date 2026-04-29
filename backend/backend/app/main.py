import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import APP_ENV

from app.auth import (
    authenticate_admin,
    create_access_token,
    get_current_admin,
)

# ------------------------------------------------------
# App
# ------------------------------------------------------
app = FastAPI(
    title="short-man backend API",
    version="0.4.0",
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

class AdRequest(BaseModel):
    keyword: str
    region: str = "korea"
    platforms: List[str] = ["youtube", "tiktok", "instagram"]
    max_results: int = 20

class AdResponse(BaseModel):
    keyword: str
    region: str
    total: int

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class AdminInfo(BaseModel):
    username: str

# Keyword 관리용 모델
class KeywordItem(BaseModel):
    id: int
    region: str
    keyword: str
    is_fixed: bool
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class KeywordCreate(BaseModel):
    region: str
    keyword: str
    is_fixed: bool = False
    is_active: bool = True

class KeywordUpdate(BaseModel):
    keyword: Optional[str] = None
    is_fixed: Optional[bool] = None
    is_active: Optional[bool] = None

class KeywordListResponse(BaseModel):
    items: List[KeywordItem]
    count: int

# Schedule 관리용 모델
class ScheduleItem(BaseModel):
    id: int
    account: str
    weekday: int
    mode: str
    region: str
    lang: str
    sleep_min: float
    sleep_max: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ScheduleUpsert(BaseModel):
    account: str
    weekday: int
    mode: str
    region: str
    lang: str
    sleep_min: float = 5.0
    sleep_max: float = 17.0

class ScheduleUpdate(BaseModel):
    mode: Optional[str] = None
    region: Optional[str] = None
    lang: Optional[str] = None
    sleep_min: Optional[float] = None
    sleep_max: Optional[float] = None

class ScheduleListResponse(BaseModel):
    items: List[ScheduleItem]
    count: int

# ------------------------------------------------------
# Helpers
# ------------------------------------------------------
PLATFORMS = ["youtube", "instagram", "tiktok"]
BASE_PER_PLATFORM = 4
TOTAL_PER_REGION = 12

VALID_REGIONS = {"korea", "global", "china"}

def fetch_regional(region: str) -> List[dict]:
    results: dict[str, list] = {}

    for platform in PLATFORMS:
        try:
            resp = (
                supabase.table("shorts_items")
                .select("*")
                .eq("region", region)
                .eq("platform", platform)
                .order("crawled_at", desc=True)
                .limit(BASE_PER_PLATFORM)
                .execute()
            )
            results[platform] = resp.data or []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DB error region={region} platform={platform}: {e}")

    total_got = sum(len(v) for v in results.values())
    shortage = TOTAL_PER_REGION - total_got

    if shortage > 0:
        active = [p for p in PLATFORMS if results[p]]
        if active:
            extra_per = shortage // len(active)
            remainder = shortage % len(active)
            for i, platform in enumerate(active):
                extra = extra_per + (1 if i < remainder else 0)
                if extra <= 0:
                    continue
                already = len(results[platform])
                try:
                    resp = (
                        supabase.table("shorts_items")
                        .select("*")
                        .eq("region", region)
                        .eq("platform", platform)
                        .order("crawled_at", desc=True)
                        .limit(already + extra)
                        .execute()
                    )
                    results[platform] = resp.data or []
                except Exception:
                    pass

    combined = []
    for platform in PLATFORMS:
        combined.extend(results[platform])

    return combined


# ------------------------------------------------------
# Health
# ------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "env": APP_ENV}


# ------------------------------------------------------
# Admin Authentication
# ------------------------------------------------------
@app.post("/admin/login", response_model=LoginResponse, summary="어드민 로그인")
async def admin_login(form_data: OAuth2PasswordRequestForm = Depends()):
    admin = authenticate_admin(supabase, form_data.username, form_data.password)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(admin["username"])
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in=3 * 60 * 60,
    )


@app.get("/admin/me", response_model=AdminInfo, summary="현재 로그인 어드민")
async def admin_me(current: dict = Depends(get_current_admin)):
    return AdminInfo(username=current["username"])


# ------------------------------------------------------
# Admin - Keywords CRUD
# ------------------------------------------------------
@app.get(
    "/admin/keywords",
    response_model=KeywordListResponse,
    summary="키워드 목록 조회 (어드민)",
)
async def admin_list_keywords(
    region: Optional[str] = Query(None, description="region 필터: korea/global/china"),
    current: dict = Depends(get_current_admin),
):
    try:
        query = supabase.table("keywords").select("*")
        if region:
            if region not in VALID_REGIONS:
                raise HTTPException(status_code=400, detail=f"Invalid region: {region}")
            query = query.eq("region", region)
        resp = query.order("region").order("is_fixed", desc=True).order("keyword").execute()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    data = resp.data or []
    return KeywordListResponse(items=data, count=len(data))


@app.post(
    "/admin/keywords",
    response_model=KeywordItem,
    summary="키워드 추가 (어드민)",
)
async def admin_create_keyword(
    body: KeywordCreate,
    current: dict = Depends(get_current_admin),
):
    if body.region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail=f"Invalid region: {body.region}")
    if not body.keyword.strip():
        raise HTTPException(status_code=400, detail="keyword is required")

    try:
        resp = (
            supabase.table("keywords")
            .insert({
                "region": body.region,
                "keyword": body.keyword.strip(),
                "is_fixed": body.is_fixed,
                "is_active": body.is_active,
            })
            .execute()
        )
    except Exception as e:
        msg = str(e)
        if "duplicate" in msg.lower() or "unique" in msg.lower():
            raise HTTPException(status_code=409, detail="Keyword already exists for this region")
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    if not resp.data:
        raise HTTPException(status_code=500, detail="Insert failed")
    return resp.data[0]


@app.patch(
    "/admin/keywords/{keyword_id}",
    response_model=KeywordItem,
    summary="키워드 수정 (어드민)",
)
async def admin_update_keyword(
    keyword_id: int,
    body: KeywordUpdate,
    current: dict = Depends(get_current_admin),
):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    if "keyword" in payload:
        payload["keyword"] = payload["keyword"].strip()
        if not payload["keyword"]:
            raise HTTPException(status_code=400, detail="keyword cannot be empty")
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        resp = (
            supabase.table("keywords")
            .update(payload)
            .eq("id", keyword_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    if not resp.data:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return resp.data[0]


@app.delete(
    "/admin/keywords/{keyword_id}",
    summary="키워드 삭제 (어드민)",
)
async def admin_delete_keyword(
    keyword_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = (
            supabase.table("keywords")
            .delete()
            .eq("id", keyword_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    deleted = len(resp.data or [])
    return {"deleted": deleted}


# ------------------------------------------------------
# Admin - Schedule CRUD
# ------------------------------------------------------
VALID_MODES = {"full", "light", "off"}

@app.get(
    "/admin/schedules",
    response_model=ScheduleListResponse,
    summary="스크래퍼 스케줄 목록 (어드민)",
)
async def admin_list_schedules(
    account: Optional[str] = Query(None, description="account 필터"),
    current: dict = Depends(get_current_admin),
):
    try:
        query = supabase.table("scraper_schedule").select("*")
        if account:
            query = query.eq("account", account)
        resp = query.order("account").order("weekday").execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    data = resp.data or []
    return ScheduleListResponse(items=data, count=len(data))


@app.post(
    "/admin/schedules",
    response_model=ScheduleItem,
    summary="스케줄 upsert (어드민)",
)
async def admin_upsert_schedule(
    body: ScheduleUpsert,
    current: dict = Depends(get_current_admin),
):
    if body.region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail=f"Invalid region: {body.region}")
    if body.mode not in VALID_MODES:
        raise HTTPException(status_code=400, detail=f"Invalid mode: {body.mode}")
    if body.weekday < 0 or body.weekday > 6:
        raise HTTPException(status_code=400, detail="weekday must be 0-6")
    if not body.account.strip():
        raise HTTPException(status_code=400, detail="account is required")

    payload = {
        "account": body.account.strip(),
        "weekday": body.weekday,
        "mode": body.mode,
        "region": body.region,
        "lang": body.lang.strip(),
        "sleep_min": body.sleep_min,
        "sleep_max": body.sleep_max,
    }

    try:
        resp = (
            supabase.table("scraper_schedule")
            .upsert(payload, on_conflict="account,weekday")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    if not resp.data:
        raise HTTPException(status_code=500, detail="Upsert failed")
    return resp.data[0]


@app.patch(
    "/admin/schedules/{schedule_id}",
    response_model=ScheduleItem,
    summary="스케줄 수정 (어드민)",
)
async def admin_update_schedule(
    schedule_id: int,
    body: ScheduleUpdate,
    current: dict = Depends(get_current_admin),
):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "mode" in payload and payload["mode"] not in VALID_MODES:
        raise HTTPException(status_code=400, detail=f"Invalid mode: {payload['mode']}")
    if "region" in payload and payload["region"] not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail=f"Invalid region: {payload['region']}")

    try:
        resp = (
            supabase.table("scraper_schedule")
            .update(payload)
            .eq("id", schedule_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    if not resp.data:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return resp.data[0]


@app.delete(
    "/admin/schedules/{schedule_id}",
    summary="스케줄 삭제 (어드민)",
)
async def admin_delete_schedule(
    schedule_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = (
            supabase.table("scraper_schedule")
            .delete()
            .eq("id", schedule_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    deleted = len(resp.data or [])
    return {"deleted": deleted}


@app.delete(
    "/admin/schedules/account/{account}",
    summary="계정 전체 스케줄 삭제 (어드민)",
)
async def admin_delete_account_schedules(
    account: str,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = (
            supabase.table("scraper_schedule")
            .delete()
            .eq("account", account)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    deleted = len(resp.data or [])
    return {"deleted": deleted}


# ------------------------------------------------------
# Shorts - 지역별 (플랫폼 444 균등 분배)
# ------------------------------------------------------
@app.get("/api/v1/shorts/regional", response_model=ShortsRegionalResponse,
         summary="지역별 Shorts 조회")
async def get_regional_shorts():
    korea  = fetch_regional("korea")
    global_ = fetch_regional("global")
    china  = fetch_regional("china")

    return {
        "korea":       korea,
        "global_":     global_,
        "china":       china,
        "total_count": len(korea) + len(global_) + len(china)
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
# Ad - 키워드 기반 크롤링
# ------------------------------------------------------
@app.post("/api/v0/ad", response_model=AdResponse, summary="키워드 기반 숏폼 추가")
async def add_ad(req: AdRequest):
    try:
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
