# Security Baseline (Frontend)

## Data Handling
- Do not store sensitive personal data in localStorage.
- Move diagnosis/recommendation persistence to backend API for production.

## Authentication
- Integrate SSO (OIDC/SAML) before production.
- Enforce role checks for manager/admin summary views.
- Minimum role policy:
  - employee: diagnosis/recommendation/enrollment/history (personal)
  - manager: team summary + manager dashboard blocks
  - admin: all views + operations configuration

## Network
- Use HTTPS only.
- Define API timeout/retry policy.

## Audit
- Record key actions: diagnosis submitted, course selected, enrollment completed.
- Send audit events to backend logging pipeline.

## Secrets
- Keep secrets out of client bundle.
- Use env vars only for non-secret public config values.
