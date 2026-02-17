# AutoResponse (리뷰의 신)

> **"사장님의 디지털 평판 보험"**
> 
> 네이버/카카오 리뷰 데이터를 실시간 수집하고, AI(GPT-4o)와 사장님의 페르소나를 결합하여 최적의 답글을 생성해주는 통합 리뷰 관리 플랫폼입니다.
> 

## 🏗️ Project Structure
- `scraper/`: Playwright 기반의 네이버/카카오 리뷰 수집 로봇 (with Anti-Bot Evasion)
- `frontend/`: (To Be Implemented) 사장님용 대시보드 (Next.js)
- `backend/`: (To Be Implemented) 리뷰 데이터 처리 및 AI 답변 생성 API

## 🚀 Getting Started (Scraper)

### Prerequisites
- Node.js 18+
- Playwright Browsers

### Installation
```bash
git clone https://github.com/Doyunamic-Kwon/AutoResponse.git
cd AutoResponse/scraper
npm install
npx playwright install
```

### Usage
```bash
# Run with default test IDs (Gangnam Alver Cafe)
npm start

# Run with specific Restaurant IDs
# Usage: node src/main.js <NaverID> <KakaoID>
node src/main.js 37296584 26338954
```

## 🛠️ Tech Stack
- **Core**: Node.js, Playwright
- **Anti-Bot**: playwright-extra, puppeteer-extra-plugin-stealth
- **Data**: JSON (Local/MVP), PostgreSQL (Production)

## ⚠️ Note
이 프로젝트는 학습 및 MVP 검증 목적으로 제작되었습니다. 대량의 트래픽을 유발하는 무차별 스크래핑은 지양합니다.