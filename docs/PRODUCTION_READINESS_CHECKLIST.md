# Production Readiness Checklist

## 1. Product Flow
- [x] Landing -> Diagnosis -> Recommendation -> Course Linking -> History end-to-end flow
- [x] Chatbot quick intents connected to recommendation/history context
- [x] Responsive QA page and baseline mobile behavior

## 2. Security & Privacy
- [x] SSO (SAML/OIDC) integration path and callback route
- [x] RBAC (employee / manager / admin)
- [x] PII masking and retention policy
- [x] Audit logging for diagnosis/recommendation/enrollment actions

## 3. Backend Integration
- [ ] Replace localStorage contracts with backend API
- [x] Remote API contract rehearsal via local mock server (`npm run dev:remote-mock`)
- [ ] Persist diagnosis payload and recommendation responses server-side
- [ ] Enrollment status sync from e-campus API
- [x] Retry/timeout/fallback policy for external APIs

## 4. Reliability
- [x] CI lint/build on PR and main
- [x] Unit/integration tests for journey orchestration
- [x] Browser E2E smoke test in CI (`e2e/journey-smoke.spec.ts`)
- [x] Error tracking integration (Sentry etc.)
- [x] Feature flags for safe rollout

## 5. Observability
- [x] Funnel metrics: landing->diagnosis->recommendation->enrollment
- [x] Drop-off metrics by step
- [x] Dashboard for weekly learning conversion

## 6. Release
- [ ] Staging environment sign-off
- [ ] Security review sign-off
- [ ] UAT sign-off from HR/L&D stakeholders
- [x] Rollback runbook prepared
- [x] One-command release quality check (`npm run release:check`)
- [x] Remote env/API smoke check script (`npm run remote:smoke`)
