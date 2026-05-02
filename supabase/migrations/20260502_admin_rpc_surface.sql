begin;

create or replace function public.assert_admin()
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if public.current_app_role() <> 'admin' then
    raise exception 'Forbidden';
  end if;
end;
$$;

create or replace function public.admin_require_actor_from_auth_user(p_auth_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  actor_id uuid;
begin
  select u.id
    into actor_id
    from app.users u
   where u.auth_user_id = p_auth_user_id
     and u.role = 'admin'
   limit 1;

  if actor_id is null then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  return actor_id;
end;
$$;

comment on function public.assert_admin() is
'Shared admin guard for browser-authenticated admin RPCs.';

comment on function public.admin_require_actor_from_auth_user(uuid) is
'Shared admin guard for service-role mediated flows such as Edge Functions.';

create or replace function public.admin_dashboard_payload()
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  current_name text;
  current_organization text;
begin
  perform public.assert_admin();

  select u.name, u.organization
    into current_name, current_organization
    from app.users u
   where u.id = public.current_app_user_id();

  return jsonb_build_object(
    'userName', coalesce(current_name, ''),
    'organization', coalesce(current_organization, ''),
    'users', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'role', u.role,
          'division', u.division
        )
        order by u.created_at desc
      )
      from app.users u
    ), '[]'::jsonb),
    'diagnoses', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id', d.user_id,
          'diagnosed_at', d.diagnosed_at,
          'total_score', d.total_score,
          'max_score', d.max_score,
          'category_scores_json', d.category_scores_json,
          'top_gaps_json', d.top_gaps_json
        )
        order by d.diagnosed_at desc
      )
      from (
        select distinct on (d.user_id) d.*
        from app.diagnoses d
        order by d.user_id, d.diagnosed_at desc
      ) d
    ), '[]'::jsonb),
    'enrollments', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id', e.user_id,
          'course_id', e.course_id,
          'enrollment_status', e.enrollment_status,
          'enrollment_requested_at', e.enrollment_requested_at
        )
        order by e.enrollment_requested_at desc
      )
      from (
        select distinct on (e.user_id) e.*
        from app.enrollments e
        order by e.user_id, e.enrollment_requested_at desc
      ) e
    ), '[]'::jsonb),
    'courses', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'course_title', c.course_title,
          'summary', c.summary,
          'competency_area', c.competency_area,
          'level', c.level,
          'duration_hours', c.duration_hours,
          'status', c.status,
          'source_category_1', c.source_category_1,
          'source_category_2', c.source_category_2,
          'preview_url', c.preview_url,
          'content_count', c.content_count,
          'instructor', c.instructor,
          'has_assessment', c.has_assessment,
          'objectives_json', c.objectives_json,
          'target_audience_json', c.target_audience_json,
          'expected_outcomes_json', c.expected_outcomes_json,
          'reason_tags_json', c.reason_tags_json,
          'recommended_by', c.recommended_by
        )
        order by c.competency_area asc, c.rank_in_area asc, c.created_at asc
      )
      from app.courses c
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_departments_payload(p_division text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  current_name text;
begin
  perform public.assert_admin();

  select u.name
    into current_name
    from app.users u
   where u.id = public.current_app_user_id();

  return jsonb_build_object(
    'userName', coalesce(current_name, ''),
    'requestedDivision', coalesce(p_division, ''),
    'users', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'role', u.role,
          'division', u.division
        )
        order by u.created_at desc
      )
      from app.users u
    ), '[]'::jsonb),
    'diagnoses', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id', d.user_id,
          'diagnosed_at', d.diagnosed_at,
          'total_score', d.total_score,
          'max_score', d.max_score,
          'category_scores_json', d.category_scores_json,
          'top_gaps_json', d.top_gaps_json
        )
        order by d.diagnosed_at desc
      )
      from (
        select distinct on (d.user_id) d.*
        from app.diagnoses d
        order by d.user_id, d.diagnosed_at desc
      ) d
    ), '[]'::jsonb),
    'enrollments', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id', e.user_id,
          'course_id', e.course_id,
          'enrollment_status', e.enrollment_status,
          'enrollment_requested_at', e.enrollment_requested_at
        )
        order by e.enrollment_requested_at desc
      )
      from (
        select distinct on (e.user_id) e.*
        from app.enrollments e
        order by e.user_id, e.enrollment_requested_at desc
      ) e
    ), '[]'::jsonb),
    'courses', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'course_title', c.course_title,
          'summary', c.summary,
          'competency_area', c.competency_area,
          'level', c.level,
          'duration_hours', c.duration_hours,
          'status', c.status,
          'source_category_1', c.source_category_1,
          'source_category_2', c.source_category_2,
          'preview_url', c.preview_url,
          'content_count', c.content_count,
          'instructor', c.instructor,
          'has_assessment', c.has_assessment,
          'objectives_json', c.objectives_json,
          'target_audience_json', c.target_audience_json,
          'expected_outcomes_json', c.expected_outcomes_json,
          'reason_tags_json', c.reason_tags_json,
          'recommended_by', c.recommended_by
        )
        order by c.competency_area asc, c.rank_in_area asc, c.created_at asc
      )
      from app.courses c
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_questions_payload()
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  current_name text;
begin
  perform public.assert_admin();
  select u.name into current_name
  from app.users as u
  where u.id = public.current_app_user_id();

  return jsonb_build_object(
    'userName', coalesce(current_name, ''),
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'order', ordered.row_num,
          'categoryKey', q.category,
          'area', case q.category
            when 'aiAutomation' then 'AI/자동화 활용'
            when 'dataDecision' then '데이터 기반 의사결정'
            when 'dxInnovation' then 'DX 혁신 이해'
            when 'operationsQualitySafety' then '생산/품질/안전 운영'
            when 'problemCollaboration' then '문제해결/협업'
            else q.category
          end,
          'title', q.title,
          'date', q.created_at,
          'status', case when q.status = '활성' then 'active' else 'inactive' end
        )
        order by ordered.row_num
      )
      from (
        select q_inner.*, row_number() over (order by q_inner.created_at asc) as row_num
        from app.questions q_inner
      ) as ordered
      join app.questions q on q.id = ordered.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_courses_payload()
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  current_name text;
begin
  perform public.assert_admin();
  select u.name into current_name
  from app.users as u
  where u.id = public.current_app_user_id();

  return jsonb_build_object(
    'userName', coalesce(current_name, ''),
    'courses', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'title', c.course_title,
          'summary', c.summary,
          'competencyArea', c.competency_area,
          'category', case c.competency_area
            when 'aiAutomation' then 'AI/자동화 활용'
            when 'dataDecision' then '데이터 기반 의사결정'
            when 'dxInnovation' then 'DX 혁신 이해'
            when 'operationsQualitySafety' then '생산/품질/안전 운영'
            when 'problemCollaboration' then '문제해결/협업'
            else c.competency_area
          end,
          'level', c.level,
          'durationHours', c.duration_hours,
          'users', coalesce(ec.user_count, 0),
          'status', c.status
        )
        order by c.competency_area asc, c.rank_in_area asc, c.created_at asc
      )
      from app.courses c
      left join (
        select e.course_id, count(*)::int as user_count
        from app.enrollments e
        group by e.course_id
      ) ec on ec.course_id = c.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_users_payload()
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  current_name text;
begin
  perform public.assert_admin();
  select u.name into current_name
  from app.users as u
  where u.id = public.current_app_user_id();

  return jsonb_build_object(
    'userName', coalesce(current_name, ''),
    'users', coalesce((
      with latest_diagnoses as (
        select distinct on (d.user_id) d.user_id, d.diagnosed_at
        from app.diagnoses d
        order by d.user_id, d.diagnosed_at desc
      ),
      latest_enrollments as (
        select distinct on (e.user_id) e.user_id, e.enrollment_status
        from app.enrollments e
        order by e.user_id, e.enrollment_requested_at desc
      )
      select jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'employeeId', u.employee_id,
          'division', u.division,
          'team', u.team,
          'email', u.company_email,
          'interestCourse', u.interest_course,
          'role', u.role,
          'joinedAt', to_char(u.created_at, 'YYYY.MM.DD'),
          'diagnosisDate', case
            when ld.diagnosed_at is null then '-'
            else to_char(ld.diagnosed_at, 'YYYY.MM.DD')
          end,
          'status', coalesce(
            u.admin_status_override,
            case
              when le.enrollment_status = 'enrolled' then '수강완료'
              when le.enrollment_status = 'requested' then '신청완료'
              when le.enrollment_status = 'return-missing' then '확인필요'
              when le.enrollment_status = 'failed' then '신청실패'
              when ld.diagnosed_at is not null then '진단완료'
              else '가입완료'
            end
          )
        )
        order by u.created_at desc
      )
      from app.users u
      left join latest_diagnoses ld on ld.user_id = u.id
      left join latest_enrollments le on le.user_id = u.id
    ), '[]'::jsonb),
    'filters', jsonb_build_object(
      'divisions', coalesce((
        select jsonb_agg(div_name order by div_name)
        from (
          select distinct u.division as div_name
          from app.users u
          where coalesce(u.division, '') <> ''
        ) divs
      ), '[]'::jsonb),
      'statuses', coalesce((
        with latest_diagnoses as (
          select distinct on (d.user_id) d.user_id, d.diagnosed_at
          from app.diagnoses d
          order by d.user_id, d.diagnosed_at desc
        ),
        latest_enrollments as (
          select distinct on (e.user_id) e.user_id, e.enrollment_status
          from app.enrollments e
          order by e.user_id, e.enrollment_requested_at desc
        ),
        statuses as (
          select distinct coalesce(
            u.admin_status_override,
            case
              when le.enrollment_status = 'enrolled' then '수강완료'
              when le.enrollment_status = 'requested' then '신청완료'
              when le.enrollment_status = 'return-missing' then '확인필요'
              when le.enrollment_status = 'failed' then '신청실패'
              when ld.diagnosed_at is not null then '진단완료'
              else '가입완료'
            end
          ) as status_name
          from app.users u
          left join latest_diagnoses ld on ld.user_id = u.id
          left join latest_enrollments le on le.user_id = u.id
        )
        select jsonb_agg(status_name order by status_name)
        from statuses
      ), '[]'::jsonb)
    )
  );
end;
$$;

create or replace function public.admin_boards_payload()
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  current_name text;
begin
  perform public.assert_admin();
  select u.name into current_name
  from app.users as u
  where u.id = public.current_app_user_id();

  return jsonb_build_object(
    'userName', coalesce(current_name, ''),
    'notices', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', n.id,
          'category', n.category,
          'date', n.date,
          'title', n.title,
          'summary', n.summary,
          'status', n.status,
          'created_at', n.created_at,
          'updated_at', n.updated_at
        )
        order by n.created_at desc, n.id desc
      )
      from app.notices n
    ), '[]'::jsonb),
    'faqs', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', f.id,
          'question', f.question,
          'answer', f.answer,
          'status', f.status,
          'created_at', f.created_at,
          'updated_at', f.updated_at
        )
        order by f.created_at desc, f.id desc
      )
      from app.faqs f
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_course_import_history_payload()
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform public.assert_admin();

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', h.id,
        'fileName', h.file_name,
        'uploadedAt', h.uploaded_at,
        'processedCount', h.processed_count,
        'replaceMode', h.replace_mode,
        'status', h.status,
        'detail', h.detail,
        'uploadedBy', coalesce(u.name, '')
      )
      order by h.uploaded_at desc
    )
    from (
      select *
      from app.course_import_history
      order by uploaded_at desc
      limit 20
    ) h
    left join app.users u on u.id = h.uploaded_by
  ), '[]'::jsonb);
end;
$$;

drop function if exists public.admin_question_create(text, text, jsonb);
drop function if exists public.admin_question_update(text, text, text);
drop function if exists public.admin_question_delete(text);

create or replace function public.admin_question_create(
  p_title text,
  p_category text,
  p_options jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  next_id text;
begin
  perform public.assert_admin();

  next_id := 'q' || (extract(epoch from clock_timestamp()) * 1000)::bigint::text;

  insert into app.questions (id, title, category, type, options_json, status, created_at)
  values (
    next_id,
    trim(coalesce(p_title, '')),
    trim(coalesce(p_category, '')),
    'choice',
    coalesce(
      p_options,
      jsonb_build_array(
        jsonb_build_object('label', '전혀 그렇지 않다', 'value', 1),
        jsonb_build_object('label', '가끔 그렇다', 'value', 2),
        jsonb_build_object('label', '대체로 그렇다', 'value', 3),
        jsonb_build_object('label', '항상 그렇다', 'value', 4)
      )
    ),
    '활성',
    now()
  );

  return jsonb_build_object('ok', true, 'id', next_id);
end;
$$;

create or replace function public.admin_question_update(
  p_id text,
  p_title text,
  p_category text
)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform public.assert_admin();

  update app.questions
     set title = trim(coalesce(p_title, '')),
         category = trim(coalesce(p_category, ''))
   where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_question_delete(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform public.assert_admin();

  delete from app.questions where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_course_create(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  next_id text;
  next_rank integer;
  area text;
begin
  perform public.assert_admin();

  area := trim(coalesce(p_payload->>'competencyArea', ''));
  select count(*)::int + 1 into next_rank from app.courses where competency_area = area;
  next_id := 'ADM-' || (extract(epoch from clock_timestamp()) * 1000)::bigint::text;

  insert into app.courses (
    id, course_title, level, duration_hours, competency_area, summary, objectives_json,
    target_audience_json, expected_outcomes_json, reason_tags_json, recommended_by, rank_in_area,
    status, created_at
  )
  values (
    next_id,
    trim(coalesce(p_payload->>'courseTitle', '')),
    coalesce(p_payload->>'level', '입문'),
    greatest(0, coalesce((p_payload->>'durationHours')::integer, 0)),
    area,
    trim(coalesce(p_payload->>'summary', '')),
    coalesce(p_payload->'objectives', '["핵심 개념 정리","현업 적용 포인트 확보"]'::jsonb),
    coalesce(p_payload->'targetAudience', '["현대위아 구성원"]'::jsonb),
    coalesce(p_payload->'expectedOutcomes', '["추천 과정 확대"]'::jsonb),
    coalesce(p_payload->'reasonTags', '["관리자추가"]'::jsonb),
    coalesce(nullif(p_payload->>'recommendedBy', ''), 'role-fit'),
    next_rank,
    '운영중',
    now()
  );

  return jsonb_build_object('ok', true, 'id', next_id);
end;
$$;

create or replace function public.admin_course_update(p_id text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform public.assert_admin();

  update app.courses
     set course_title = trim(coalesce(p_payload->>'courseTitle', course_title)),
         competency_area = trim(coalesce(p_payload->>'competencyArea', competency_area)),
         level = coalesce(p_payload->>'level', level),
         duration_hours = greatest(0, coalesce((p_payload->>'durationHours')::integer, duration_hours)),
         summary = trim(coalesce(p_payload->>'summary', summary))
   where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_course_delete(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform public.assert_admin();

  delete from app.courses where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_user_create(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  existing_id uuid;
  next_id uuid;
  employee_id_value text;
  email_value text;
  division_value text;
  team_value text;
begin
  perform public.assert_admin();

  employee_id_value := trim(coalesce(p_payload->>'employeeId', ''));
  email_value := lower(trim(coalesce(p_payload->>'email', '')));
  division_value := trim(coalesce(p_payload->>'division', ''));
  team_value := trim(coalesce(p_payload->>'team', ''));

  if employee_id_value = '' or trim(coalesce(p_payload->>'name', '')) = '' or division_value = '' or team_value = '' or email_value = '' then
    raise exception '회원 정보를 모두 입력해주세요.';
  end if;

  select u.id into existing_id
  from app.users u
  where u.employee_id = employee_id_value
     or u.company_email = email_value
  limit 1;

  if existing_id is not null then
    raise exception '이미 등록된 회원입니다.';
  end if;

  next_id := gen_random_uuid();

  insert into app.users (
    id, employee_id, password_hash, role, name, organization, division, office, team, company_email, interest_course, created_at
  )
  values (
    next_id,
    employee_id_value,
    'supabase-managed:' || gen_random_uuid()::text,
    case when p_payload->>'role' in ('manager', 'admin') then p_payload->>'role' else 'employee' end,
    trim(coalesce(p_payload->>'name', '')),
    division_value || ' / ' || team_value,
    division_value,
    '',
    team_value,
    email_value,
    trim(coalesce(p_payload->>'interestCourse', '')),
    now()
  );

  return jsonb_build_object('ok', true, 'id', next_id);
end;
$$;

create or replace function public.admin_user_import(p_users jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  raw_user jsonb;
  imported_count integer := 0;
  updated_count integer := 0;
  employee_id_value text;
  name_value text;
  division_value text;
  team_value text;
  email_value text;
  interest_course_value text;
  role_value text;
  dedupe_key text;
  existing_id uuid;
begin
  perform public.assert_admin();

  create temporary table if not exists _admin_user_import_seen (
    dedupe_key text primary key
  ) on commit drop;
  truncate _admin_user_import_seen;

  for raw_user in
    select value
    from jsonb_array_elements(coalesce(p_users, '[]'::jsonb))
  loop
    employee_id_value := trim(coalesce(raw_user->>'employeeId', ''));
    name_value := trim(coalesce(raw_user->>'name', ''));
    division_value := trim(coalesce(raw_user->>'division', ''));
    team_value := trim(coalesce(raw_user->>'team', ''));
    email_value := lower(trim(coalesce(raw_user->>'email', '')));
    interest_course_value := trim(coalesce(raw_user->>'interestCourse', ''));
    role_value := case when raw_user->>'role' in ('manager', 'admin') then raw_user->>'role' else 'employee' end;

    if employee_id_value = '' or name_value = '' or division_value = '' or team_value = '' or email_value = '' then
      continue;
    end if;

    dedupe_key := employee_id_value || '::' || email_value;
    begin
      insert into _admin_user_import_seen (dedupe_key) values (dedupe_key);
    exception
      when unique_violation then
        continue;
    end;

    select u.id into existing_id
      from app.users u
     where u.employee_id = employee_id_value
        or u.company_email = email_value
     order by u.created_at desc
     limit 1;

    if existing_id is not null then
      update app.users
         set name = name_value,
             organization = division_value || ' / ' || team_value,
             division = division_value,
             team = team_value,
             company_email = email_value,
             interest_course = interest_course_value,
             role = role_value
       where id = existing_id;
      updated_count := updated_count + 1;
    else
      insert into app.users (
        id, employee_id, password_hash, role, name, organization, division, office, team, company_email, interest_course, created_at
      )
      values (
        gen_random_uuid(),
        employee_id_value,
        'supabase-managed:' || gen_random_uuid()::text,
        role_value,
        name_value,
        division_value || ' / ' || team_value,
        division_value,
        '',
        team_value,
        email_value,
        interest_course_value,
        now()
      );
      imported_count := imported_count + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'importedCount', imported_count, 'updatedCount', updated_count);
end;
$$;

create or replace function public.admin_user_update(p_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  current_row app.users%rowtype;
  division_value text;
  team_value text;
begin
  perform public.assert_admin();

  select * into current_row from app.users where id = p_id;
  if current_row.id is null then
    raise exception '회원 정보를 찾지 못했습니다.';
  end if;

  division_value := trim(coalesce(p_payload->>'division', current_row.division));
  team_value := trim(coalesce(p_payload->>'team', current_row.team));

  update app.users
     set name = trim(coalesce(p_payload->>'name', current_row.name)),
         organization = case
           when division_value = '' and team_value = '' then current_row.organization
           else concat_ws(' / ', nullif(division_value, ''), nullif(team_value, ''))
         end,
         division = division_value,
         team = team_value,
         interest_course = trim(coalesce(p_payload->>'interestCourse', current_row.interest_course)),
         role = case when p_payload->>'role' in ('manager', 'admin') then p_payload->>'role' else 'employee' end,
         employee_id = trim(coalesce(p_payload->>'employeeId', current_row.employee_id)),
         admin_status_override = case
           when not (p_payload ? 'statusOverride') then current_row.admin_status_override
           when trim(coalesce(p_payload->>'statusOverride', '')) = '' then null
           else trim(coalesce(p_payload->>'statusOverride', ''))
         end
   where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_user_delete(p_id uuid, p_confirmation_employee_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  target_row app.users%rowtype;
  admin_count integer;
begin
  perform public.assert_admin();

  if p_id = public.current_app_user_id() then
    raise exception '현재 로그인한 관리자 계정은 삭제할 수 없습니다.';
  end if;

  select * into target_row from app.users where id = p_id;
  if target_row.id is null then
    raise exception '삭제할 회원을 찾을 수 없습니다.';
  end if;

  if trim(coalesce(p_confirmation_employee_id, '')) = '' or trim(coalesce(p_confirmation_employee_id, '')) <> target_row.employee_id then
    raise exception '삭제 확인용 사번이 일치하지 않습니다.';
  end if;

  if target_row.role = 'admin' then
    select count(*)::int into admin_count from app.users where role = 'admin';
    if admin_count <= 1 then
      raise exception '마지막 관리자 계정은 삭제할 수 없습니다.';
    end if;
  end if;

  delete from app.users where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_notice_create(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  next_id text;
  now_at timestamptz := now();
begin
  perform public.assert_admin();
  next_id := 'notice-' || (extract(epoch from clock_timestamp()) * 1000)::bigint::text;

  insert into app.notices (id, category, date, title, summary, status, created_at, updated_at)
  values (
    next_id,
    trim(coalesce(p_payload->>'category', '')),
    to_char(now_at, 'YYYY.MM.DD'),
    trim(coalesce(p_payload->>'title', '')),
    trim(coalesce(p_payload->>'summary', '')),
    '게시중',
    now_at,
    now_at
  );

  return jsonb_build_object('ok', true, 'id', next_id);
end;
$$;

create or replace function public.admin_notice_update(p_id text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform public.assert_admin();

  update app.notices
     set category = trim(coalesce(p_payload->>'category', category)),
         title = trim(coalesce(p_payload->>'title', title)),
         summary = trim(coalesce(p_payload->>'summary', summary)),
         updated_at = now()
   where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_notice_delete(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform public.assert_admin();
  delete from app.notices where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_faq_create(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  next_id text;
  now_at timestamptz := now();
begin
  perform public.assert_admin();
  next_id := 'faq-' || (extract(epoch from clock_timestamp()) * 1000)::bigint::text;

  insert into app.faqs (id, question, answer, status, created_at, updated_at)
  values (
    next_id,
    trim(coalesce(p_payload->>'question', '')),
    trim(coalesce(p_payload->>'answer', '')),
    '게시중',
    now_at,
    now_at
  );

  return jsonb_build_object('ok', true, 'id', next_id);
end;
$$;

create or replace function public.admin_faq_update(p_id text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform public.assert_admin();

  update app.faqs
     set question = trim(coalesce(p_payload->>'question', question)),
         answer = trim(coalesce(p_payload->>'answer', answer)),
         updated_at = now()
   where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_faq_delete(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform public.assert_admin();
  delete from app.faqs where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_course_bulk_import(
  p_auth_user_id uuid,
  p_rows jsonb,
  p_replace boolean default false,
  p_file_name text default 'course_list_upload.xlsx'
)
returns jsonb
language plpgsql
security definer
set search_path = public, app
as $$
declare
  actor_id uuid;
  raw_row jsonb;
  processed_count integer := 0;
  file_name_value text := coalesce(nullif(trim(coalesce(p_file_name, '')), ''), 'course_list_upload.xlsx');
  replace_mode boolean := coalesce(p_replace, false);
  area text;
  next_rank integer;
  next_id text;
  created_at_value timestamptz := now();
begin
  actor_id := public.admin_require_actor_from_auth_user(p_auth_user_id);

  if jsonb_typeof(coalesce(p_rows, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_rows, '[]'::jsonb)) = 0 then
    raise exception '업로드할 과정 데이터가 없습니다.';
  end if;

  create temporary table if not exists _admin_course_rank_counts (
    competency_area text primary key,
    rank_count integer not null
  ) on commit drop;
  truncate _admin_course_rank_counts;

  if replace_mode then
    delete from app.courses;
  else
    insert into _admin_course_rank_counts (competency_area, rank_count)
    select competency_area, max(rank_in_area)::int
    from app.courses
    group by competency_area;
  end if;

  for raw_row in
    select value
    from jsonb_array_elements(p_rows)
  loop
    area := trim(coalesce(raw_row->>'competency_area', ''));
    if area = '' or trim(coalesce(raw_row->>'course_title', '')) = '' then
      continue;
    end if;

    insert into _admin_course_rank_counts (competency_area, rank_count)
    values (area, 0)
    on conflict (competency_area) do nothing;

    update _admin_course_rank_counts
       set rank_count = rank_count + 1
     where competency_area = area
     returning rank_count into next_rank;

    next_id := 'XLSX-' || lpad((processed_count + 1)::text, 4, '0') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    insert into app.courses (
      id, course_title, level, duration_hours, competency_area, summary, objectives_json,
      target_audience_json, expected_outcomes_json, reason_tags_json, recommended_by, rank_in_area,
      status, created_at, preview_url, preview_label, source_category_1, source_category_2,
      content_count, instructor, has_assessment, source_duration_text
    )
    values (
      next_id,
      trim(coalesce(raw_row->>'course_title', '')),
      coalesce(raw_row->>'level', '입문'),
      greatest(0, coalesce((raw_row->>'duration_hours')::integer, 0)),
      area,
      trim(coalesce(raw_row->>'summary', '')),
      coalesce(raw_row->'objectives_json', '[]'::jsonb),
      coalesce(raw_row->'target_audience_json', '[]'::jsonb),
      coalesce(raw_row->'expected_outcomes_json', '[]'::jsonb),
      coalesce(raw_row->'reason_tags_json', '[]'::jsonb),
      coalesce(nullif(raw_row->>'recommended_by', ''), 'skill-gap'),
      next_rank,
      coalesce(nullif(raw_row->>'status', ''), '운영중'),
      created_at_value,
      nullif(raw_row->>'preview_url', ''),
      nullif(raw_row->>'preview_label', ''),
      nullif(raw_row->>'source_category_1', ''),
      nullif(raw_row->>'source_category_2', ''),
      greatest(0, coalesce((raw_row->>'content_count')::integer, 0)),
      nullif(raw_row->>'instructor', ''),
      coalesce((raw_row->>'has_assessment')::boolean, false),
      nullif(raw_row->>'source_duration_text', '')
    );

    processed_count := processed_count + 1;
  end loop;

  insert into app.course_import_history (
    id, uploaded_by, file_name, uploaded_at, processed_count, replace_mode, status, detail
  )
  values (
    gen_random_uuid(),
    actor_id,
    file_name_value,
    created_at_value,
    processed_count,
    replace_mode,
    'success',
    case
      when replace_mode then '기존 데이터를 교체하고 업로드 완료'
      else '기존 데이터 유지 후 업로드 완료'
    end
  );

  return jsonb_build_object(
    'ok', true,
    'importedCount', processed_count,
    'replace', replace_mode
  );
exception
  when others then
    if actor_id is not null then
      insert into app.course_import_history (
        id, uploaded_by, file_name, uploaded_at, processed_count, replace_mode, status, detail
      )
      values (
        gen_random_uuid(),
        actor_id,
        file_name_value,
        created_at_value,
        coalesce(jsonb_array_length(coalesce(p_rows, '[]'::jsonb)), 0),
        replace_mode,
        'fail',
        SQLERRM
      );
    end if;
    raise;
end;
$$;

grant execute on function public.admin_dashboard_payload() to authenticated;
grant execute on function public.admin_departments_payload(text) to authenticated;
grant execute on function public.admin_questions_payload() to authenticated;
grant execute on function public.admin_courses_payload() to authenticated;
grant execute on function public.admin_users_payload() to authenticated;
grant execute on function public.admin_boards_payload() to authenticated;
grant execute on function public.admin_course_import_history_payload() to authenticated;
grant execute on function public.admin_question_create(text, text, jsonb) to authenticated;
grant execute on function public.admin_question_update(text, text, text) to authenticated;
grant execute on function public.admin_question_delete(text) to authenticated;
grant execute on function public.admin_course_create(jsonb) to authenticated;
grant execute on function public.admin_course_update(text, jsonb) to authenticated;
grant execute on function public.admin_course_delete(text) to authenticated;
grant execute on function public.admin_user_create(jsonb) to authenticated;
grant execute on function public.admin_user_import(jsonb) to authenticated;
grant execute on function public.admin_user_update(uuid, jsonb) to authenticated;
grant execute on function public.admin_user_delete(uuid, text) to authenticated;
grant execute on function public.admin_notice_create(jsonb) to authenticated;
grant execute on function public.admin_notice_update(text, jsonb) to authenticated;
grant execute on function public.admin_notice_delete(text) to authenticated;
grant execute on function public.admin_faq_create(jsonb) to authenticated;
grant execute on function public.admin_faq_update(text, jsonb) to authenticated;
grant execute on function public.admin_faq_delete(text) to authenticated;
revoke execute on function public.admin_course_bulk_import(uuid, jsonb, boolean, text) from anon, authenticated;

commit;
