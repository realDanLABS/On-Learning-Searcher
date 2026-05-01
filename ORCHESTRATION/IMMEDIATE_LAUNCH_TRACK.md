# Immediate Launch Track

## 목적
문서가 많아도 바로 시작점이 흔들리지 않도록,
오늘 당장 착수해야 할 상용화 핵심 4개 트랙만 분리한다.

## Track 1. Home Continuity
owner:
- foundation

목표:
- 사용자가 홈에 들어오자마자 "지금 어디까지 왔는지"와 "다음에 무엇을 해야 하는지"를 즉시 이해하게 만든다.

핵심 작업:
- 현재 단계 / 다음 액션 / 저장 과정 / 최근 변화의 시각 위계 정리
- 저장 과정 카드의 공통 액션 규칙 정리
- 공통 Empty / Error / Guard 문구 가이드 작성

완료 기준:
- 홈 진입 5초 안에 현재 상태 파악 가능

## Track 2. Diagnosis Contract
owner:
- diagnosis

목표:
- 진단 결과가 recommendation / history / chatbot에 같은 의미로 흘러가도록 계약을 정식화한다.

핵심 작업:
- `resultSnapshotId`, `strengthAreas`, `recommendedFocusSummary` 포함
- 중도 이탈 / 임시저장 / 복귀 이벤트 정의
- 결과 화면의 강점 / 보완 / 추천 이유 위계 정리

완료 기준:
- 진단 결과를 세 페이지가 같은 의미로 재사용 가능

## Track 3. Recommendation-to-Apply Clarity
owner:
- recommendation
- course-linking

목표:
- 사용자가 추천 10개를 보고 납득한 뒤 바로 신청까지 이어지게 만든다.

핵심 작업:
- 추천 근거 패널 확정
- 우선순위 / 난이도 적합성 / 기대 업무효과 설명 정리
- 신청 성공 / 실패 / 복귀 누락 상태 정의
- 이캠퍼스 파라미터 운영안 문서화

완료 기준:
- 추천 화면만 보고도 왜 추천됐는지 이해 가능
- 외부 이동 전후 상태가 끊기지 않음

## Track 4. Growth and Operations
owner:
- history
- chatbot

목표:
- 개인 성장 추적과 관리자 운영 해석, 그리고 챗봇의 다음 액션 유도를 한 세트로 연결한다.

핵심 작업:
- 재진단 전후 성장 변화 카드 고도화
- 전환율 / 드롭오프 / 액션 제안 흐름 정리
- 상태 기반 챗봇 답변 매트릭스 정리

완료 기준:
- 개인/운영자 모두 다음 액션을 읽을 수 있음

## Final QA
owner:
- responsive

목표:
- 위 4개 트랙이 해상도와 접근성 관점에서 깨지지 않게 보정

핵심 작업:
- 저장 카드 / 비교 패널 / 관리자 그리드 / 챗봇 레이아웃 QA
- 1440 / 1280 / 1024 / 768 / 430 / 390 점검
- 포커스 / ARIA / 색 대비 점검

완료 기준:
- 핵심 여정이 데스크톱 / 태블릿 / 모바일에서 모두 유지됨
