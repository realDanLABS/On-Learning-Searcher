create schema if not exists app;

create table if not exists app.users (
  id uuid primary key,
  employee_id text not null unique,
  password_hash text not null,
  role text not null check (role in ('employee','manager','admin')),
  name text not null,
  organization text not null,
  division text not null default '',
  office text not null default '',
  team text not null default '',
  company_email text not null unique,
  interest_course text not null default '',
  created_at timestamptz not null
);

create table if not exists app.sessions (
  token text primary key,
  user_id uuid not null references app.users(id) on delete cascade,
  created_at timestamptz not null,
  expires_at timestamptz not null
);

create table if not exists app.diagnoses (
  id uuid primary key,
  user_id uuid not null references app.users(id) on delete cascade,
  diagnosed_at timestamptz not null,
  total_score integer not null,
  max_score integer not null,
  category_scores_json jsonb not null,
  top_gaps_json jsonb not null
);

create table if not exists app.selected_courses (
  user_id uuid primary key references app.users(id) on delete cascade,
  course_json jsonb not null,
  updated_at timestamptz not null
);

create table if not exists app.enrollments (
  id uuid primary key,
  user_id uuid not null references app.users(id) on delete cascade,
  course_id text not null,
  course_title text not null,
  enrollment_requested_at timestamptz not null,
  enrollment_status text not null check (enrollment_status in ('requested','enrolled','failed','return-missing')),
  failure_reason text
);

create table if not exists app.journey_events (
  id uuid primary key,
  user_id uuid not null references app.users(id) on delete cascade,
  type text not null,
  at timestamptz not null,
  label text not null
);

create table if not exists app.questions (
  id text primary key,
  title text not null,
  category text not null,
  type text not null default 'choice',
  options_json jsonb not null,
  status text not null default '활성',
  created_at timestamptz not null
);

create table if not exists app.courses (
  id text primary key,
  course_title text not null,
  level text not null check (level in ('입문','중급','심화')),
  duration_hours integer not null,
  competency_area text not null,
  summary text not null,
  objectives_json jsonb not null,
  target_audience_json jsonb not null,
  expected_outcomes_json jsonb not null,
  reason_tags_json jsonb not null,
  recommended_by text not null check (recommended_by in ('skill-gap','role-fit','history-based')),
  rank_in_area integer not null,
  status text not null default '운영중',
  created_at timestamptz not null
);

create table if not exists app.notices (
  id text primary key,
  category text not null,
  date text not null,
  title text not null,
  summary text not null
);

create table if not exists app.faqs (
  id text primary key,
  question text not null,
  answer text not null
);

create index if not exists idx_app_sessions_user_id on app.sessions(user_id);
create index if not exists idx_app_sessions_expires_at on app.sessions(expires_at);
create index if not exists idx_app_diagnoses_user_id_diagnosed_at on app.diagnoses(user_id, diagnosed_at desc);
create index if not exists idx_app_enrollments_user_id_requested_at on app.enrollments(user_id, enrollment_requested_at desc);
create index if not exists idx_app_journey_events_user_id_at on app.journey_events(user_id, at desc);
create index if not exists idx_app_courses_competency_area_rank on app.courses(competency_area, rank_in_area);
