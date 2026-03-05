# Production Readiness Checklist

## 1. Product Flow
- [x] Landing -> Diagnosis -> Recommendation -> Course Linking -> History end-to-end flow
- [x] Chatbot quick intents connected to recommendation/history context
- [x] Responsive QA page and baseline mobile behavior

## 2. Security & Privacy
- [ ] SSO (SAML/OIDC) integration
- [ ] RBAC (employee / manager / admin)
- [ ] PII masking and retention policy
- [ ] Audit logging for diagnosis/recommendation/enrollment actions

## 3. Backend Integration
- [ ] Replace localStorage contracts with backend API
- [ ] Persist diagnosis payload and recommendation responses server-side
- [ ] Enrollment status sync from e-campus API
- [ ] Retry/timeout/fallback policy for external APIs

## 4. Reliability
- [x] CI lint/build on PR and main
- [ ] E2E smoke test in CI
- [ ] Error tracking integration (Sentry etc.)
- [ ] Feature flags for safe rollout

## 5. Observability
- [ ] Funnel metrics: landing->diagnosis->recommendation->enrollment
- [ ] Drop-off metrics by step
- [ ] Dashboard for weekly learning conversion

## 6. Release
- [ ] Staging environment sign-off
- [ ] Security review sign-off
- [ ] UAT sign-off from HR/L&D stakeholders
- [ ] Rollback runbook prepared
