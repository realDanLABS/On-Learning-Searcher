# Wave2 Check-in: history

- updatedAt: 2026-03-08
- progress: 20
- status: IN_PROGRESS
- completed:
  - Recovery Plan 기준 history 소유 범위 확정
  - 관리자 direct-dev track과 history 소비 범위 분리 필요성 확인
  - main drift 기준 history 우선 회수 파일과 course-linking 최소 상태 계약 교차 점검 완료
- inProgress:
  - main drift에서 성장 추적 / 추천 과정 이력 회수 후보 diff 정리
  - analytics/admin 소비 범위와 direct-dev track 경계 확정
- blockers:
  - 오케스트레이터 역할 잠금으로 인해 history 워크트리 소스 직접 회수/커밋은 별도 구현 스레드 또는 역할 전환 지시가 필요
- nextCommit:
  - feat(history): recover growth tracking and history dashboard from main drift
- validation:
  - 문서 검토 기준: 개인 사용자와 관리자 모두 다음 액션을 읽을 수 있는지
  - 계약 검토 기준: history는 course-linking 상태 `requested`, `enrolled`, `failed`, `return-missing`와 선택적 `failureReason`만 소비할 것
