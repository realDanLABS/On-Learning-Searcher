# Stitch Redesign Copypaste Messages

## foundation
```text
[오케스트레이터 하달] foundation / Stitch Redesign

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/foundation

목표:
- Google Stitch 홈/디자인 시스템 시안 기준으로 공통 레이아웃을 리디자인

필수 작업:
- 글로벌 헤더, 브랜드 바, 상단 CTA 구조 정리
- 공통 KPI 카드, 버튼, 배지, 패널, 상태 표현 토큰 정리
- 단계 진행바를 전 페이지 공통 UI로 고정
- 로딩/빈 상태/오류 상태를 동일한 시각 언어로 통일

제약:
- 기능 로직, 라우팅, 인증/권한/단계 가드 로직은 건드리지 말 것
- 표현만 개선할 것

완료 기준:
- 홈과 공통 레이아웃만 봐도 Stitch 계열 엔터프라이즈 톤이 느껴질 것
- 다른 워크트리가 그대로 붙일 수 있는 공통 기반이 준비될 것
```

## diagnosis
```text
[오케스트레이터 하달] diagnosis / Stitch Redesign

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/diagnosis

목표:
- 진단 설문 + 진단 결과 리포트를 Stitch 시안 기준으로 리디자인

필수 작업:
- 질문 카드, 선택지, 진행률, 하단 액션을 더 명확하게 재배치
- 결과 화면을 종합 점수, 스킬맵, 강점, 보완 역량, 추천 CTA 구조로 재정리
- 임시 MVP 느낌 문구를 제품형 마이크로카피로 교체

제약:
- 질문/응답/점수 계산/payload 계약은 유지

완료 기준:
- 설문은 더 읽기 쉬워지고 결과는 추천으로 자연스럽게 넘어갈 것
```

## recommendation
```text
[오케스트레이터 하달] recommendation / Stitch Redesign

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/recommendation

목표:
- 추천 목록을 Stitch 추천 카드형 구조로 리디자인

필수 작업:
- 상단 추천 요약 바 구성
- 카드형 레이아웃 재구성
- 추천 이유 칩/설명 강화
- 이미지 비중 축소, 텍스트 위계 강화
- 상세보기 + 수강 신청 CTA 유지

제약:
- 추천 로직과 선택/이동 기능은 유지

완료 기준:
- 사용자가 왜 이 과정이 추천되었는지 한눈에 이해할 수 있을 것
```

## course-linking
```text
[오케스트레이터 하달] course-linking / Stitch Redesign

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/course-linking

목표:
- 과정 상세/신청 연동 페이지를 Stitch 상세 시안 기준으로 리디자인

필수 작업:
- 학습 목표, 커리큘럼, 기대 효과, 우측 신청 패널 재정렬
- 외부 이캠퍼스 이동 안내 UX를 더 신뢰감 있게 정리
- 신청 완료 이후 복귀 흐름 안내를 명확히 구성

제약:
- 신청 연동 기능과 복귀 로직은 유지

완료 기준:
- 신청 전환 직전 페이지로서 신뢰감과 명확성이 높아질 것
```

## history
```text
[오케스트레이터 하달] history / Stitch Redesign

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/history

목표:
- 성장 대시보드와 학습 이력 화면을 Stitch 이력 시안 기준으로 리디자인

필수 작업:
- KPI 카드, 성장 타임라인, 집중 강화 역량, 이력 테이블 위계 재정리
- 프로토타입성 잠금 문구를 실제 상태 기반 액션 문구로 교체
- 관리자 요약은 일반 사용자 경험과 분리된 보조 영역으로 유지

제약:
- 기존 데이터 표시 로직은 유지

완료 기준:
- 사용자가 자신의 성장과 수강 이력을 빠르게 파악할 수 있을 것
```

## chatbot
```text
[오케스트레이터 하달] chatbot / Stitch Redesign

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/chatbot

목표:
- 챗봇 상담 UI를 Stitch 3열 구조 기준으로 리디자인

필수 작업:
- 좌측 진단 요약/로드맵 패널 구성
- 중앙 대화 영역과 카드 삽입형 추천 응답 구성
- 우측 팁/최근 상담 패널 구성
- 빠른 질문 버튼을 더 제품답게 정리

제약:
- 기존 빠른 질문, 답변 분기, 링크 이동 기능은 유지

완료 기준:
- 챗봇이 부가 기능이 아니라 실제 학습 가이드처럼 보일 것
```

## responsive
```text
[오케스트레이터 하달] responsive / Stitch Redesign

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/responsive

목표:
- Stitch 기준 데스크톱 시안을 태블릿/모바일까지 안정화

필수 작업:
- 1440 / 1024 / 768 / 390 기준 QA
- 추천 카드, 챗봇 3열, 이력 표, 하단 액션 바 축소 규칙 점검
- 오버플로우, 겹침, 버튼 접근성, 스크롤 스트레스 보정

제약:
- 공통 스타일을 우선 사용하고 페이지별 예외를 최소화할 것

완료 기준:
- 모바일과 태블릿에서도 주요 CTA와 핵심 정보가 유지될 것
```
