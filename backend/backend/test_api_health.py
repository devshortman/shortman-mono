# backend/test_api_health.py

from __future__ import annotations

import os
import sys
import time
import json
from typing import Any, Dict
from urllib.parse import urljoin

import requests
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

# ──────────────────────────────────────────────────────────────────────────────
# 설정
# - 기본 베이스 URL은 http://127.0.0.1:8000 (로컬 uvicorn)
# - 환경변수로 오버라이드 가능: API_BASE, TRENDS_PATH, TIMEOUT_SEC, EXPECT_SHORTS
# ──────────────────────────────────────────────────────────────────────────────
API_BASE = os.getenv("API_BASE", "http://127.0.0.1:8000")
TRENDS_PATH = os.getenv("TRENDS_PATH", "/trends")  # ex) "/api/v1/trends"
TIMEOUT_SEC = float(os.getenv("TIMEOUT_SEC", "8"))
EXPECT_SHORTS = int(os.getenv("EXPECT_SHORTS", "16"))  # 섹션당 예상 개수(기본 16)

def _fail(msg: str, code: int = 1):
    print(msg)
    sys.exit(code)

class HealthError(RuntimeError):
    pass

# ──────────────────────────────────────────────────────────────────────────────
# 요청 유틸 (네트워크 오류 재시도)
# ──────────────────────────────────────────────────────────────────────────────
@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_fixed(1.0),
    retry=retry_if_exception_type((requests.RequestException, HealthError)),
)
def _get_json(url: str) -> Dict[str, Any]:
    resp = requests.get(url, timeout=TIMEOUT_SEC)
    if not (200 <= resp.status_code < 300):
        raise HealthError(f"non-2xx status: {resp.status_code} — body={resp.text[:200]}")
    try:
        return resp.json()
    except Exception as e:
        raise HealthError(f"invalid JSON: {e}; body={resp.text[:200]}")

# ──────────────────────────────────────────────────────────────────────────────
# 응답 스키마 가벼운 검증
#  - 최상위에 'trends' 객체 존재
#  - korea/global/china 키가 존재하고, 각 섹션에 'region'과 'shorts'가 존재
#  - shorts 배열 길이가 0 이상이며(기본 기대치는 EXPECT_SHORTS), 각 아이템에 핵심 키가 존재
# ──────────────────────────────────────────────────────────────────────────────
def _validate_trends_payload(payload: Dict[str, Any]) -> None:
    if "trends" not in payload or not isinstance(payload["trends"], dict):
        raise HealthError("missing 'trends' object in response")

    trends = payload["trends"]
    required_regions = ["korea", "global", "china"]
    for r in required_regions:
        if r not in trends or not isinstance(trends[r], dict):
            raise HealthError(f"missing region object: {r}")
        section = trends[r]
        if section.get("region") != r:
            raise HealthError(f"region value mismatch: expected '{r}', got '{section.get('region')}'")

        shorts = section.get("shorts")
        if shorts is None or not isinstance(shorts, list):
            raise HealthError(f"'{r}.shorts' should be a list")
        # 개수는 상황에 따라 0일 수 있으므로 경고만. 기대치가 있으면 비교
        if EXPECT_SHORTS and len(shorts) not in (0, EXPECT_SHORTS):
            print(f"[WARN] {r}.shorts count={len(shorts)} (expected {EXPECT_SHORTS})")

        # 아이템 스팟체크(핵심 필드만)
        for i, item in enumerate(shorts[:3]):  # 앞에서 3개만 가볍게 확인
            if not isinstance(item, dict):
                raise HealthError(f"{r}.shorts[{i}] not an object")
            for k in ["id", "nickname", "thumbnail", "source", "description", "likes", "video_url"]:
                if k not in item:
                    raise HealthError(f"{r}.shorts[{i}] missing key: {k}")

def main():
    base = API_BASE.rstrip("/")
    url = urljoin(base + "/", TRENDS_PATH.lstrip("/"))
    print(f"[INFO] Health check target: {url}")

    started = time.time()
    try:
        data = _get_json(url)
        # 짧게 미리보기
        preview = json.dumps(data, ensure_ascii=False)[:300]
        print(f"[INFO] Response preview: {preview}…")
        _validate_trends_payload(data)
    except Exception as e:
        _fail(f"[ERROR] /trends health check failed: {e}", code=2)

    elapsed = (time.time() - started) * 1000
    print(f"[OK] /trends healthy in {elapsed:.1f} ms")
    sys.exit(0)

if __name__ == "__main__":
    main()