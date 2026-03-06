# Execution Board (Wave2 Draft)

- generatedFrom: ORCHESTRATION/CHECKINS
- generatedAt: 2026-03-06

## Status Legend
- TODO
- IN_PROGRESS
- BLOCKED
- DONE

| Worktree | Status | Owner Role | Current Goal | Next Check |
|---|---|---|---|---|
| foundation | IN_PROGRESS | Orchestrator | Wave2: 공통 상태 컴포넌트 + 릴리즈 메타 표기 (0%) | 2026-03-06 |
| diagnosis | IN_PROGRESS | Orchestrator | Wave2: 문항 확장 + 이탈 이벤트 계측 (0%) | 2026-03-06 |
| recommendation | IN_PROGRESS | Orchestrator | Wave2: 추천 근거 모달 + 즐겨찾기/보류 (0%) | 2026-03-06 |
| course-linking | IN_PROGRESS | Orchestrator | Wave2: 신청 실패 재시도 + 콜백 검증 강화 (0%) | 2026-03-06 |
| history | IN_PROGRESS | Orchestrator | Wave2: 벤치마크 위젯 + 월간 리포트 다운로드 (0%) | 2026-03-06 |
| chatbot | IN_PROGRESS | Orchestrator | Wave2: 컨텍스트 상담 + 종료 후 다음액션 (0%) | 2026-03-06 |
| responsive | IN_PROGRESS | Orchestrator | Wave2: 접근성 QA + 모바일 UX 보강 (0%) | 2026-03-06 |
| integration-qa | DONE | Orchestrator | Wave2 통합회귀(로컬+remote) 릴리즈 게이트 통과 (`release:check:full`, 107+32+1 PASS) | 2026-03-06 |

## Current Gates (Commercialization)
1. 실 API/SSO 연결 전환 검증 (remote mode 실서버 smoke test).
2. 이캠퍼스 신청 딥링크 파라미터 운영 확정.
3. 운영용 접근제어/권한 정책 서버측 강제 검증.

## Mitigation
1. `VITE_API_MODE=remote` + SSO callback로 운영 환경 사전 점검.
2. course-linking 매핑표를 운영 정책 문서와 동기화.
3. 퍼널/감사로그를 릴리즈 지표로 고정하고 회귀 테스트 유지.
4. 로그아웃/초기화 시 임시 진단 데이터 정리 규칙 유지.
