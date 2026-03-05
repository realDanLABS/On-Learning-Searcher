# Execution Board

## Status Legend
- TODO
- IN_PROGRESS
- BLOCKED
- DONE

| Worktree | Status | Owner Role | Current Goal | Next Check |
|---|---|---|---|---|
| foundation | TODO | Orchestrated | Landing->Diagnosis CTA + route coherence | T+0 |
| diagnosis | IN_PROGRESS | Orchestrated | Result payload contract alignment | T+0 |
| recommendation | TODO | Orchestrated | Recommendation cards from diagnosis payload | T+1 |
| course-linking | TODO | Orchestrated | Enrollment link mapping | T+1 |
| history | TODO | Orchestrated | Assessment+enrollment timeline | T+2 |
| chatbot | TODO | Orchestrated | Gap/reason contextual helper | T+2 |
| responsive | TODO | Orchestrated | Breakpoint QA and fixes | T+3 |

## Critical Risks
1. 페이지 간 데이터 전달 방식 미정(localStorage/state/query).
2. 신청 연동의 실제 API/외부 링크 정책 미확정.
3. 히스토리 집계 기준(진단 주기/완료 기준) 미확정.

## Mitigation
1. MVP는 localStorage contract로 고정 후 API 전환.
2. course-linking에서 매핑 테이블 먼저 고정.
3. history는 contract payload 기반으로 우선 구현.
