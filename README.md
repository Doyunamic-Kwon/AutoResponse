# AutoResponse: AI 기반 통합 리뷰 관리 솔루션

AutoResponse는 소상공인과 매장 운영자를 위한 지능형 평판 관리 플랫폼입니다. 여러 플랫폼에 분산된 고객 리뷰를 자동으로 수집하고, 매장의 특성에 맞춘 AI 답글 초안을 생성하여 효율적인 고객 소통을 지원합니다.

---

## 📋 핵심 기능 (Key Features)

### 1. 통합 리뷰 스크래핑 (Unified Scraping)
*   **플랫폼 통합**: 네이버 플레이스 및 카카오맵의 리뷰 데이터를 단일 경로로 수집합니다.
*   **안정적인 수집**: Playwright와 Stealth 모드를 활용하여 유동적인 웹 환경에서도 안정적으로 정보를 추출합니다.
*   **데이터 정제**: 불필요한 레이블(더보기 등)을 제거하고 순수 리뷰 텍스트와 메타데이터(평점, 방문 시간, 대기 상황 등)를 정밀하게 파악합니다.

### 2. 맥락 인식 AI 답글 생성 (AI Reply Generation)
*   **페르소나 설정**: 따뜻함, 전문성, 활발함 등 세 가지 매장 성격에 맞춰 답글 스타일을 선택할 수 있습니다.
*   **맥락 기반 초안**: OpenAI GPT-4o 모델을 사용하여 리뷰 본문뿐만 아니라 대기 시간, 방문 목적 등의 부가 정보를 반영한 자연스러운 답글을 제안합니다.

### 3. 실시간 동기화 및 인사이트 (Real-time Sync & Insights)
*   **실시간 진행 상태**: SSE(Server-Sent Events)를 통해 스크래핑 진행 과정을 대시보드에서 실시간으로 확인할 수 있습니다.
*   **AI 트렌드 분석**: 수집된 리뷰 데이터를 바탕으로 매장의 강점과 개선점을 요약하여 핵심 키워드 중심의 인사이트를 제공합니다.

---

## 🏗️ 프로젝트 구조 (Project Structure)

본 프로젝트는 서비스의 확장성을 고려하여 모노레포(Monorepo) 구조로 설계되었습니다.

- **`frontend/`**: Next.js 기반의 사용자 인터페이스 및 대시보드
- **`backend/`**: Express 및 Prisma를 활용한 데이터 처리 및 AI API 서버
- **`scraper/`**: Playwright 기반의 독립적인 웹 스크래핑 엔진

---

## �️ 기술 스택 (Tech Stack)

### Frontend
- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js, Express
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **AI**: OpenAI API (GPT-4o)

### Scraper
- **Engine**: Playwright
- **Stealth**: playwright-extra, puppeteer-extra-plugin-stealth

---

## 🚀 시작하기 (Getting Started)

### 환경 변수 설정
각 디렉토리의 `.env` 파일을 설정해야 합니다.

**`backend/.env`**
```env
PORT=4000
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=your_vercel_url
```

**`frontend/.env`**
```env
NEXT_PUBLIC_API_URL=your_backend_url
NEXTAUTH_URL=your_app_url
NEXTAUTH_SECRET=your_random_secret
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

### 설치 및 실행
```bash
# 전체 의존성 설치
npm install

# 서비스별 실행 (예: Backend)
cd backend
npm install
npm run start
```

---

## 📜 이용 지침 (Policy & Disclaimer)
*   이 프로젝트는 학습 및 MVP(Minimum Viable Product) 검증 목적으로 개발되었습니다.
*   대상 서비스의 이용 약관을 준수하며, 서버에 과도한 부하를 주지 않도록 순차적 로딩 및 지연 시간을 포함하고 있습니다.
*   봇 기반 탐지를 피하기 위해 비상업적 목적으로만 사용하실 것을 권장합니다.