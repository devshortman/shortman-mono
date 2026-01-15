Short-Man Backend Project
Supabase + FastAPI 기반의 Shorts 플랫폼 데이터 크롤링/집계 서비스
(YouTube / Instagram / TikTok 지원 예정)

📌 프로젝트 개요

본 프로젝트는 Short-form 영상 플랫폼(YouTube, Instagram, TikTok)의 데이터를 정기적으로 크롤링하여 Supabase(PostgreSQL)에 저장하고, 백엔드(FastAPI)를 통해 프론트 서비스에서 활용할 수 있도록 제공하는 API 서버입니다.

🗂 구성 요소
1. Supabase (Database / Storage / Auth)
  - shorts_common / shorts_youtube / shorts_instagram / shorts_tiktok
  - weekly_items / weekly_sets
  - Weekly TOP Aggregation Views
  - Storage buckets (썸네일/메타데이터 저장 가능)
  - RLS(행 기반 권한) 정책 적용
  - Refresh Functions (refresh_week 등)
2. Backend (FastAPI)
  - /trends REST API
  - DB 조회, 구조화된 Response Model 제공
  - Swagger / ReDoc 자동 문서화
  - 헬스체크 / 기본 API 구성
3. Crawler (Python Script)
  - Shorts 데이터 수집 (향후 YouTube/Instagram/TikTok API 연결 예정)
  - Supabase UPSERT
  - GitHub Actions로 매주 자동 실행

⚙️ 개발 환경 설정
1. 필수 요구사항
  - Python 3.11+
  - pip
  - Supabase 프로젝트 1개
  - GitHub Actions 사용 시 Secrets 등록 필요
    * SUPABASE_URL
    * SUPABASE_SERVICE_ROLE_KEY

🔧 로컬 실행 방법
(1) 패키지 설치
cd backend
pip install -r requirements.txt

(2) 환경 변수 파일 생성 (backend/.env)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key

APP_ENV=dev
LOG_LEVEL=INFO

DEFAULT_REGION=KOREA
DEFAULT_LIMIT=16

(3) Supabase 연결 테스트
python backend/test_env.py
정상 출력: [CONNECTED] Supabase 연결 성공

(4) FastAPI 실행
uvicorn backend.app.main:app --reload
접속 주소:
Swagger UI
배포 서버(운영/테스트)
👉 https://short-man-backend.onrender.com/docs
로컬 개발 시
👉 http://127.0.0.1:8000/docs
ReDoc (로컬에서만 활성)
👉 http://127.0.0.1:8000/redoc
※ Render 무료 플랜에서는 ReDoc이 정상 동작 안 될 수도 있음.

📡 제공 API
1. ✔ /health
  - 서버 및 설정 상태 확인
{ "status": "ok", "env": "dev" }

2. ✔ /trends
  - Supabase weekly_items 기반 인기 콘텐츠 조회
예)
/trends?limit=20

Response Schema
{
  "items": [
    {
      "id": 115,
      "weekly_set_id": 24,
      "item_id": 3,
      "rank": 1
    }
  ],
  "count": 1
}
Swagger에서 TrendItem / TrendResponse 자동 생성됨.

🧹 크롤러 실행
  - 수동 실행
python -m backend.crawler
또는:
python backend/crawler.py

🔁 GitHub Actions 자동화
  - Workflow 설명
    * check-secrets.yml: GitHub Secrets 유효성 검사
    * api-smoke.yml: import 오류, 패키지 구조 검사
    * api-health.yml: 배포 서버 /trends 헬스체크
    * crawl-schedule.yml: 매주 화요일 03:00(KST) 자동 크롤링
    * build-and-deploy.yml: Docker 기반 배포(선택)
  - GitHub Actions는 Supabase SERVICE_ROLE_KEY를 사용하므로
Secrets가 반드시 필요함.

🌐 Docker 실행
  - API 서버
docker build -f backend/Dockerfile.api -t shortman-api .
docker run --env-file backend/.env.prod -p 8080:8080 shortman-api
  - 크롤러
docker build -f backend/Dockerfile.crawler -t shortman-crawler .
docker run --env-file backend/.env.prod shortman-crawler

🛠 Supabase 마이그레이션
  - Supabase CLI 사용 시:
supabase db push
또는 Supabase 웹 콘솔 SQL Editor에서 직접 실행.

🔐 환경 변수 요약
로컬 개발: .env / 자동 불러오기
CI (GitHub Actions): .env.ci / GitHub workflow override
운영 서버: .env.prod / Docker 실행용

🧪 테스트 스크립트
  - API 헬스 테스트
python backend/test_api_health.py
  - DB 연결 테스트
python backend/test_env.py

📘 API 문서 접근 안내 (Swagger / ReDoc)
Short-Man Backend는 FastAPI 기반으로 자동 API 문서를 제공함
아래는 배포 서버, 로컬 개발 환경, Render 내부 포트의 차이를 명확히 정리한 표와 설명임

1. 배포 서버(API 운영 환경: Render)
  - Swagger UI(운영 서버): https://short-man-backend.onrender.com/docs
  - OpenAPI JSON(운영 서버): https://short-man-backend.onrender.com/openapi.json

2. 로컬 개발 환경 (Local Development)
  - 개발자가 직접 PC에서 FastAPI를 실행하면 접근 가능한 주소
  - FastAPI 실행: uvicorn backend.app.main:app --reload
  - Swagger UI(로컬): http://127.0.0.1:8000/docs
  - ReDoc(로컬): http://127.0.0.1:8000/redoc
  📌 주의
  - 이 주소들은 내 컴퓨터에서만 접근 가능
  - 인터넷에서는 절대 접속 안 됨

🧩 Render 내부 포트 (내부 바인딩 주소)
  - Render Free 서버 로그에서 확인되는 FastAPI 실행 포트
  - 내부 Uvicorn 바인딩 주소 (Render 서버 내부용)
    * http://0.0.0.0:10000
  📌 이 주소는 Render 내부 네트워크에서만 접근 가능한 시스템 주소이며 브라우저에서 직접 접근할 수 없음
  Render가 내부적으로 10000번 포트를 외부 도메인으로 매핑해 다음 주소를 만들어 줍니다:
  https://short-man-backend.onrender.com  ← 외부 노출

📑 정리: API 문서 접근 경로 요약
| 구분                 | 접근 주소                                                                | 접근가능여부
| 운영 서버 Swagger UI | [https://short-man-backend.onrender.com/docs](https://short-man-backend.onrender.com/docs)| ✅ 공개 | 배포된 API 문서      |
| 운영 서버 OpenAPI    | [https://short-man-backend.onrender.com/openapi.json](https://short-man-backend.onrender.com/openapi.json)| ✅ 공개      | 스키마 파일          |
| 로컬 Swagger UI      | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)                 | 🔒 로컬 PC만 개발 환경에서만        |
| 로컬 ReDoc           | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)               | 🔒 로컬 PC만 개발 환경 UI           |
| Render 내부 포트     | [http://0.0.0.0:10000](http://0.0.0.0:10000)                             | ❌ 브라우저 불가 | Render 서버 내부 실행 포트
