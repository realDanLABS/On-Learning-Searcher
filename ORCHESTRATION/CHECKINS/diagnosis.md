# Wave2 Check-in: diagnosis

- updatedAt: 2026-03-08
- progress: 20
- status: IN_PROGRESS
- completed:
  - Recovery Plan 기준 diagnosis 소유 범위 확정
  - 결과 스냅샷과 갭 계산을 diagnosis 원천 계약으로 재확인
  - main drift 대비 diagnosis 회수 대상 파일 차이 검토 완료
  - recommendation / history / chatbot 전달 필드 계약 점검 완료
- inProgress:
  - worktrees/diagnosis로 질문 구조 / 결과 스냅샷 / 갭 계산 선별 회수 하달
  - 결과 페이지 신규 파일과 questionBank 신규 계약의 회수 순서 고정
- blockers:
  - 없음
- nextCommit:
  - feat(diagnosis): recover diagnosis snapshot and gap calculation from main drift
- validation:
  - 문서 검토 기준: recommendation / history / chatbot에서 동일 필드 재사용 가능 여부
  - 회수 검토 기준: 20문항 제조업 맥락 / 1x4 선택지 / `/recommendation` 연결 유지 여부
