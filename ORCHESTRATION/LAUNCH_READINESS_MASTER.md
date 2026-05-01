# Launch Readiness Master

## 제품 목표
현대위아 구성원이 자신의 역량을 스스로 진단하고,
AI 분석을 통해 개인 맞춤형 온라인 교육 과정을 추천받아
즉시 신청하고 성장 추적까지 이어지는 학습 여정을 완성한다.

핵심 흐름:
- 진단 -> 추천 -> 신청 -> 성장 추적

## 지금 당장 해야 할 순서
1. foundation
2. diagnosis
3. recommendation
4. course-linking
5. history
6. chatbot
7. responsive

## 워크트리별 최종 목표

### foundation
- 홈을 "이어가기 허브"로 완성
- 현재 단계 / 다음 액션 / 저장 과정 / 최근 변화를 한 화면에서 이해 가능하게 구성
- 공통 상태 패턴(Empty / Error / Guard / Loading) 정리

### diagnosis
- 재진단 비교 가능한 결과 계약 확정
- 결과 스냅샷 필드 정식화
- 이탈 / 임시저장 / 복귀 이벤트 정의

### recommendation
- 추천 10개의 이유를 설명 가능한 화면으로 완성
- 우선순위 / 난이도 적합성 / 기대 업무효과 설명 강화
- 저장 / 비교 / 신청 액션 충돌 정리

### course-linking
- 신청 성공 / 실패 / 복귀 누락 상태 통일
- 이캠퍼스 파라미터 운영안 정리
- 신청 직전 설득 영역 강화

### history
- 재진단 전후 성장 변화 가시화
- 관리자용 전환율 / 드롭오프 / 액션 제안 흐름 정리

### chatbot
- 현재 상태 기반 답변 정리
- 추천 / 신청 / 이력 기준 다음 액션 유도

### responsive
- 전 페이지 반응형 / 접근성 QA 완료

## P0 런치 게이트
- 홈에서 현재 상태와 다음 액션이 즉시 보인다.
- 진단 결과가 recommendation / history / chatbot에서 같은 의미로 읽힌다.
- 추천 화면만 보고도 왜 이 과정이 추천됐는지 이해된다.
- 신청 전후 상태가 history와 chatbot에 일관되게 반영된다.

## 핵심 리스크
1. 이캠퍼스 딥링크 파라미터 미확정
2. 진단/추천/이력 상태 계약 미정
3. 추천 이유 설명 부족으로 신청 전환 저하
4. 신청 복귀 누락 상태 해석 불일치

## 기준 문서
- `ORCHESTRATION/IMMEDIATE_LAUNCH_TRACK.md`
- `ORCHESTRATION/WAVE3_SPRINT_BACKLOG.md`
- `ORCHESTRATION/WAVE3_RISK_REGISTER.md`
- `ORCHESTRATION/COMMERCIALIZATION_CHECKLIST.md`
- `ORCHESTRATION/INTEGRATION_CONTRACT.md`
- `ORCHESTRATION/DISPATCH_WAVE_3_COPYPASTE_MESSAGES.md`

## 오케스트레이터 결론
- 지금은 새 기능을 더 벌리는 단계가 아니다.
- 홈 재진입 UX, 결과 계약, 추천 설명력, 신청 상태 일관성, 성장 추적 연결을 먼저 닫아야 한다.
- 위 5개가 닫히면 온러닝서처는 데모를 넘어 상용화 직전 수준으로 올라간다.
