# Wave 3 Risk Register

## 목적
상용화 직전까지 영향을 줄 수 있는 리스크를
조기에 추적하고 워크트리별 대응 책임을 명확히 한다.

| ID | Risk | Impact | Likelihood | Owner Worktree | 대응 |
|---|---|---|---|---|---|
| R1 | 이캠퍼스 딥링크 파라미터 운영 기준 미확정 | 높음 | 높음 | course-linking | 파라미터 표 작성 후 운영 검토 요청 |
| R2 | 진단 결과 계약과 실제 저장 정책 불일치 | 높음 | 중간 | diagnosis | 결과 스냅샷 계약 정식화 |
| R3 | 추천 이유 설명 부족으로 신청 전환 저하 | 높음 | 높음 | recommendation | 추천 근거 패널/산식 요약 정리 |
| R4 | 홈 재진입 시 현재 단계가 불명확함 | 중간 | 높음 | foundation | 현재 단계 / 다음 액션 위계 재정렬 |
| R5 | 신청 복귀 누락 상태가 history/chatbot과 다르게 해석됨 | 높음 | 중간 | course-linking | `return-missing` 상태 정의 및 공유 |
| R6 | 관리자 지표가 데모 데이터에 머물러 운영 판단 오류 가능 | 중간 | 중간 | history | 지표 의미 / 한계 / 향후 API 교체점 문서화 |
| R7 | 챗봇 답변이 현재 상태와 어긋날 가능성 | 중간 | 중간 | chatbot | 상태 기반 답변 매트릭스 정리 |
| R8 | 저장 카드 / 비교 패널 / 관리자 그리드가 모바일에서 깨질 가능성 | 중간 | 높음 | responsive | 해상도별 QA와 축소 규칙 문서화 |
| R9 | Empty / Error / Guard 문구가 페이지마다 달라 제품 톤이 흔들림 | 중간 | 중간 | foundation | 공통 카피 가이드 작성 |
| R10 | remote smoke test 미준비로 운영 전환 직전 리스크 발견 지연 | 높음 | 중간 | integration-qa | remote/SSO smoke test 계획 문서화 |

## 우선 대응 순서
1. R1
2. R2
3. R3
4. R5
5. R4

## 해소 조건
- R1: 운영 검토 가능한 이캠퍼스 파라미터 문서 존재
- R2: 최신 역량 체계 기준 결과 계약 확정
- R3: 추천 화면에서 카드만 보고도 추천 이유 설명 가능
- R5: 신청 상태가 history / chatbot / home에 동일 의미로 반영
- R4: 홈에서 현재 상태와 다음 액션이 즉시 식별 가능
