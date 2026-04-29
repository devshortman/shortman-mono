import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
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
    version="0.5.0",
    description="Short-man 서비스의 Backend API 문서입니다."
)

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
# Constants
# ------------------------------------------------------
PLATFORMS = ["youtube", "instagram", "tiktok"]
BASE_PER_PLATFORM = 4
TOTAL_PER_REGION = 12
RECENT_DAYS = 7

VALID_REGIONS = {"korea", "global", "china"}
VALID_MODES = {"full", "light", "off"}
VALID_INITIATIVE_STATUS = {"draft", "recruiting", "in_progress", "review", "closed"}
VALID_NOTICE_TYPES = {"notice", "checklist", "guide"}

# ------------------------------------------------------
# Models - Shorts
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

# ------------------------------------------------------
# Models - Auth
# ------------------------------------------------------
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class AdminInfo(BaseModel):
    username: str

# ------------------------------------------------------
# Models - Keyword
# ------------------------------------------------------
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

# ------------------------------------------------------
# Models - Schedule
# ------------------------------------------------------
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
# Models - Admin Shorts
# ------------------------------------------------------
class AdminShortsItem(BaseModel):
    id: int
    platform: str
    platform_id: str
    title: str
    thumbnail: Optional[str] = None
    video_url: str
    nickname: Optional[str] = None
    region: str
    source: Optional[str] = None
    keyword: Optional[str] = None
    likes: Optional[int] = 0
    views: Optional[int] = 0
    comments: Optional[int] = 0
    is_hidden: bool = False
    crawled_at: Optional[str] = None
    published_at: Optional[str] = None

class AdminShortsListResponse(BaseModel):
    items: List[AdminShortsItem]
    count: int
    page: int
    page_size: int

class ShortsHiddenUpdate(BaseModel):
    is_hidden: bool

class BulkIds(BaseModel):
    ids: List[int]

# ------------------------------------------------------
# Models - Initiative
# ------------------------------------------------------
class Initiative(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    capacity_min: int
    capacity_max: int
    deadline: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class InitiativeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    capacity_min: int = 10
    capacity_max: int = 100
    deadline: Optional[str] = None
    status: str = "draft"

class InitiativeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    capacity_min: Optional[int] = None
    capacity_max: Optional[int] = None
    deadline: Optional[str] = None
    status: Optional[str] = None

class InitiativeDemo(BaseModel):
    id: int
    initiative_id: int
    title: Optional[str] = None
    video_url: str
    thumbnail: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0
    created_at: Optional[str] = None

class InitiativeDemoCreate(BaseModel):
    title: Optional[str] = None
    video_url: str
    thumbnail: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0

class InitiativeNotice(BaseModel):
    id: int
    initiative_id: int
    notice_type: str
    title: str
    content: Optional[str] = None
    sort_order: int = 0
    created_at: Optional[str] = None

class InitiativeNoticeCreate(BaseModel):
    notice_type: str = "notice"
    title: str
    content: Optional[str] = None
    sort_order: int = 0

# ------------------------------------------------------
# Models - User
# ------------------------------------------------------
class UserProfile(BaseModel):
    user_id: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    is_blocked: bool = False
    block_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    is_blocked: Optional[bool] = None
    block_reason: Optional[str] = None
    notes: Optional[str] = None

class UserProfileListResponse(BaseModel):
    items: List[UserProfile]
    count: int


# ------------------------------------------------------
# Helpers
# ------------------------------------------------------
def recent_iso(days: int = RECENT_DAYS) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def fetch_regional(region: str) -> List[dict]:
    """플랫폼당 4개씩, 7일 이내, 숨김 제외, 부족하면 활성 플랫폼에서 보충"""
    since = recent_iso(RECENT_DAYS)
    results: dict[str, list] = {}

    for platform in PLATFORMS:
        try:
            resp = (
                supabase.table("shorts_items")
                .select("*")
                .eq("region", region)
                .eq("platform", platform)
                .eq("is_hidden", False)
                .gte("crawled_at", since)
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
                        .eq("is_hidden", False)
                        .gte("crawled_at", since)
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


# ============================================================
# Health
# ============================================================
@app.get("/health")
async def health():
    return {"status": "ok", "env": APP_ENV}


# ============================================================
# Admin Authentication
# ============================================================
@app.post("/admin/login", response_model=LoginResponse, summary="어드민 로그인")
async def admin_login(form_data: OAuth2PasswordRequestForm = Depends()):
    admin = authenticate_admin(supabase, form_data.username, form_data.password)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(admin["username"])
    return LoginResponse(access_token=token, token_type="bearer", expires_in=3 * 60 * 60)


@app.get("/admin/me", response_model=AdminInfo, summary="현재 로그인 어드민")
async def admin_me(current: dict = Depends(get_current_admin)):
    return AdminInfo(username=current["username"])


# ============================================================
# Admin - Keywords
# ============================================================
@app.get("/admin/keywords", response_model=KeywordListResponse, summary="키워드 목록")
async def admin_list_keywords(
    region: Optional[str] = Query(None),
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


@app.post("/admin/keywords", response_model=KeywordItem, summary="키워드 추가")
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


@app.patch("/admin/keywords/{keyword_id}", response_model=KeywordItem, summary="키워드 수정")
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
        resp = supabase.table("keywords").update(payload).eq("id", keyword_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return resp.data[0]


@app.delete("/admin/keywords/{keyword_id}", summary="키워드 삭제")
async def admin_delete_keyword(
    keyword_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = supabase.table("keywords").delete().eq("id", keyword_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {"deleted": len(resp.data or [])}


# ============================================================
# Admin - Schedule
# ============================================================
@app.get("/admin/schedules", response_model=ScheduleListResponse, summary="스케줄 목록")
async def admin_list_schedules(
    account: Optional[str] = Query(None),
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


@app.post("/admin/schedules", response_model=ScheduleItem, summary="스케줄 upsert")
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
        resp = supabase.table("scraper_schedule").upsert(payload, on_conflict="account,weekday").execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=500, detail="Upsert failed")
    return resp.data[0]


@app.patch("/admin/schedules/{schedule_id}", response_model=ScheduleItem, summary="스케줄 수정")
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
        resp = supabase.table("scraper_schedule").update(payload).eq("id", schedule_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return resp.data[0]


@app.delete("/admin/schedules/{schedule_id}", summary="스케줄 삭제")
async def admin_delete_schedule(
    schedule_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = supabase.table("scraper_schedule").delete().eq("id", schedule_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {"deleted": len(resp.data or [])}


@app.delete("/admin/schedules/account/{account}", summary="계정 전체 스케줄 삭제")
async def admin_delete_account_schedules(
    account: str,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = supabase.table("scraper_schedule").delete().eq("account", account).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {"deleted": len(resp.data or [])}


# ============================================================
# Admin - Shorts
# ============================================================
@app.get("/admin/shorts", response_model=AdminShortsListResponse, summary="수집 영상 목록")
async def admin_list_shorts(
    region: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    show_hidden: bool = Query(False),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    current: dict = Depends(get_current_admin),
):
    try:
        query = supabase.table("shorts_items").select("*", count="exact")
        if region:
            query = query.eq("region", region)
        if platform:
            query = query.eq("platform", platform)
        if keyword:
            query = query.eq("keyword", keyword)
        if not show_hidden:
            query = query.eq("is_hidden", False)

        if sort == "oldest":
            query = query.order("crawled_at", desc=False)
        elif sort == "views":
            query = query.order("views", desc=True)
        elif sort == "likes":
            query = query.order("likes", desc=True)
        else:
            query = query.order("crawled_at", desc=True)

        offset = (page - 1) * page_size
        resp = query.range(offset, offset + page_size - 1).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return AdminShortsListResponse(
        items=resp.data or [],
        count=resp.count or 0,
        page=page,
        page_size=page_size,
    )


@app.patch("/admin/shorts/{shorts_id}/hidden", summary="영상 숨김 토글")
async def admin_toggle_hidden(
    shorts_id: int,
    body: ShortsHiddenUpdate,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = supabase.table("shorts_items").update({"is_hidden": body.is_hidden}).eq("id", shorts_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=404, detail="Shorts not found")
    return resp.data[0]


@app.delete("/admin/shorts/{shorts_id}", summary="영상 삭제")
async def admin_delete_shorts(
    shorts_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = supabase.table("shorts_items").delete().eq("id", shorts_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {"deleted": len(resp.data or [])}


@app.post("/admin/shorts/bulk_hide", summary="영상 일괄 숨김")
async def admin_bulk_hide(body: BulkIds, current: dict = Depends(get_current_admin)):
    if not body.ids:
        return {"updated": 0}
    try:
        resp = supabase.table("shorts_items").update({"is_hidden": True}).in_("id", body.ids).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {"updated": len(resp.data or [])}


@app.post("/admin/shorts/bulk_delete", summary="영상 일괄 삭제")
async def admin_bulk_delete(body: BulkIds, current: dict = Depends(get_current_admin)):
    if not body.ids:
        return {"deleted": 0}
    try:
        resp = supabase.table("shorts_items").delete().in_("id", body.ids).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {"deleted": len(resp.data or [])}


# ============================================================
# Admin - Initiative
# ============================================================
@app.get("/admin/initiatives", summary="Initiative 목록")
async def admin_list_initiatives(
    status: Optional[str] = Query(None),
    current: dict = Depends(get_current_admin),
):
    try:
        query = supabase.table("initiatives").select("*")
        if status:
            if status not in VALID_INITIATIVE_STATUS:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
            query = query.eq("status", status)
        resp = query.order("created_at", desc=True).execute()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    data = resp.data or []
    return {"items": data, "count": len(data)}


@app.post("/admin/initiatives", response_model=Initiative, summary="Initiative 생성")
async def admin_create_initiative(
    body: InitiativeCreate,
    current: dict = Depends(get_current_admin),
):
    if body.status not in VALID_INITIATIVE_STATUS:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")
    if not body.title.strip():
        raise HTTPException(status_code=400, detail="title is required")
    payload = body.model_dump()
    payload["title"] = payload["title"].strip()
    payload["created_by"] = current["username"]
    try:
        resp = supabase.table("initiatives").insert(payload).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=500, detail="Insert failed")
    return resp.data[0]


@app.get("/admin/initiatives/{initiative_id}", response_model=Initiative, summary="Initiative 상세")
async def admin_get_initiative(
    initiative_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = supabase.table("initiatives").select("*").eq("id", initiative_id).limit(1).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=404, detail="Initiative not found")
    return resp.data[0]


@app.patch("/admin/initiatives/{initiative_id}", response_model=Initiative, summary="Initiative 수정")
async def admin_update_initiative(
    initiative_id: int,
    body: InitiativeUpdate,
    current: dict = Depends(get_current_admin),
):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "status" in payload and payload["status"] not in VALID_INITIATIVE_STATUS:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload['status']}")
    try:
        resp = supabase.table("initiatives").update(payload).eq("id", initiative_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=404, detail="Initiative not found")
    return resp.data[0]


@app.delete("/admin/initiatives/{initiative_id}", summary="Initiative 삭제")
async def admin_delete_initiative(
    initiative_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = supabase.table("initiatives").delete().eq("id", initiative_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {"deleted": len(resp.data or [])}


@app.get("/admin/initiatives/{initiative_id}/demos", summary="데모 목록")
async def admin_list_demos(
    initiative_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = (
            supabase.table("initiative_demos")
            .select("*")
            .eq("initiative_id", initiative_id)
            .order("sort_order")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    data = resp.data or []
    return {"items": data, "count": len(data)}


@app.post("/admin/initiatives/{initiative_id}/demos", response_model=InitiativeDemo, summary="데모 추가")
async def admin_create_demo(
    initiative_id: int,
    body: InitiativeDemoCreate,
    current: dict = Depends(get_current_admin),
):
    if not body.video_url.strip():
        raise HTTPException(status_code=400, detail="video_url is required")
    payload = body.model_dump()
    payload["initiative_id"] = initiative_id
    try:
        resp = supabase.table("initiative_demos").insert(payload).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=500, detail="Insert failed")
    return resp.data[0]


@app.delete("/admin/demos/{demo_id}", summary="데모 삭제")
async def admin_delete_demo(
    demo_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = supabase.table("initiative_demos").delete().eq("id", demo_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {"deleted": len(resp.data or [])}


@app.get("/admin/initiatives/{initiative_id}/notices", summary="공지 목록")
async def admin_list_notices(
    initiative_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = (
            supabase.table("initiative_notices")
            .select("*")
            .eq("initiative_id", initiative_id)
            .order("sort_order")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    data = resp.data or []
    return {"items": data, "count": len(data)}


@app.post("/admin/initiatives/{initiative_id}/notices", response_model=InitiativeNotice, summary="공지 추가")
async def admin_create_notice(
    initiative_id: int,
    body: InitiativeNoticeCreate,
    current: dict = Depends(get_current_admin),
):
    if body.notice_type not in VALID_NOTICE_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid notice_type: {body.notice_type}")
    if not body.title.strip():
        raise HTTPException(status_code=400, detail="title is required")
    payload = body.model_dump()
    payload["initiative_id"] = initiative_id
    try:
        resp = supabase.table("initiative_notices").insert(payload).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=500, detail="Insert failed")
    return resp.data[0]


@app.delete("/admin/notices/{notice_id}", summary="공지 삭제")
async def admin_delete_notice(
    notice_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = supabase.table("initiative_notices").delete().eq("id", notice_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {"deleted": len(resp.data or [])}


@app.get("/admin/initiatives/{initiative_id}/stats", summary="Initiative 집계")
async def admin_initiative_stats(
    initiative_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        p_resp = (
            supabase.table("initiative_participants")
            .select("id, status", count="exact")
            .eq("initiative_id", initiative_id)
            .execute()
        )
        s_resp = (
            supabase.table("initiative_submissions")
            .select("id, views, likes, comments")
            .eq("initiative_id", initiative_id)
            .eq("is_hidden", False)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    participants = p_resp.data or []
    submissions = s_resp.data or []
    by_status: dict = {}
    for p in participants:
        st = p.get("status") or "unknown"
        by_status[st] = by_status.get(st, 0) + 1
    total_views = sum((s.get("views") or 0) for s in submissions)
    total_likes = sum((s.get("likes") or 0) for s in submissions)
    total_comments = sum((s.get("comments") or 0) for s in submissions)
    return {
        "initiative_id": initiative_id,
        "participants_total": p_resp.count or len(participants),
        "participants_by_status": by_status,
        "submissions_total": len(submissions),
        "total_views": total_views,
        "total_likes": total_likes,
        "total_comments": total_comments,
    }


@app.get("/admin/initiatives/{initiative_id}/submissions", summary="제출물 목록")
async def admin_list_submissions(
    initiative_id: int,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = (
            supabase.table("initiative_submissions")
            .select("*")
            .eq("initiative_id", initiative_id)
            .order("submitted_at", desc=True)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    data = resp.data or []
    return {"items": data, "count": len(data)}


@app.patch("/admin/submissions/{submission_id}/hidden", summary="제출물 숨김 토글")
async def admin_toggle_submission_hidden(
    submission_id: int,
    body: ShortsHiddenUpdate,
    current: dict = Depends(get_current_admin),
):
    try:
        resp = (
            supabase.table("initiative_submissions")
            .update({"is_hidden": body.is_hidden})
            .eq("id", submission_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    return resp.data[0]


# ============================================================
# Admin - Users
# ============================================================
@app.get("/admin/users", response_model=UserProfileListResponse, summary="사용자 목록")
async def admin_list_users(
    blocked: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current: dict = Depends(get_current_admin),
):
    try:
        query = supabase.table("user_profiles").select("*", count="exact")
        if blocked is not None:
            query = query.eq("is_blocked", blocked)
        offset = (page - 1) * page_size
        resp = (
            query.order("created_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return UserProfileListResponse(items=resp.data or [], count=resp.count or 0)


@app.patch("/admin/users/{user_id}", response_model=UserProfile, summary="사용자 프로필 수정")
async def admin_update_user(
    user_id: str,
    body: UserProfileUpdate,
    current: dict = Depends(get_current_admin),
):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    payload["user_id"] = user_id
    try:
        resp = supabase.table("user_profiles").upsert(payload, on_conflict="user_id").execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not resp.data:
        raise HTTPException(status_code=500, detail="Upsert failed")
    return resp.data[0]


# ============================================================
# Public - Shorts
# ============================================================
@app.get("/api/v1/shorts/regional", response_model=ShortsRegionalResponse, summary="지역별 Shorts 조회")
async def get_regional_shorts():
    korea = fetch_regional("korea")
    global_ = fetch_regional("global")
    china = fetch_regional("china")
    return {
        "korea": korea,
        "global_": global_,
        "china": china,
        "total_count": len(korea) + len(global_) + len(china),
    }


@app.get("/api/v1/shorts", response_model=ShortsResponse, summary="전체 Shorts 조회")
async def get_shorts(
    limit: int = Query(36, ge=1, le=100),
    region: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
):
    try:
        since = recent_iso(RECENT_DAYS)
        query = supabase.table("shorts_items").select("*").eq("is_hidden", False).gte("crawled_at", since)
        if region:
            query = query.eq("region", region)
        if platform:
            query = query.eq("platform", platform)
        resp = query.order("crawled_at", desc=True).limit(limit).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    data = resp.data or []
    return ShortsResponse(items=data, count=len(data))


# ============================================================
# Public - Trends (legacy)
# ============================================================
@app.get("/trends", response_model=TrendResponse, summary="주간 인기 아이템 조회")
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


# ============================================================
# Public - Ad
# ============================================================
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


# ============================================================
# Public - Initiative
# ============================================================
@app.get("/api/v1/initiatives", summary="공개 Initiative 목록")
async def public_list_initiatives():
    try:
        resp = (
            supabase.table("initiatives")
            .select("*")
            .in_("status", ["recruiting", "in_progress", "review"])
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    data = resp.data or []
    return {"items": data, "count": len(data)}


@app.get("/api/v1/initiatives/{initiative_id}", summary="공개 Initiative 상세")
async def public_get_initiative(initiative_id: int):
    try:
        i_resp = supabase.table("initiatives").select("*").eq("id", initiative_id).limit(1).execute()
        if not i_resp.data:
            raise HTTPException(status_code=404, detail="Initiative not found")
        d_resp = (
            supabase.table("initiative_demos")
            .select("*")
            .eq("initiative_id", initiative_id)
            .order("sort_order")
            .execute()
        )
        n_resp = (
            supabase.table("initiative_notices")
            .select("*")
            .eq("initiative_id", initiative_id)
            .order("sort_order")
            .execute()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    return {
        "initiative": i_resp.data[0],
        "demos": d_resp.data or [],
        "notices": n_resp.data or [],
    }
