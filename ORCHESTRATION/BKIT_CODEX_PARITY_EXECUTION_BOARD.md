# bkit Codex Parity Execution Board

- generatedFrom: ORCHESTRATION/BKIT_CODEX_PARITY_MASTER_PLAN.md
- generatedAt: 2026-03-13

## Status Legend
- TODO
- IN_PROGRESS
- BLOCKED
- DONE

| Worktree | Status | Owner Role | Current Goal | Next Check |
|---|---|---|---|---|
| foundation | TODO | codex/foundation | Codex skill/agent metadata contract + config schema 정의 | 2026-03-13 |
| diagnosis | TODO | codex/diagnosis | PDCA flow and document templates Codex 규격화 | 2026-03-13 |
| recommendation | TODO | codex/recommendation | 35개 bkit skill 매핑표와 trigger 라우팅 작성 | 2026-03-13 |
| course-linking | TODO | codex/course-linking | Gemini hook/command를 Codex orchestration 지점으로 치환 | 2026-03-13 |
| history | TODO | codex/history | parity tracker + release readiness 문서화 | 2026-03-13 |
| chatbot | TODO | codex/chatbot | 21개 agent role prompt를 Codex 사양으로 변환 | 2026-03-13 |
| responsive | TODO | codex/responsive | Starter/Dynamic/Enterprise 검증 시나리오와 smoke pack 작성 | 2026-03-13 |

## Dependency Order
1. foundation unlocks all downstream schemas.
2. diagnosis and recommendation can run in parallel after foundation contract draft.
3. course-linking and chatbot depend on foundation terminology and recommendation mappings.
4. history consolidates outputs from all worktrees.
5. responsive validates once at least one draft exists from every worktree.

## Blocking Questions
- None requiring user input yet.
- Current working assumption: parity means behavioral equivalence, not Gemini-internal hook equivalence.

## Release Gate
1. All worktrees publish a written artifact in their own branch.
2. History branch confirms no unmapped skill/agent remains.
3. Responsive branch signs off on operator quickstart and scenario coverage.
