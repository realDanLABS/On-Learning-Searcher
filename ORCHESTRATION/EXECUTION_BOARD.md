# Execution Board

## Status Legend
- TODO
- IN_PROGRESS
- BLOCKED
- DONE

| Worktree | Status | Owner Role | Current Goal | Next Check |
|---|---|---|---|---|
| foundation | DONE | Orchestrator | Landing->진단 CTA 및 글로벌 네비 연결 완료 | complete |
| diagnosis | DONE | Orchestrator | Stepper + 결과 저장 + stage 전환 완료 | complete |
| recommendation | DONE | Orchestrator | 스킬 갭 패널 + 30/60/90 성장 로드맵 연결 완료 | complete |
| course-linking | DONE | Orchestrator | 신청 연동 CTA + stage 전환 완료 | complete |
| history | DONE | Orchestrator | 이력/퍼널/감사로그 + 여정 초기화 안정화 완료 | complete |
| chatbot | DONE | Orchestrator | 상담 UI MVP 및 라우트 연결 완료 | complete |
| responsive | DONE | Orchestrator | 반응형 기본 보정 + 라우트 보호 + E2E 회귀 통과 | complete |

## Current Gates (Commercialization)
1. 실 API/SSO 연결 전환 검증 (remote mode 실서버 smoke test).
2. 이캠퍼스 신청 딥링크 파라미터 운영 확정.
3. 운영용 접근제어/권한 정책 서버측 강제 검증.

## Mitigation
1. `VITE_API_MODE=remote` + SSO callback로 운영 환경 사전 점검.
2. course-linking 매핑표를 운영 정책 문서와 동기화.
3. 퍼널/감사로그를 릴리즈 지표로 고정하고 회귀 테스트 유지.
4. 로그아웃/초기화 시 임시 진단 데이터 정리 규칙 유지.
