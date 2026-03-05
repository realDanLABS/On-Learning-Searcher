# On Learning Searcher - Release Master Plan (Enterprise)

## Final Product Goal
랜딩 페이지에서 시작해,
진단 -> 추천 -> 신청 연동 -> 이력 추적까지
단절 없이 이어지는 엔드투엔드 학습 여정을 완성한다.

## E2E User Journey (Must Pass)
1. Landing
- 사용자 진입
- "역량 진단 시작" CTA 클릭

2. Diagnosis
- 질문 응답 완료
- 결과/갭 요약 확인
- "추천 과정 보기" CTA 클릭

3. Recommendation
- 진단 결과 기반 추천 카드 노출
- 이유 칩(왜 추천했는지) 확인
- "신청하기" CTA 클릭

4. Course Linking
- 과정 상세 확인
- 이캠퍼스 신청 링크 이동
- 복귀 후 상태 반영

5. History
- 진단 결과 이력 확인
- 수강/신청 상태 확인
- 성장 변화 요약 확인

6. Chatbot (Assist)
- "내 부족 역량", "추천 이유", "다음 학습" 질의
- 추천/이력 페이지로 deep-link 안내

## Worktree Scope and Definition of Done

### foundation
- 역할: 공통 레이아웃, 라우팅, 페이지간 이동 흐름
- DoD:
  - 랜딩 CTA -> Diagnosis 이동
  - 전역 네비로 핵심 페이지 이동 가능
  - 공통 컴포넌트 토큰 확정

### diagnosis
- 역할: 설문, 점수, 갭 계산
- DoD:
  - 결과 payload가 contract 형식으로 생성
  - 추천 페이지로 전달 가능한 상태 저장

### recommendation
- 역할: 추천 목록/필터/추천 이유
- DoD:
  - 진단 payload 반영
  - 과정 카드에서 신청 페이지로 이동

### course-linking
- 역할: 신청 링크/복귀/상태
- DoD:
  - 외부 신청 링크와 파라미터 매핑
  - 신청 결과 상태를 history로 전달

### history
- 역할: 이력/성과 추적
- DoD:
  - 진단+신청 이력 렌더링
  - 성장 요약 카드 제공

### chatbot
- 역할: 보조 가이드
- DoD:
  - 추천/이력 맥락 기반 답변
  - 링크 안내 동작

### responsive
- 역할: 품질 보정
- DoD:
  - 1440/1024/768/390 레이아웃 안정화

## Integration Contract
Reference: ORCHESTRATION/INTEGRATION_CONTRACT.md

## Release Gates
1. Feature Gate
- 핵심 CTA 흐름 모두 연결

2. Quality Gate
- lint/build 전 워크트리 통과
- 주요 플로우 수동 시나리오 통과

3. Demo Gate
- 랜딩부터 이력까지 끊김 없는 데모 1회 성공

## Priority Order
1. foundation
2. diagnosis
3. recommendation
4. course-linking
5. history
6. chatbot
7. responsive
