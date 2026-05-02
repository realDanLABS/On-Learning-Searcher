# Admin RPC Migration Plan

## Goal
- Keep the current admin UI and design exactly as-is.
- Replace the legacy `/api/admin/*` backend with Supabase-native RPC and a small number of Edge Functions.
- Avoid direct `supabase-js` CRUD against the `app` schema from the browser until the RPC surface is complete.

## Why This Needs RPC
- The real admin data lives in the `app` schema.
- The current Supabase REST surface is centered on `public`, not arbitrary internal admin tables.
- The admin pages depend on derived payloads, not raw rows:
  - dashboard KPIs
  - department comparison aggregates
  - derived user status
  - import history formatting
- Browser-side reimplementation of all of that is possible, but it creates drift and weakens guardrails.

The correct target is:
- reads: `public admin_* RPC`
- writes: `public admin_* RPC` or `Edge Functions`
- permission: `SECURITY DEFINER` + internal admin checks

## Current Admin Surface

### Read endpoints
- `/admin/dashboard`
- `/admin/departments`
- `/admin/questions`
- `/admin/courses`
- `/admin/courses/import-history`
- `/admin/users`
- `/admin/boards`

### Write endpoints
- `/admin/questions` `POST`
- `/admin/questions/:id` `PUT/DELETE`
- `/admin/courses` `POST`
- `/admin/courses/:id` `PUT/DELETE`
- `/admin/courses/import` `POST`
- `/admin/users` `POST`
- `/admin/users/import` `POST`
- `/admin/users/:id` `PUT/DELETE`
- `/admin/notices` `POST`
- `/admin/notices/:id` `PUT/DELETE`
- `/admin/faqs` `POST`
- `/admin/faqs/:id` `PUT/DELETE`

## Proposed RPC Surface

### 1. Dashboard and departments

#### `public.admin_dashboard_payload() -> jsonb`
Returns the exact payload shape used by:
- `AdminDashboardPayload`

Contents:
- `userName`
- `organization`
- `kpis`
- `funnel`
- `insights`
- `urgentActions`
- `departmentComparisons`
- `trendComparison`
- `summary`

Rules:
- `current_app_role() = 'admin'` required
- `SECURITY DEFINER`
- no client-side post-processing except JSON parse

#### `public.admin_departments_payload(p_division text default null) -> jsonb`
Returns the exact payload shape used by:
- `AdminDepartmentsPayload`

Contents:
- `userName`
- `focusDivision`
- `filters`
- `kpis`
- `competencyComparison`
- `topCourses`
- `departments`
- `summary`

Rules:
- admin only
- `SECURITY DEFINER`

### 2. Questions

#### `public.admin_questions_payload() -> jsonb`
Returns:
- `{ userName, questions }`

#### `public.admin_question_create(p_title text, p_category text, p_options jsonb default null) -> void`

#### `public.admin_question_update(p_id text, p_title text, p_category text) -> void`

#### `public.admin_question_delete(p_id text) -> void`

### 3. Courses

#### `public.admin_courses_payload() -> jsonb`
Returns:
- `{ userName, courses }`

This should include derived `users` counts from enrollments, not just raw course rows.

#### `public.admin_course_create(...) -> void`
Parameters:
- `p_course_title`
- `p_competency_area`
- `p_level`
- `p_duration_hours`
- `p_summary`
- optional JSON arrays for objectives/target/outcomes/reason tags

#### `public.admin_course_update(...) -> void`

#### `public.admin_course_delete(p_id text) -> void`

### 4. Course import

#### `public.admin_course_import_history_payload() -> jsonb`
Returns:
- `AdminCourseImportHistoryItem[]`

#### Edge Function: `admin-course-import`
Why function, not pure RPC:
- bulk payload
- replace mode
- insert many rows
- failure logging
- future file parsing or storage integration

Request:
- `rows`
- `replace`
- `fileName`

Response:
- `{ ok, importedCount, replace }`

### 5. Users

#### `public.admin_users_payload() -> jsonb`
Returns:
- `{ userName, users }`

Derived fields that must stay server-owned:
- `status`
- `diagnosisDate`
- role normalization

#### `public.admin_user_create(...) -> uuid`

#### `public.admin_user_update(...) -> void`

#### `public.admin_user_delete(p_id uuid, p_confirmation_employee_id text) -> void`
Guardrails:
- cannot delete current admin
- cannot delete last admin
- employee id confirmation must match

#### Edge Function: `admin-user-import`
Why function:
- bulk dedupe/update
- future CSV/XLSX normalization

### 6. Boards

#### `public.admin_boards_payload() -> jsonb`
Returns:
- `{ userName, notices, faqs }`

#### `public.admin_notice_create(...) -> void`
#### `public.admin_notice_update(...) -> void`
#### `public.admin_notice_delete(p_id text) -> void`

#### `public.admin_faq_create(...) -> void`
#### `public.admin_faq_update(...) -> void`
#### `public.admin_faq_delete(p_id text) -> void`

## Security Model

### Required pattern
Every admin RPC must start with:

```sql
if public.current_app_role() <> 'admin' then
  raise exception 'Forbidden';
end if;
```

### Recommended implementation mode
- `SECURITY DEFINER`
- explicit `search_path = public, app`
- never expose raw `app.*` tables directly to browser clients

### Why not browser direct CRUD
- breaks once `app` is not exposed via REST
- spreads business rules into TypeScript
- weakens deletion/import/role guardrails
- makes payload drift likely

## Rollout Order

### Phase A
- `admin_dashboard_payload`
- `admin_departments_payload`
- `admin_questions_payload`
- `admin_courses_payload`
- `admin_users_payload`
- `admin_boards_payload`

This is enough to move read paths first.

### Phase B
- question/course/notice/faq/user single-row write RPCs

### Phase C
- `admin-course-import` Edge Function
- `admin-user-import` Edge Function

### Phase D
- switch `lib/admin-client.ts` from legacy API to RPC/function calls
- remove admin fallback from `api/handler.js`

## Definition of Done
- `components/admin-template-screen.tsx` no longer fetches `/api/admin/*`
- `lib/admin-client.ts` uses only:
  - Supabase RPC
  - Supabase Edge Functions
- current admin screens render identical payloads
- role/deletion/import guardrails match legacy behavior
- `api/handler.js` admin routes can be deleted without UI regression

## Recommendation
- Do not continue the half-step browser direct migration for admin.
- Finish `auth/callback` on Supabase.
- Then implement the admin RPC surface in one controlled pass.
- Keep `admin` on legacy until the full read RPC set exists.
