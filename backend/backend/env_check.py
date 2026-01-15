# backend/env_check.py

from __future__ import annotations

from pathlib import Path
from typing import Optional, Dict, Any

import os
import sys

from supabase import create_client, Client
from dotenv import load_dotenv


# ─────────────────────────────────────────────────────────
# 공통 유틸
# ─────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent
ENV_PATH = ROOT_DIR / ".env"


def _mask(s: Optional[str], head: int = 6, tail: int = 4) -> str:
    """민감정보 마스킹 출력용."""
    if not s:
        return "<EMPTY>"
    if len(s) <= head + tail:
        return s[:2] + "…"
    return f"{s[:head]}…{s[-tail:]}"


def _log(msg: str) -> None:
    print(msg, flush=True)


# ─────────────────────────────────────────────────────────
# 설정 로딩
#  - .env 로드 후 config 모듈에서 최종 ENV 값 가져오기
# ─────────────────────────────────────────────────────────
def load_config() -> Dict[str, Any]:
    # 1) .env 로드 (개발환경 기본값)
    if ENV_PATH.exists():
        load_dotenv(ENV_PATH)
        _log(f"[INFO] .env loaded from: {ENV_PATH}")
    else:
        _log(f"[WARN] .env not found at: {ENV_PATH}")

    # 2) config 모듈 import
    #    - 패키지 실행: from backend.config import ...
    #    - 스크립트 실행: from config import ...
    try:
        from backend.config import (  # type: ignore
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
            APP_ENV,
            LOG_LEVEL,
        )
    except Exception:
        try:
            from config import (  # type: ignore
                SUPABASE_URL,
                SUPABASE_SERVICE_ROLE_KEY,
                APP_ENV,
                LOG_LEVEL,
            )
        except Exception as e:
            raise RuntimeError(f"config import 실패: {e}")

    return {
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_SERVICE_ROLE_KEY": SUPABASE_SERVICE_ROLE_KEY,
        "APP_ENV": APP_ENV,
        "LOG_LEVEL": LOG_LEVEL,
    }


# ─────────────────────────────────────────────────────────
# Supabase 연결/쿼리 스모크 테스트
# ─────────────────────────────────────────────────────────
def create_supabase_client(url: str, key: str) -> Client:
    try:
        client: Client = create_client(url, key)
        return client
    except Exception as e:
        raise RuntimeError(f"Supabase client 생성 실패: {e}")


def try_select_any(sb: Client) -> bool:
    """
    shorts_common → items 순으로 1건 조회를 시도.
    둘 다 실패하면 False 반환(예외 포함).
    """
    candidates = ["shorts_common", "items"]
    last_err: Optional[Exception] = None

    for table in candidates:
        try:
            res = sb.table(table).select("*").limit(1).execute()
            rows = res.data or []
            _log(f"[CONNECTED] '{table}' 조회 성공 — rows={len(rows)}")
            if rows:
                _log(f"  sample: {rows[0]}")
            return True
        except Exception as e:
            last_err = e
            _log(f"[WARN] '{table}' 조회 실패: {e}")

    if last_err:
        raise RuntimeError(f"어떤 테이블도 조회하지 못했습니다: {last_err}")
    return False


def check_supabase() -> bool:
    """
    전체 환경 점검:
      1) config 로드
      2) 필수 ENV 확인
      3) Supabase client 생성
      4) 최소 1건 조회 시도
    """
    cfg = load_config()

    SUPABASE_URL = cfg["SUPABASE_URL"]
    SUPABASE_SERVICE_ROLE_KEY = cfg["SUPABASE_SERVICE_ROLE_KEY"]
    APP_ENV = cfg["APP_ENV"]
    LOG_LEVEL = cfg["LOG_LEVEL"]

    # 필수 키 점검
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(f"Missing env keys (APP_ENV={APP_ENV})")

    _log(f"[INFO] APP_ENV={APP_ENV} | LOG_LEVEL={LOG_LEVEL}")
    _log(f"[INFO] SUPABASE_URL={SUPABASE_URL}")
    _log(
        f"[INFO] SUPABASE_SERVICE_ROLE_KEY(head)="
        f"{_mask(SUPABASE_SERVICE_ROLE_KEY)}"
    )

    # 클라이언트 생성 및 조회 테스트
    sb = create_supabase_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return try_select_any(sb)


# ─────────────────────────────────────────────────────────
# CLI entrypoint
# ─────────────────────────────────────────────────────────
def main() -> int:
    """
    CLI 실행 진입점.
    반환값을 exit code로 사용.
    """
    try:
        ok = check_supabase()
    except Exception as e:
        _log(f"[ERROR] Supabase 환경 점검 실패: {e}")
        return 1

    if ok:
        _log("[OK] Supabase 연결 및 최소 조회 테스트 통과")
        return 0
    else:
        _log("[ERROR] Supabase 조회 실패(자세한 내용은 로그 참고)")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())