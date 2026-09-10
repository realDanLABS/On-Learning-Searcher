begin;

create extension if not exists pgcrypto;

create schema if not exists app;

alter table if exists app.users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

create index if not exists idx_app_users_auth_user_id on app.users(auth_user_id);

alter table if exists app.users enable row level security;
alter table if exists app.diagnoses enable row level security;
alter table if exists app.selected_courses enable row level security;
alter table if exists app.enrollments enable row level security;
alter table if exists app.journey_events enable row level security;
alter table if exists app.questions enable row level security;
alter table if exists app.courses enable row level security;
alter table if exists app.notices enable row level security;
alter table if exists app.faqs enable row level security;
alter table if exists app.course_import_history enable row level security;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, app
as $$
  select u.id
  from app.users as u
  where u.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public, app
as $$
  select coalesce((
    select u.role
    from app.users as u
    where u.auth_user_id = auth.uid()
    limit 1
  ), 'anonymous')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select public.current_app_role() = 'admin'
$$;

drop view if exists public.learning_courses;
create view public.learning_courses
with (security_invoker = true) as
select
  c.id,
  c.course_title,
  c.level,
  c.duration_hours,
  c.competency_area,
  c.summary,
  c.objectives_json,
  c.target_audience_json,
  c.expected_outcomes_json,
  c.reason_tags_json,
  c.recommended_by,
  c.rank_in_area,
  c.status,
  c.created_at,
  c.preview_url,
  c.preview_label,
  c.source_category_1,
  c.source_category_2,
  c.content_count,
  c.instructor,
  c.has_assessment,
  c.source_duration_text
from app.courses as c
where c.status = '운영중';

drop view if exists public.learning_notices;
create view public.learning_notices
with (security_invoker = true) as
select
  n.id,
  n.category,
  n.date,
  n.title,
  n.summary,
  n.status,
  n.created_at,
  n.updated_at
from app.notices as n
where coalesce(n.status, '게시중') = '게시중';

drop view if exists public.learning_faqs;
create view public.learning_faqs
with (security_invoker = true) as
select
  f.id,
  f.question,
  f.answer,
  f.status,
  f.created_at,
  f.updated_at
from app.faqs as f
where coalesce(f.status, '게시중') = '게시중';

drop view if exists public.learning_questions;
create view public.learning_questions
with (security_invoker = true) as
select
  q.id,
  q.title,
  q.category,
  q.type,
  q.options_json,
  q.status,
  q.created_at
from app.questions as q
where q.status = '활성';

drop view if exists public.my_profile;
create view public.my_profile
with (security_invoker = true) as
select
  u.id,
  u.auth_user_id,
  u.employee_id,
  u.role,
  u.name,
  u.organization,
  u.division,
  u.office,
  u.team,
  u.company_email,
  u.interest_course,
  u.created_at
from app.users as u
where u.auth_user_id = auth.uid();

drop view if exists public.my_latest_diagnosis;
create view public.my_latest_diagnosis
with (security_invoker = true) as
select
  d.id,
  d.user_id,
  d.diagnosed_at,
  d.total_score,
  d.max_score,
  d.category_scores_json,
  d.top_gaps_json
from app.diagnoses as d
where d.user_id = public.current_app_user_id()
order by d.diagnosed_at desc
limit 1;

drop view if exists public.my_diagnosis_history;
create view public.my_diagnosis_history
with (security_invoker = true) as
select
  d.id,
  d.user_id,
  d.diagnosed_at,
  d.total_score,
  d.max_score,
  d.category_scores_json,
  d.top_gaps_json
from app.diagnoses as d
where d.user_id = public.current_app_user_id()
order by d.diagnosed_at desc;

drop view if exists public.my_selected_course;
create view public.my_selected_course
with (security_invoker = true) as
select
  sc.user_id,
  sc.course_json,
  sc.updated_at
from app.selected_courses as sc
where sc.user_id = public.current_app_user_id();

drop view if exists public.my_enrollments;
create view public.my_enrollments
with (security_invoker = true) as
select
  e.id,
  e.user_id,
  e.course_id,
  e.course_title,
  e.enrollment_requested_at,
  e.enrollment_status,
  e.failure_reason
from app.enrollments as e
where e.user_id = public.current_app_user_id()
order by e.enrollment_requested_at desc;

create or replace function public.my_journey_stage()
returns text
language plpgsql
stable
security invoker
set search_path = public, app
as $$
declare
  target_user_id uuid;
  diagnosis_count integer;
  selected_count integer;
  enrolled_count integer;
begin
  target_user_id := public.current_app_user_id();
  if target_user_id is null then
    return 'start';
  end if;

  select count(*)::int into diagnosis_count from app.diagnoses where user_id = target_user_id;
  if diagnosis_count = 0 then
    return 'start';
  end if;

  select count(*)::int into selected_count from app.selected_courses where user_id = target_user_id;
  select count(*)::int into enrolled_count from app.enrollments where user_id = target_user_id and enrollment_status = 'enrolled';

  if enrolled_count > 0 then
    return 'enrollment_done';
  end if;
  if selected_count > 0 then
    return 'course_selected';
  end if;
  return 'diagnosis_done';
end;
$$;

create or replace function public.save_diagnosis(
  p_diagnosed_at timestamptz,
  p_total_score integer,
  p_max_score integer,
  p_category_scores jsonb,
  p_top_gaps jsonb
)
returns void
language plpgsql
security invoker
set search_path = public, app
as $$
declare
  target_user_id uuid;
begin
  target_user_id := public.current_app_user_id();
  if target_user_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into app.diagnoses (id, user_id, diagnosed_at, total_score, max_score, category_scores_json, top_gaps_json)
  values (gen_random_uuid(), target_user_id, p_diagnosed_at, p_total_score, p_max_score, p_category_scores, p_top_gaps);

  delete from app.selected_courses where user_id = target_user_id;

  insert into app.journey_events (id, user_id, type, at, label)
  values (
    gen_random_uuid(),
    target_user_id,
    'diagnosis_completed',
    p_diagnosed_at,
    format('진단 완료 (%s/%s)', p_total_score, p_max_score)
  );
end;
$$;

create or replace function public.save_selected_course(p_course jsonb)
returns void
language plpgsql
security invoker
set search_path = public, app
as $$
declare
  target_user_id uuid;
begin
  target_user_id := public.current_app_user_id();
  if target_user_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into app.selected_courses (user_id, course_json, updated_at)
  values (target_user_id, p_course, now())
  on conflict (user_id) do update
    set course_json = excluded.course_json,
        updated_at = excluded.updated_at;

  insert into app.journey_events (id, user_id, type, at, label)
  values (
    gen_random_uuid(),
    target_user_id,
    'course_selected',
    now(),
    format('추천 과정 선택: %s', coalesce(p_course->>'courseTitle', '선택 과정'))
  );
end;
$$;

create or replace function public.save_enrollment(
  p_course_id text,
  p_course_title text,
  p_enrollment_requested_at timestamptz,
  p_enrollment_status text,
  p_failure_reason text default null
)
returns void
language plpgsql
security invoker
set search_path = public, app
as $$
declare
  target_user_id uuid;
begin
  target_user_id := public.current_app_user_id();
  if target_user_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into app.enrollments (
    id, user_id, course_id, course_title, enrollment_requested_at, enrollment_status, failure_reason
  )
  values (
    gen_random_uuid(),
    target_user_id,
    p_course_id,
    p_course_title,
    p_enrollment_requested_at,
    p_enrollment_status,
    p_failure_reason
  );

  insert into app.journey_events (id, user_id, type, at, label)
  values (
    gen_random_uuid(),
    target_user_id,
    'enrollment_completed',
    p_enrollment_requested_at,
    format('신청 처리: %s (%s)', p_course_title, p_enrollment_status)
  );
end;
$$;

create or replace function public.link_current_auth_user(
  p_employee_id text default null,
  p_company_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  target_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select u.id
    into target_user_id
  from app.users as u
  where (
      p_company_email is not null
      and lower(coalesce(u.company_email, '')) = lower(p_company_email)
    )
    or (
      p_employee_id is not null
      and coalesce(u.employee_id, '') = p_employee_id
    )
  order by u.created_at desc
  limit 1;

  if target_user_id is null then
    raise exception 'User not found';
  end if;

  update app.users
     set auth_user_id = auth.uid()
   where id = target_user_id
     and (auth_user_id is null or auth_user_id = auth.uid());

  return target_user_id;
end;
$$;

create or replace function public.lookup_login_email(p_employee_id text)
returns text
language sql
stable
security definer
set search_path = public, app
as $$
  select lower(coalesce(nullif(u.company_email, ''), u.employee_id || '@company.local'))
  from app.users as u
  where u.employee_id = p_employee_id
  order by u.created_at desc
  limit 1
$$;

create or replace function public.upsert_sso_user(
  p_employee_id text,
  p_name text,
  p_organization text,
  p_company_email text default null
)
returns table (
  id uuid,
  employee_id text,
  role text,
  company_email text,
  division text,
  office text,
  team text
)
language plpgsql
security definer
set search_path = public, app
as $$
declare
  existing_id uuid;
  next_company_email text;
  next_division text;
  next_office text;
  next_team text;
begin
  if coalesce(trim(p_employee_id), '') = '' or coalesce(trim(p_name), '') = '' or coalesce(trim(p_organization), '') = '' then
    raise exception 'Missing required SSO fields';
  end if;

  next_company_email := coalesce(nullif(lower(trim(p_company_email)), ''), lower(trim(p_employee_id)) || '@company.local');
  next_division := trim(split_part(p_organization, '/', 1));
  next_office := trim(split_part(p_organization, '/', 2));
  next_team := trim(split_part(p_organization, '/', 3));

  select u.id into existing_id
  from app.users as u
  where u.employee_id = p_employee_id
  order by u.created_at desc
  limit 1;

  if existing_id is null then
    insert into app.users (
      id, employee_id, password_hash, role, name, organization, division, office, team, company_email, interest_course, created_at
    ) values (
      gen_random_uuid(),
      p_employee_id,
      'supabase-managed:' || gen_random_uuid()::text,
      'employee',
      p_name,
      p_organization,
      coalesce(nullif(next_division, ''), p_organization),
      next_office,
      next_team,
      next_company_email,
      '',
      now()
    )
    returning app.users.id into existing_id;
  else
    update app.users
       set name = p_name,
           organization = p_organization,
           division = coalesce(nullif(next_division, ''), p_organization),
           office = next_office,
           team = next_team,
           company_email = coalesce(nullif(app.users.company_email, ''), next_company_email)
     where app.users.id = existing_id;
  end if;

  return query
  select u.id, u.employee_id, u.role, u.company_email, u.division, u.office, u.team
  from app.users as u
  where u.id = existing_id;
end;
$$;

create or replace function public.register_current_auth_user(
  p_employee_id text,
  p_name text,
  p_organization text,
  p_division text default null,
  p_office text default null,
  p_team text default null,
  p_company_email text default null,
  p_interest_course text default null
)
returns table (
  id uuid,
  employee_id text,
  role text,
  company_email text,
  division text,
  office text,
  team text
)
language plpgsql
security definer
set search_path = public, app
as $$
declare
  target_user_id uuid;
  next_company_email text;
  next_division text;
  next_office text;
  next_team text;
  updated_count integer;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if coalesce(trim(p_employee_id), '') = '' or coalesce(trim(p_name), '') = '' or coalesce(trim(p_organization), '') = '' then
    raise exception 'Missing required registration fields';
  end if;

  next_company_email := coalesce(nullif(lower(trim(p_company_email)), ''), lower(trim(p_employee_id)) || '@company.local');
  next_division := coalesce(nullif(trim(p_division), ''), trim(split_part(p_organization, '/', 1)), p_organization);
  next_office := nullif(trim(p_office), '');
  next_team := nullif(trim(p_team), '');

  select u.id
    into target_user_id
  from app.users as u
  where u.employee_id = p_employee_id
     or lower(coalesce(u.company_email, '')) = next_company_email
  order by u.created_at desc
  limit 1;

  if target_user_id is null then
    insert into app.users (
      id, auth_user_id, employee_id, password_hash, role, name, organization, division, office, team, company_email, interest_course, created_at
    ) values (
      gen_random_uuid(),
      auth.uid(),
      p_employee_id,
      'supabase-managed:' || gen_random_uuid()::text,
      'employee',
      p_name,
      p_organization,
      next_division,
      next_office,
      next_team,
      next_company_email,
      coalesce(trim(p_interest_course), ''),
      now()
    )
    returning app.users.id into target_user_id;
  else
    update app.users
       set auth_user_id = auth.uid(),
           name = p_name,
           organization = p_organization,
           division = next_division,
           office = next_office,
           team = next_team,
           company_email = next_company_email,
           interest_course = coalesce(nullif(trim(p_interest_course), ''), app.users.interest_course)
     where app.users.id = target_user_id
       and (app.users.auth_user_id is null or app.users.auth_user_id = auth.uid());

    get diagnostics updated_count = row_count;
    if updated_count = 0 then
      raise exception 'User already linked to another auth account';
    end if;
  end if;

  return query
  select u.id, u.employee_id, u.role, u.company_email, u.division, u.office, u.team
  from app.users as u
  where u.id = target_user_id;
end;
$$;

create or replace function public.link_auth_user_for_employee(
  p_employee_id text,
  p_auth_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  target_user_id uuid;
begin
  if coalesce(trim(p_employee_id), '') = '' or p_auth_user_id is null then
    raise exception 'Missing auth link fields';
  end if;

  update app.users
     set auth_user_id = p_auth_user_id
   where employee_id = p_employee_id
     and (auth_user_id is null or auth_user_id = p_auth_user_id)
  returning id into target_user_id;

  if target_user_id is null then
    raise exception 'User not found';
  end if;

  return target_user_id;
end;
$$;

grant usage on schema public to anon, authenticated;
grant usage on schema app to authenticated;
grant select on public.learning_courses to anon, authenticated;
grant select on public.learning_notices to anon, authenticated;
grant select on public.learning_faqs to anon, authenticated;
grant select on public.learning_questions to authenticated;
grant select on public.my_profile to authenticated;
grant select on public.my_latest_diagnosis to authenticated;
grant select on public.my_diagnosis_history to authenticated;
grant select on public.my_selected_course to authenticated;
grant select on public.my_enrollments to authenticated;
grant select, insert, update, delete on all tables in schema app to authenticated;
grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_journey_stage() to authenticated;
grant execute on function public.save_diagnosis(timestamptz, integer, integer, jsonb, jsonb) to authenticated;
grant execute on function public.save_selected_course(jsonb) to authenticated;
grant execute on function public.save_enrollment(text, text, timestamptz, text, text) to authenticated;
grant execute on function public.link_current_auth_user(text, text) to authenticated;
grant execute on function public.lookup_login_email(text) to anon, authenticated;
grant execute on function public.upsert_sso_user(text, text, text, text) to anon, authenticated;
grant execute on function public.link_auth_user_for_employee(text, uuid) to anon, authenticated;
grant execute on function public.register_current_auth_user(text, text, text, text, text, text, text, text) to authenticated;

drop policy if exists app_users_self_select on app.users;
create policy app_users_self_select
on app.users
for select
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists app_users_self_update on app.users;
create policy app_users_self_update
on app.users
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists app_users_admin_read on app.users;
create policy app_users_admin_read
on app.users
for select
to authenticated
using (public.is_admin());

drop policy if exists app_users_admin_update on app.users;
create policy app_users_admin_update
on app.users
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists app_diagnoses_self_access on app.diagnoses;
create policy app_diagnoses_self_access
on app.diagnoses
for all
to authenticated
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

drop policy if exists app_diagnoses_admin_read on app.diagnoses;
create policy app_diagnoses_admin_read
on app.diagnoses
for select
to authenticated
using (public.is_admin());

drop policy if exists app_selected_courses_self_access on app.selected_courses;
create policy app_selected_courses_self_access
on app.selected_courses
for all
to authenticated
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

drop policy if exists app_enrollments_self_access on app.enrollments;
create policy app_enrollments_self_access
on app.enrollments
for all
to authenticated
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

drop policy if exists app_journey_events_self_access on app.journey_events;
create policy app_journey_events_self_access
on app.journey_events
for all
to authenticated
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

drop policy if exists app_questions_admin_all on app.questions;
create policy app_questions_admin_all
on app.questions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists app_courses_admin_all on app.courses;
create policy app_courses_admin_all
on app.courses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists app_notices_admin_all on app.notices;
create policy app_notices_admin_all
on app.notices
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists app_faqs_admin_all on app.faqs;
create policy app_faqs_admin_all
on app.faqs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists app_course_import_history_admin_all on app.course_import_history;
create policy app_course_import_history_admin_all
on app.course_import_history
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;
