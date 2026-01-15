# backend/test_env_basic.py
import os
from dotenv import load_dotenv
from pathlib import Path

# .env를 로드합니다
load_dotenv(Path(__file__).resolve().parent / ".env")

def test_supabase_env_exists():
    assert os.getenv("SUPABASE_URL") is not None
    assert os.getenv("SUPABASE_SERVICE_ROLE_KEY") is not None