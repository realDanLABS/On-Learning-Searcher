# Release Runbook

## Pre-release
1. `npm run test`
2. `npm run lint`
3. `npm run build`
4. E2E demo path: Landing -> Diagnosis -> Recommendation -> Course Linking -> History
5. e-campus callback contract:
   - return URL target: `/course-linking`
   - required query: `enrollment=success|failed`
   - optional query: `courseId=<ID>`

## Rollout
1. Deploy to staging
2. Stakeholder UAT sign-off
3. Production deploy

## Post-release Monitoring
1. Check funnel on landing summary
2. Validate no major drop on diagnosis->recommendation conversion
3. Check enrollment event generation in history timeline

## Rollback
1. Revert latest release commit
2. Redeploy previous stable artifact
3. Re-run smoke flow
