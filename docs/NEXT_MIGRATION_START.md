# Next.js Migration Start

## Why The Migration Starts Now

- Supabase/Postgres backend path is already unified.
- Local Node server now reuses the same API handler as the Vercel path.
- Vercel frontend deployment should happen after the Next.js app becomes the primary frontend.

## Current Strategy

- migration completed: root app now runs on Next.js App Router
- `next-app/` remains only as historical scaffold until separately archived
- expose legacy pages through an iframe bridge for visual comparison
- move routes in this order:
  1. auth
  2. diagnosis
  3. recommendation
  4. course-linking
  5. history/chatbot/admin

## Vercel Timing

Use Vercel for the frontend after:

1. Next auth and primary journey routes exist
2. Next app uses the unified Supabase-backed API path
3. the old Vite app is no longer the primary entry and is excluded from the active build
