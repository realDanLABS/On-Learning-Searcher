import crypto from 'node:crypto'
import { Pool } from 'pg'

const globalKey = '__on_learning_pg_pool__'
const initKey = '__on_learning_pg_init__'

function getDatabaseUrl() {
  return (
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    ''
  )
}

export function getPool() {
  const existing = globalThis[globalKey]
  if (existing) return existing

  const connectionString = getDatabaseUrl()
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL or POSTGRES_URL is required')
  }

  const pool = new Pool({
    connectionString,
    max: 5,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  })

  globalThis[globalKey] = pool
  return pool
}

export async function ensureSchema() {
  const existing = globalThis[initKey]
  if (existing) return existing

  const task = (async () => {
    const pool = getPool()
    await pool.query(`
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

      alter table app.users add column if not exists admin_status_override text;

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
        created_at timestamptz not null,
        preview_url text,
        preview_label text,
        source_category_1 text,
        source_category_2 text,
        content_count integer,
        instructor text,
        has_assessment boolean default false,
        source_duration_text text
      );

      create table if not exists app.notices (
        id text primary key,
        category text not null,
        date text not null,
        title text not null,
        summary text not null,
        status text not null default '게시중',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists app.faqs (
        id text primary key,
        question text not null,
        answer text not null,
        status text not null default '게시중',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists app.course_import_history (
        id uuid primary key,
        uploaded_by uuid references app.users(id) on delete set null,
        file_name text not null,
        uploaded_at timestamptz not null,
        processed_count integer not null,
        replace_mode boolean not null default false,
        status text not null check (status in ('success','fail')),
        detail text not null default ''
      );
    `)

    await pool.query(`
      alter table app.courses add column if not exists preview_url text;
      alter table app.courses add column if not exists preview_label text;
      alter table app.courses add column if not exists source_category_1 text;
      alter table app.courses add column if not exists source_category_2 text;
      alter table app.courses add column if not exists content_count integer;
      alter table app.courses add column if not exists instructor text;
      alter table app.courses add column if not exists has_assessment boolean default false;
      alter table app.courses add column if not exists source_duration_text text;
      alter table app.notices add column if not exists status text not null default '게시중';
      alter table app.notices add column if not exists created_at timestamptz not null default now();
      alter table app.notices add column if not exists updated_at timestamptz not null default now();
      alter table app.faqs add column if not exists status text not null default '게시중';
      alter table app.faqs add column if not exists created_at timestamptz not null default now();
      alter table app.faqs add column if not exists updated_at timestamptz not null default now();
    `)

    if (shouldSeedRuntimeData()) {
      await seed()
    }
  })()

  globalThis[initKey] = task
  return task
}

function shouldSeedRuntimeData() {
  if (process.env.ON_LEARNING_ENABLE_SEED === '1') return true
  if (process.env.ON_LEARNING_ENABLE_SEED === '0') return false
  return process.env.NODE_ENV !== 'production'
}

async function seed() {
  const pool = getPool()

  const userCount = Number((await pool.query(`select count(*)::int as count from app.users`)).rows[0]?.count || 0)
  if (!userCount) {
    await pool.query(
      `insert into app.users (
        id, employee_id, password_hash, role, name, organization, division, office, team, company_email, interest_course, created_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        crypto.randomUUID(),
        '90000',
        hashPassword('admin1234!'),
        'admin',
        '관리자',
        '현대위아 / 관리자',
        '경영지원본부',
        '본사',
        '운영관리팀',
        'admin@hyundai-wia.com',
        '운영 분석, 관리자 도구',
        new Date('2026-03-08T00:00:00.000Z').toISOString(),
      ],
    )
  }

  const questionCount = Number((await pool.query(`select count(*)::int as count from app.questions`)).rows[0]?.count || 0)
  if (!questionCount) {
    for (const question of defaultQuestions) {
      await pool.query(
        `insert into app.questions (id, title, category, type, options_json, status, created_at)
         values ($1,$2,$3,'choice',$4,'활성',$5)`,
        [question.id, question.title, question.category, JSON.stringify(question.options), new Date('2026-03-08T00:00:00.000Z').toISOString()],
      )
    }
  }

  const courseCount = Number((await pool.query(`select count(*)::int as count from app.courses`)).rows[0]?.count || 0)
  if (!courseCount) {
    for (const course of defaultCourses) {
      await pool.query(
        `insert into app.courses (
          id, course_title, level, duration_hours, competency_area, summary, objectives_json,
          target_audience_json, expected_outcomes_json, reason_tags_json, recommended_by, rank_in_area, status, created_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'운영중',$13)`,
        [
          course.id,
          course.courseTitle,
          course.level,
          course.durationHours,
          course.competencyArea,
          course.summary,
          JSON.stringify(course.objectives),
          JSON.stringify(course.targetAudience),
          JSON.stringify(course.expectedOutcomes),
          JSON.stringify(course.reasonTags),
          course.recommendedBy,
          course.rankInArea,
          new Date('2026-03-08T00:00:00.000Z').toISOString(),
        ],
      )
    }
  }

  const noticeCount = Number((await pool.query(`select count(*)::int as count from app.notices`)).rows[0]?.count || 0)
  if (!noticeCount) {
    for (const notice of defaultNotices) {
      await pool.query(
        `insert into app.notices (id, category, date, title, summary) values ($1,$2,$3,$4,$5)`,
        [notice.id, notice.category, notice.date, notice.title, notice.summary],
      )
    }
  }

  const faqCount = Number((await pool.query(`select count(*)::int as count from app.faqs`)).rows[0]?.count || 0)
  if (!faqCount) {
    for (const faq of defaultFaqs) {
      await pool.query(`insert into app.faqs (id, question, answer) values ($1,$2,$3)`, [faq.id, faq.question, faq.answer])
    }
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  const derived = crypto.scryptSync(password, salt, 64)
  const hashBuffer = Buffer.from(hash, 'hex')
  return hashBuffer.length === derived.length && crypto.timingSafeEqual(hashBuffer, derived)
}

const defaultChoiceOptions = [
  { label: '전혀 그렇지 않다', value: 1 },
  { label: '가끔 그렇다', value: 2 },
  { label: '대체로 그렇다', value: 3 },
  { label: '항상 그렇다', value: 4 },
]

const defaultQuestions = [
  { id: 'q1', title: '반복적으로 발생하는 보고, 정리, 전달 업무를 줄이기 위해 AI 도구나 자동화 방식을 떠올릴 수 있다.', category: 'aiAutomation', options: defaultChoiceOptions },
  { id: 'q2', title: '회의록, 메일 초안, 보고서 요약 등 사무 업무를 AI 도구로 보조해 본 경험이 있다.', category: 'aiAutomation', options: defaultChoiceOptions },
  { id: 'q3', title: 'AI가 만든 결과물을 그대로 쓰지 않고 현업 기준에 맞게 검토하고 수정할 수 있다.', category: 'aiAutomation', options: defaultChoiceOptions },
  { id: 'q4', title: '업무 생산성을 높이기 위해 어떤 프로세스를 자동화할지 스스로 제안할 수 있다.', category: 'aiAutomation', options: defaultChoiceOptions },
  { id: 'q5', title: '업무 판단이 필요할 때 경험이나 감보다 데이터 근거를 먼저 확인하는 편이다.', category: 'dataDecision', options: defaultChoiceOptions },
  { id: 'q6', title: '엑셀, 차트, 통계 도구 등을 활용해 생산, 품질, 비용 데이터를 정리할 수 있다.', category: 'dataDecision', options: defaultChoiceOptions },
  { id: 'q7', title: '수치 결과를 보고 원인, 패턴, 이상 징후를 해석해 실행 방안으로 연결할 수 있다.', category: 'dataDecision', options: defaultChoiceOptions },
  { id: 'q8', title: '데이터 분석 결과를 현업 담당자나 리더가 이해하기 쉽게 설명할 수 있다.', category: 'dataDecision', options: defaultChoiceOptions },
  { id: 'q9', title: '디지털 전환이 제조 현장, 사무 업무, 협업 방식에 어떤 변화를 주는지 설명할 수 있다.', category: 'dxInnovation', options: defaultChoiceOptions },
  { id: 'q10', title: '현재 업무 프로세스를 디지털 방식으로 바꿔볼 개선 아이디어를 제안할 수 있다.', category: 'dxInnovation', options: defaultChoiceOptions },
  { id: 'q11', title: '새로운 시스템이나 업무 방식이 도입될 때 비교적 빠르게 적응하는 편이다.', category: 'dxInnovation', options: defaultChoiceOptions },
  { id: 'q12', title: '디지털 도입 과제를 논의할 때 현업 부서와 IT/기획 부서 사이에서 공통 언어로 소통할 수 있다.', category: 'dxInnovation', options: defaultChoiceOptions },
  { id: 'q13', title: '생산, 품질, 설비, 안전 관련 지표를 업무와 연결해 이해하고 있다.', category: 'operationsQualitySafety', options: defaultChoiceOptions },
  { id: 'q14', title: '현장 이슈가 발생하면 원인 파악과 재발방지 관점에서 문제를 정리하는 편이다.', category: 'operationsQualitySafety', options: defaultChoiceOptions },
  { id: 'q15', title: '품질 기준, 표준 절차, 안전보건 요구사항을 업무 수행 전에 먼저 확인하는 편이다.', category: 'operationsQualitySafety', options: defaultChoiceOptions },
  { id: 'q16', title: '생산성과 품질을 함께 높이기 위한 개선 포인트를 제안하거나 실행한 경험이 있다.', category: 'operationsQualitySafety', options: defaultChoiceOptions },
  { id: 'q17', title: '문제가 생기면 바로 해결책부터 말하기보다 먼저 문제를 명확히 정의하는 편이다.', category: 'problemCollaboration', options: defaultChoiceOptions },
  { id: 'q18', title: '타 부서와 협업할 때 상대의 제약 조건과 입장을 확인하며 조율할 수 있다.', category: 'problemCollaboration', options: defaultChoiceOptions },
  { id: 'q19', title: '회의나 협업 상황에서 질문, 피드백, 정리 역할을 자주 수행하는 편이다.', category: 'problemCollaboration', options: defaultChoiceOptions },
  { id: 'q20', title: '복잡한 문제를 해결할 때 원인 분석, 대안 도출, 실행 계획 순서로 접근한다.', category: 'problemCollaboration', options: defaultChoiceOptions },
]

const defaultCourses = [
  { id: 'AI-101', courseTitle: 'AI가 말했다 그건 네가 안 해도 돼 - 반복 업무 대신 AI가 일하는 업무 자동화 입문', level: '입문', durationHours: 8, competencyArea: 'aiAutomation', summary: '반복 업무를 생성형 AI와 자동화 도구로 줄이는 실무 입문 과정입니다.', objectives: ['반복 업무 자동화 기회 찾기', '생성형 AI 활용 기본 흐름 익히기'], targetAudience: ['사무/생산지원 담당자', 'AI 활용이 처음인 구성원'], expectedOutcomes: ['반복 업무 시간 단축', '업무 자동화 후보 도출'], reasonTags: ['AI자동화', '업무혁신'], recommendedBy: 'skill-gap', rankInArea: 1 },
  { id: 'AI-102', courseTitle: 'AI 업무 실전 활용 - 나는 인공지능 동료와 일한다', level: '입문', durationHours: 2, competencyArea: 'aiAutomation', summary: '업무 현장에서 AI를 동료처럼 활용하는 방법을 익히는 과정입니다.', objectives: ['AI에게 맡길 업무 구분하기', '프롬프트 작성 기본 패턴 익히기'], targetAudience: ['실무 속도 향상이 필요한 구성원'], expectedOutcomes: ['AI 활용 습관 형성', '개인 생산성 향상'], reasonTags: ['AI자동화', '실무적용'], recommendedBy: 'skill-gap', rankInArea: 2 },
  { id: 'DAT-201', courseTitle: '[All that MBA] 데이터 사이언스, 어떻게 인사이트를 얻을 것인가?', level: '중급', durationHours: 5, competencyArea: 'dataDecision', summary: '데이터에서 인사이트를 도출하는 사고방식을 익히는 과정입니다.', objectives: ['데이터 기반 사고 이해', '현업 문제를 데이터 질문으로 바꾸기'], targetAudience: ['데이터 활용이 필요한 실무자'], expectedOutcomes: ['판단 근거 강화', '인사이트 도출 역량 확보'], reasonTags: ['데이터의사결정', '인사이트'], recommendedBy: 'skill-gap', rankInArea: 1 },
  { id: 'DAT-202', courseTitle: '올인원 데이터분석 실무 : 데이터를 다루는 핵심 테크닉', level: '중급', durationHours: 3, competencyArea: 'dataDecision', summary: '실무에서 가장 자주 쓰는 데이터 분석 핵심 테크닉을 익히는 과정입니다.', objectives: ['데이터 정제 기본기 확보', '핵심 분석 흐름 익히기'], targetAudience: ['현업 데이터 담당자'], expectedOutcomes: ['분석 기본기 강화', '보고 정확도 개선'], reasonTags: ['데이터의사결정', '분석실무'], recommendedBy: 'skill-gap', rankInArea: 2 },
  { id: 'DX-301', courseTitle: '[DX 아카이브] DX개념과 패러다임 이해', level: '입문', durationHours: 3, competencyArea: 'dxInnovation', summary: '디지털 전환의 개념과 패러다임을 이해하는 과정입니다.', objectives: ['DX 개념과 배경 이해', '제조기업 DX 사례 인식'], targetAudience: ['DX 입문자'], expectedOutcomes: ['DX 공감대 형성', '변화 언어 이해'], reasonTags: ['DX혁신', '개념이해'], recommendedBy: 'skill-gap', rankInArea: 1 },
  { id: 'OPS-401', courseTitle: '[All that MBA] 생산관리, 어떻게 현장을 혁신할 것인가?', level: '중급', durationHours: 5, competencyArea: 'operationsQualitySafety', summary: '생산관리 핵심 개념을 바탕으로 현장 혁신 포인트를 학습하는 과정입니다.', objectives: ['생산관리 핵심 구조 이해', '현장 운영 개선 포인트 찾기'], targetAudience: ['생산/공정 운영 담당자'], expectedOutcomes: ['운영 판단력 강화', '현장 개선 아이디어 발굴'], reasonTags: ['생산품질안전', '생산혁신'], recommendedBy: 'skill-gap', rankInArea: 1 },
  { id: 'OPS-403', courseTitle: '[ISO경영 아카이브] ISO 9001(품질경영)관리', level: '중급', durationHours: 4, competencyArea: 'operationsQualitySafety', summary: '품질경영 시스템의 기본과 ISO 9001 요구사항을 이해하는 과정입니다.', objectives: ['ISO 9001 핵심 요구사항 이해', '품질관리 체계와 현업 연결하기'], targetAudience: ['품질 담당자'], expectedOutcomes: ['품질 운영 이해도 향상', '표준 기반 개선 역량 확보'], reasonTags: ['생산품질안전', '품질경영'], recommendedBy: 'skill-gap', rankInArea: 2 },
  { id: 'COL-501', courseTitle: '문제를 성과로 만드는 실전 문제해결 프로세스', level: '입문', durationHours: 1, competencyArea: 'problemCollaboration', summary: '문제를 구조화하고 실행 가능한 해결안으로 연결하는 문제해결 기본 과정입니다.', objectives: ['문제 정의 명확화', '원인 분석 기법 익히기'], targetAudience: ['현장 문제 해결이 필요한 구성원'], expectedOutcomes: ['문제해결 기본기 향상', '실행계획 품질 개선'], reasonTags: ['문제해결협업', '원인분석'], recommendedBy: 'skill-gap', rankInArea: 1 },
]

const defaultNotices = [
  { id: 'notice-1', category: '학습 안내', date: '2026.03.07', title: '3월 AI 기초 과정 추천이 새롭게 반영되었습니다.', summary: '역량 진단 결과를 기반으로 추천 과정과 학습 경로가 매일 업데이트됩니다.' },
  { id: 'notice-2', category: '운영 공지', date: '2026.03.04', title: '추천 과정 저장 기능이 개선되었습니다.', summary: '선택한 추천 과정은 나의 학습 화면에서 바로 이어서 확인할 수 있습니다.' },
  { id: 'notice-3', category: '서비스 점검', date: '2026.02.28', title: '이캠퍼스 연동 안내가 최신 기준으로 정리되었습니다.', summary: '신청 전 확인해야 할 안내와 예외 대응 흐름을 더 쉽게 확인할 수 있습니다.' },
]

const defaultFaqs = [
  { id: 'faq-1', question: '역량 진단은 얼마나 걸리나요?', answer: '평균 5분 내외이며, 응답은 자동 저장되어 중간에 다시 이어서 진행할 수 있습니다.' },
  { id: 'faq-2', question: '추천 과정은 어떤 기준으로 만들어지나요?', answer: '가장 보완이 필요한 역량과 현재 역할을 함께 반영해 상위 학습 과정이 우선 추천됩니다.' },
  { id: 'faq-3', question: '추천 과정을 저장하면 어디서 다시 볼 수 있나요?', answer: '저장한 과정은 나의 학습 화면과 추천 화면에서 다시 확인하고 바로 이어서 볼 수 있습니다.' },
  { id: 'faq-4', question: '더 도움이 필요하면 어디에서 문의하나요?', answer: '커뮤니티 메뉴의 AI 챗봇 상담에서 추천 이유, 신청 상태, 다음 학습 방향을 바로 안내받을 수 있습니다.' },
]
