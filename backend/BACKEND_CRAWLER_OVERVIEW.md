# Backend Crawler Overview (최종 버전)

## 목적(Purpose)
크롤러는 아래 두 가지 핵심 기능을 담당함
1. 외부 플랫폼(YouTube / Instagram / TikTok)에서 합법적으로 수집한 숏폼 메타데이터를 Supabase DB의 shorts_common + shorts_{platform} 테이블에 upsert
2. 주간 TOP 랭킹 조회를 위한 집계 데이터(weekly_sets / weekly_items)를 Supabase Function refresh_week()를 호출하여 재구성한다.
※ 현재 프로젝트는 legacy items 테이블 기반 구조가 아닌,
shorts_common + shorts_youtube + shorts_instagram + shorts_tiktok 구조가 표준 구조임.

## 데이터 파이프라인 요약
1) 전체 흐름(End-to-End)
1. 각 플랫폼 크롤러 실행 (YouTube, Instagram, TikTok)
  → 플랫폼 API 또는 승인된 피드에서 메타데이터 수집
  → ShortItem 모델로 정규화
2. SupabaseWriter.upsert() 실행
  - (1) shorts_common에 우선 upsert
    - 유니크 키: (platform, platform_id)
  - (2) 플랫폼 확장 테이블 shorts_{platform} upsert
3. refresh_week() 호출
  - 집계 뷰/함수를 이용해
    - weekly_sets
    - weekly_items
      를 자동 재생성
4. API (/trends)에서 weekly_sets 조회
  - 한국/KOREA 16개
  - GLOBAL 16개
  - CHINA 16개
    - → 하나의 응답으로 통합 제공

## 주요 컴포넌트
1) ShortItem 구조
@dataclass
class ShortItem:
    platform: Literal["youtube", "instagram", "tiktok"]
    platform_id: str
    region: Literal["korea", "global", "china"]
    nickname: Optional[str]
    avatar: Optional[str]
    thumbnail: Optional[str]
    source: Optional[str]
    description: Optional[str]
    likes: Optional[int]
    video_url: Optional[str]
    published_at: Optional[str]
    extra: dict | None  # 플랫폼별 확장

2) SupabaseWriter 핵심 로직
  - shorts_common → upsert
  - 해당 플랫폼 확장 테이블 → upsert
shorts_common (platform, platform_id) UNIQUE
shorts_youtube.common_id UNIQUE
shorts_instagram.common_id UNIQUE
shorts_tiktok.common_id UNIQUE

## 실행 방법
1) 로컬 실행
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

환경변수 설정:
export SUPABASE_URL=<url>
export SUPABASE_SERVICE_ROLE_KEY=<service-role>

python crawler.py
또는:
python -m backend.crawler

2) GitHub Actions 자동 실행
  - 위치는: .github/workflows/crawl-schedule.yml
  - 주요 특징:
    - 매주 화요일 새벽 3시(KST) 자동 크롤링
    - 병렬 실행 방지(concurrency group)
    - secrets 자동 주입
    - ENV=ci로 동작 (오염 방지)
    - Secrets 필요 값:
| Key                       | 설명                        |
| ------------------------- | -----------------           |
| SUPABASE_URL              | 서비스 DB URL                |
| SUPABASE_SERVICE_ROLE_KEY | Service role key            |
| YOUTUBE_API_KEY           | 선택 사항(실 크롤링 시 필요) |

## 저장소(Supabase) 구조 요약
1) 테이블 구조
| 테이블               | 설명           |
| -------------------- | ------------ |
| **shorts_common**    | 공통 필드 저장     |
| **shorts_youtube**   | 유튜브 확장 데이터   |
| **shorts_instagram** | 인스타그램 확장 데이터 |
| **shorts_tiktok**    | 틱톡 확장 데이터    |
| **weekly_sets**      | 주간 랭킹 세트     |
| **weekly_items**     | 주간 랭킹 아이템    |

2) 뷰 구조
  - v_shorts_week_kr
  - v_reels_week_global
  - v_tiktok_week_cn
  - …
3) 함수(Function)
  - refresh_week()

## 파일 스토리지 규칙
준수해야 할 규칙:
1) 공개 읽기 가능 폴더(thumbnails)
storage/thumbnails/{common_id}.jpg
2) 서명 URL이 필요한 프리뷰 비디오(previews)
storage/previews/{common_id}.mp4

## 보안·정책 준수
  - service_role 키는 절대 프론트엔드/웹에 노출할 수 없음
  - 모든 크롤러는 플랫폼 이용약관을 준수해야 함
  - robots.txt / 크롤링 정책 위반 금지
  - (향후) 파트너 API 사용 시 법무 검토 필수

## 향후 작업(To-Do)
1) 실서비스 크롤러 구현
  - YouTube Data API (Shorts 필터링)
  - Instagram Graph API (Business 계정 필요)
  - TikTok 공식 API(Optional)
  - 플랫폼별 rate-limit 대응

2) 고도화 기능
  - 실패 자동 재시도(backoff)
  - 중복 요청 방지 로직
  - Celery/Redis 기반 분산 크롤링
  - OpenTelemetry 기반 모니터링

3) Edge Functions 도입 가능성
  - 썸네일 자동 생성
  - 프리뷰 비디오 트랜스코딩 (HLS)
  - 백그라운드 데이터 정리

## 부록 – 크롤링 → API → 화면 렌더링 순서
1. GitHub Actions → crawler.py 자동 실행
2. SupabaseWriter() → shorts_* upsert
3. refresh_week() → weekly_sets 생성
4. FastAPI → /trends에서
  - korea
  - global
  - china
  - 각 16개 반환
5. 프론트엔드 홈 화면에서 48개 묶음을 한 번에 렌더링