# Wave2 Check-in: recommendation

- updatedAt: 2026-03-08
- progress: 20
- status: IN_PROGRESS
- completed:
  - Recovery Plan 기준 recommendation 소유 범위와 회수 대상 파일 확정
  - main drift 대비 recommendation 우선 회수 파일 diff 규모 확인
  - course-linking과 겹치는 learningApi / learningFlow 경계 필드 표시
- inProgress:
  - main drift에서 추천 카드 / 추천 이유 / 학습 경로 / 저장-이어가기 recommendation 범위 선별 회수 하달
  - 상위 추천 3개 기준 일관성 검증 포인트와 제외 범위(admin direct-dev track) 고정
- blockers:
  - 없음
- nextCommit:
  - feat(recommendation): recover recommendation flow and learning state from main drift
- validation:
  - 추천 카드 단독으로 추천 이유 설명 가능 여부
  - 추천 카드 / 학습이력 / 현재 이어갈 학습이 상위 추천 3개 기준과 일관적인지 확인
  - Learning Path 페이지가 하단 고정 저장 바 없는 최종 상태를 유지하는지 확인
