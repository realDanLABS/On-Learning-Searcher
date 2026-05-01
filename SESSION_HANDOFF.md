# Session Handoff

## Current State

- Production deployed on Vercel
  - `https://project-w83ad.vercel.app`
- Supabase Postgres is the source of truth for:
  - users
  - sessions
  - diagnoses
  - questions
  - courses
  - notices / faqs
- Core local build passes with:
  - `npm run build`

## Important Architecture Notes

- Learning pages are mixed:
  - `/history` is Next-native
  - home and several learner pages still rely on `public/stitch-runtime/*` with runtime patching
- Admin pages are mixed:
  - `/admin/departments` is now a dedicated Next screen
  - `/admin/questions`, `/admin/users`, `/admin` still use template-driven rendering in parts
- Recommendation logic lives in:
  - [api/[...route].js](./api/[...route].js)
- Thumbnail generation lives in:
  - [lib/stitch-ui.ts](./lib/stitch-ui.ts)

## Recommendation Logic

- Recommendations are no longer allowed to cluster too heavily in one competency area.
- Top recommendations are diversified by top gap areas first.
- Same competency area is capped at `max 2` within the top 5 recommendations.
- This was adjusted to fix `홍수민 / 32960` learning path over-concentration in `AI/자동화 활용`.

## Admin / Learner Changes Completed

- Learner top bar role badge added
  - `관리자` / `학습자`
- Admin top bar role badge added
- `/admin/questions`
  - upload card works against Supabase course import API
  - real question list applied
  - 20 questions shown with pagination `5 per page`
- `/admin/users`
  - real Supabase users
  - edit / role / delete wired
  - bulk upload and sample download added
- `/admin/departments`
  - converted to dedicated Next screen
  - cards and table wired to real data

## Data Notes

- Course upload is replacement-based
  - latest uploaded Excel replaces recommendation source courses
- User bulk upload is cumulative
  - uploaded members are added or updated in Supabase

## Known Warnings

- `app/layout.tsx`
  - Google font warning from Next lint
- `components/history-screen.tsx`
  - `<img>` warning
- `app/globals.css`
  - autoprefixer warning about `end` vs `flex-end`

## Recent Deployment Fixes

- Vercel deployment initially failed because Vercel expected `.next`, while local safe runner used `.next-build`.
- Fixed in:
  - [next.config.mjs](./next.config.mjs)
  - [scripts/next-safe-runner.mjs](./scripts/next-safe-runner.mjs)

## Suggested First Checks Next Session

1. Verify production login and admin access
2. Verify `/learning-path` for `32960` still shows diversified top 5
3. Smoke test:
   - `/admin/questions`
   - `/admin/users`
   - `/admin/departments`
   - `/history`
4. Decide whether to continue removing remaining stitch-based learner pages
