# On Learning Searcher (Foundation)

온러닝서처의 프론트엔드 Foundation 브랜치입니다.
이 브랜치는 공통 레이아웃, 라우팅, 기본 스타일 토큰을 제공합니다.

## 시작하기
```bash
npm install
npm run dev
```

## 제공되는 기본 기능
- React + TypeScript + Vite 환경
- `react-router-dom` 기반 라우팅
- PRD 기능별 기본 페이지
  - `/diagnosis`
  - `/recommendation`
  - `/course-linking`
  - `/history`
  - `/chatbot`
  - `/responsive`
- 공통 레이아웃 `AppShell`
- 반응형 대응 기본 스타일

## 폴더 구조
```text
src/
  app/
  router/
  styles/
  shared/layouts/
  features/
    diagnosis/
    recommendation/
    course-linking/
    history/
    chatbot/
    responsive/
```

## 권장 다음 작업
1. `codex/diagnosis`에서 진단 질문 플로우 구현
2. `codex/recommendation`에서 추천 카드/필터 UI 구현
3. `codex/course-linking`에서 신청 연동 로직 구현
