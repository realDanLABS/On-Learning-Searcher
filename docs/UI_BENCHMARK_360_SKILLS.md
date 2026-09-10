# On Learning Searcher UI Benchmark (360Learning Skills Reference)

## Reference
- Primary: https://360learning.com/product/skills/

## Benchmark Goal
Build an enterprise-grade UX for:
1. skill diagnosis (survey)
2. skills-gap visualization
3. personalized course recommendation
4. growth-path tracking

## Core UX Pattern to Mirror
1. Skills profile first
- single place for skill status/history
- self-assessment + manager validation hooks

2. Gap visibility
- current vs target skill level
- clear "what to learn next" prompt

3. Campaign-style upskilling
- role/job-based development tracks
- measurable skill improvement, not completion-only

4. AI recommendation with rationale
- recommendations tied to skill goals
- explain "why this course"

## Information Architecture (Desktop-first)
1. Home / Dashboard
- My skill score summary
- Top 3 skill gaps
- Recommended courses
- Active growth goal

2. Diagnosis
- 10~20 question stepper
- section progress and save/resume
- score by category

3. Skills Profile
- radar/bar chart by skill domain
- latest assessment history
- target role and required skills

4. Recommendations
- recommended courses list
- filter (role, level, time)
- recommendation reason chips

5. Growth Path
- milestone timeline
- completed/in-progress/pending
- projected completion date

6. History & Impact
- assessment trend
- learning completion vs skill growth
- manager-share summary block

## Enterprise UI Requirements
1. Layout
- 12-column grid desktop
- sticky left nav + top utility bar
- card-based content hierarchy

2. Visual style
- neutral enterprise palette + one strong primary
- dense-but-readable table/card spacing
- explicit status colors (done/in progress/risk)

3. Components
- KPI card, progress bar, skill badge, gap chip
- recommendation card with reason tags
- timeline step + status pill

4. Accessibility
- keyboard navigation for stepper
- AA-level contrast target
- clear aria labels for progress and chart summaries

## On Learning Searcher Screen Set (MVP)
1. `DashboardPage`
2. `DiagnosisPage` (already started)
3. `SkillsProfilePage`
4. `RecommendationPage`
5. `GrowthPathPage`
6. `HistoryPage`

## Worktree Delivery Split
1. foundation
- design tokens, layout shell, dashboard scaffolding

2. diagnosis
- stepper + category scoring + save/resume

3. recommendation
- recommendation cards + filters + reason chips

4. course-linking
- deep links to e-campus enrollment and return flow

5. history
- trend charts + impact summary blocks

6. chatbot
- contextual assistant linked to gaps and recommendations

7. responsive
- 1440/1024/768/390 optimization for all above screens

## Acceptance Criteria (Enterprise Baseline)
1. user can finish diagnosis, view gap summary, and get recommendations in <= 5 minutes
2. recommendation cards show rationale tied to missing skills
3. at least one growth path can be tracked across milestones
4. admin/manager-ready summary view exists in history area

## Notes
- This benchmark is inspired by 360Learning’s skills-based learning flow and adapted for Company On Learning Searcher.
