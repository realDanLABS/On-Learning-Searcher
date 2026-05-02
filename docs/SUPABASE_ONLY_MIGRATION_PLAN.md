# Supabase-Only Migration Plan

## Goal
- Keep the frontend as a single `Next.js` app.
- Remove the internal `Next API` backend over time.
- Move auth, data access, permissions, and background logic to `Supabase Auth + Postgres + RLS + RPC + Edge Functions`.
- Do not change page markup or design during the migration.

## Non-Negotiable UI Rule
- No edits to user-facing layout or design are part of this migration phase.
- Migration work is limited to:
  - `lib/*` data access
  - `supabase/*` schema and policy assets
  - environment/runtime helpers

## Current Backend Surface
- Auth endpoints:
  - `/auth/login`
  - `/auth/signup`
  - `/auth/session`
  - `/auth/logout`
  - `/auth/callback`
- Learning endpoints:
  - `/diagnosis`
  - `/diagnosis/history`
  - `/recommendations`
  - `/recommendations/select`
  - `/selected-course`
  - `/enrollments`
  - `/journey/stage`
- Admin endpoints:
  - `/admin/dashboard`
  - `/admin/departments`
  - `/admin/questions`
  - `/admin/courses`
  - `/admin/courses/import`
  - `/admin/courses/import-history`
  - `/admin/users`
  - `/admin/boards`
  - `/admin/notices`
  - `/admin/faqs`
- AI endpoint:
  - `/chatbot/reply`

## Target Supabase Mapping

### 1. Supabase Direct Access
Good candidates for direct `supabase-js` access with RLS:
- profile read/update
- diagnosis read/write
- diagnosis history read
- selected course read/write
- enrollments read/write
- questions CRUD
- notices CRUD
- faqs CRUD

### 2. Supabase RPC
Good candidates for SQL/RPC because they involve derived output:
- recommendations
- journey stage
- admin dashboard aggregates
- admin department aggregates
- admin user listing with derived status

### 3. Supabase Edge Functions
Good candidates for Edge Functions because they need privileged or structured server logic:
- signup bridging to `auth.users` + `app.users`
- SSO callback handling
- bulk course import
- bulk user import
- chatbot reply generation
- protected admin mutations that need cross-row guardrails

## Added in This Phase
- `lib/data-mode.ts`
  - feature flag support
  - default remains `legacy-api`
- `lib/supabase/browser-client.ts`
  - browser-side Supabase client bootstrap
- `lib/supabase/types.ts`
  - typed surface for first migration objects
- `supabase/migrations/20260502_supabase_only_foundation.sql`
  - additive migration only
  - no destructive schema changes
  - `auth_user_id` bridge column
  - baseline RLS
  - helper functions
  - public read views

## Required Database Step
Apply:

```sql
supabase/migrations/20260502_supabase_only_foundation.sql
```

This file is additive and designed to be safe against the current UI.

## Recommended Execution Order

### Phase 1
- Apply additive Supabase migration
- Keep app in `legacy-api` mode
- Validate that current UI still works unchanged

### Phase 2
- Replace read-only data paths first:
  - notices/faqs
  - questions
  - courses
- Use feature flags or adapter-by-adapter migration

### Phase 3
- Move diagnosis, selected course, enrollment flows

### Phase 4
- Move admin CRUD

### Phase 5
- Move aggregates to RPC

### Phase 6
- Move auth and SSO

### Phase 7
- Remove internal API layer

## Risk Notes
- `Supabase-only` still means using more than raw tables:
  - `Auth`
  - `RLS`
  - `Views`
  - `RPC`
  - `Edge Functions`
- A direct browser-to-table rewrite without RLS/RPC would be unsafe for admin paths.

## Current Safe Toggle
- default mode: `legacy-api`
- future mode: `supabase`

Until adapters are migrated, the UI should remain on `legacy-api`.
