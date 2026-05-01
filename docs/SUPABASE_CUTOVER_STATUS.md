# Supabase Cutover Status

## Current Status

- Supabase Postgres connection verified with `SUPABASE_DB_URL`.
- `supabase/schema.sql` applied successfully to the new Supabase project.
- Core `app.*` tables exist on Supabase:
  - `users`
  - `sessions`
  - `diagnoses`
  - `selected_courses`
  - `enrollments`
  - `journey_events`
  - `questions`
  - `courses`
  - `notices`
  - `faqs`
- Seed readiness verified through `api/_lib/db.js::ensureSchema()`.
- Seeded baseline data confirmed on Supabase:
  - `users`: 1
  - `questions`: 20
  - `courses`: 8
  - `notices`: 3
  - `faqs`: 4

## Important Note

The repository is partially cut over and now uses the shared Postgres-backed API path in both places below:

- Vercel/API route backend: Postgres/Supabase-ready
- Local Node server: reworked to reuse the same `/api` handler instead of SQLite
- Frontend default runtime: Next.js same-origin `/api` by default, optional override via `NEXT_PUBLIC_API_BASE_URL`

## Recommended Next Step

1. Run the app in remote mode against `/api` or the local Postgres-backed server.
2. Verify login, signup, diagnosis, recommendations, enrollments, and admin CRUD end-to-end.
3. Once remote mode is the default development path, start the Next.js migration.
