# src 구조 가이드

- `app/`: 앱 초기화 (providers, 글로벌 설정)
- `features/`: 도메인 기능 단위 코드
  - `diagnosis/`: AI 역량 진단
  - `recommendation/`: 교육 추천
  - `course-linking/`: 교육 신청 연동
  - `history/`: 진단/수강 이력
  - `chatbot/`: AI 챗봇 상담
- `shared/`: 공통 UI/유틸/타입/API
- `router/`: 페이지 라우팅
- `styles/`: 전역 스타일/디자인 토큰
- `mocks/`: API 목업 데이터
