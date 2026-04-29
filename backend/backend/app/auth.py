"""
Admin Authentication
- Supabase admins 테이블에서 username/password_hash 검증
- JWT 토큰 발급 및 검증
- FastAPI 의존성 주입용 get_current_admin
"""

import os
import sys
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from supabase import Client

# config 경로 (main.py와 동일한 import 경로 보장)
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("Missing env key: JWT_SECRET")

JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 3

# OAuth2 스킴 (프론트가 Authorization: Bearer xxx 헤더로 보냄)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/login")


# ------------------------------------------------------
# Password Helpers
# ------------------------------------------------------
def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception as e:
        logging.warning("verify_password error: %s", e)
        return False


# ------------------------------------------------------
# JWT Helpers
# ------------------------------------------------------
def create_access_token(username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ------------------------------------------------------
# Login & Auth Dependency
# ------------------------------------------------------
def authenticate_admin(sb: Client, username: str, password: str) -> Optional[dict]:
    """username/password 검증 후 admin 정보 반환 (실패 시 None)"""
    res = (
        sb.table("admins")
        .select("id, username, password_hash, is_active")
        .eq("username", username)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None

    admin = res.data[0]
    if not admin.get("is_active"):
        return None
    if not verify_password(password, admin["password_hash"]):
        return None

    # 마지막 로그인 시각 갱신
    try:
        sb.table("admins").update(
            {"last_login_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", admin["id"]).execute()
    except Exception as e:
        logging.warning("last_login_at update failed: %s", e)

    return {"id": admin["id"], "username": admin["username"]}


def get_current_admin(token: str = Depends(oauth2_scheme)) -> dict:
    """
    FastAPI 의존성. Authorization: Bearer xxx 헤더에서 토큰 추출 후 검증.
    어드민 전용 엔드포인트에 Depends(get_current_admin)으로 주입.
    """
    payload = decode_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    return {"username": username}
