# Playwright가 포함된 공식 이미지를 사용하여 브라우저 의존성 문제를 해결합니다.
FROM mcr.microsoft.com/playwright:v1.49.0-noble

# 작업 디렉토리 설정
WORKDIR /app

# 모든 소스 코드 복사
COPY . .

# 백엔드 의존성 설치
RUN cd backend && npm install

# 스크래퍼 의존성 설치
RUN cd scraper && npm install

# 환경 변수 설정
ENV PORT=4000
ENV NODE_ENV=production
ENV HEADLESS=true

# 포트 개방
EXPOSE 4000

# 백엔드 서버 실행
CMD ["node", "backend/src/server.js"]
