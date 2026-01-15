# backend/app/main.py
import os
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List
from supabase import create_client, Client

from backend.config import APP_ENV

app = FastAPI(
    title="short-man backend API",
    version="0.1.0",
    description="Short-man 서비스의 Backend API 문서입니다."
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

class TrendItem(BaseModel):
    id: int
    weekly_set_id: int
    item_id: int
    rank: int

class TrendResponse(BaseModel):
    items: List[TrendItem]
    count: int


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