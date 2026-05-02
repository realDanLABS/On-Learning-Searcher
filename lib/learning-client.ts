'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { getSupabaseAppProfile } from '@/lib/supabase/private-app-client'

export type CompetencyAreaKey =
  | 'aiAutomation'
  | 'dataDecision'
  | 'dxInnovation'
  | 'operationsQualitySafety'
  | 'problemCollaboration'

export type CategoryScores = Record<CompetencyAreaKey, number>

export type DiagnosisPayload = {
  userId: string
  employeeId?: string
  userName?: string
  diagnosedAt: string
  totalScore: number
  maxScore: number
  categoryScores: CategoryScores
  topGaps: CompetencyAreaKey[]
}

export type RecommendedCourse = {
  courseId: string
  courseTitle: string
  level: '입문' | '중급' | '심화'
  durationHours: number
  competencyArea: CompetencyAreaKey
  summary: string
  objectives: string[]
  targetAudience: string[]
  expectedOutcomes: string[]
  reasonTags: string[]
  recommendedBy: 'skill-gap' | 'role-fit' | 'history-based'
  fitScore?: number
  sourceCategory1?: string
  sourceCategory2?: string
  previewUrl?: string
  previewLabel?: string
  contentCount?: number
  instructor?: string
  hasAssessment?: boolean
  sourceDurationText?: string
}

export type EnrollmentRecord = {
  userId: string
  courseId: string
  courseTitle: string
  enrollmentRequestedAt: string
  enrollmentStatus: 'requested' | 'enrolled' | 'failed' | 'return-missing'
  failureReason?: string
}

export type JourneyStage = 'start' | 'diagnosis_done' | 'course_selected' | 'enrollment_done'

type SupabaseErrorLike = { message?: string } | null

type SupabaseResult<T> = {
  data: T
  error: SupabaseErrorLike
}

type SupabaseRpc = (fn: string, args?: Record<string, unknown>) => Promise<SupabaseResult<unknown>>

type SupabaseDiagnosisRow = {
  user_id?: string
  diagnosed_at: string
  total_score: number
  max_score: number
  category_scores_json: CategoryScores
  top_gaps_json: CompetencyAreaKey[]
}

type SupabaseSelectedCourseRow = {
  course_json: RecommendedCourse | null
}

type SupabaseEnrollmentRow = {
  course_id: string
  course_title: string
  enrollment_requested_at: string
  enrollment_status: EnrollmentRecord['enrollmentStatus']
  failure_reason: string | null
}

type LearningCourseRow = {
  id: string
  course_title: string
  level: RecommendedCourse['level']
  duration_hours: number
  competency_area: CompetencyAreaKey
  summary: string
  objectives_json?: string[] | null
  target_audience_json?: string[] | null
  expected_outcomes_json?: string[] | null
  reason_tags_json?: string[] | null
  recommended_by?: RecommendedCourse['recommendedBy'] | null
  preview_url?: string | null
  preview_label?: string | null
  source_category_1?: string | null
  source_category_2?: string | null
  content_count?: number | null
  instructor?: string | null
  has_assessment?: boolean | null
  source_duration_text?: string | null
}

type AdminPreviewPayload = {
  users: Array<{ id: string; role?: string; division?: string }>
  diagnoses: SupabaseDiagnosisRow[]
  courses: LearningCourseRow[]
}

export async function fetchDiagnosis(userId?: string) {
  if (userId) {
    const preview = await fetchAdminPreviewPayload(userId)
    const diagnosis = preview.diagnosis
    if (diagnosis) {
      return diagnosis
    }
    return null
  }

  const supabase = getSupabaseBrowserClient()
  const profile = await getSupabaseAppProfile()
  if (!profile?.id) {
    window.localStorage.removeItem(KEY_DIAGNOSIS)
    return null
  }

  const result = (await supabase.from('my_latest_diagnosis').select('*').maybeSingle()) as unknown as SupabaseResult<
    SupabaseDiagnosisRow | null
  >
  const { data, error } = result
  if (error || !data) {
    window.localStorage.removeItem(KEY_DIAGNOSIS)
    return null
  }

  const diagnosis = parseSupabaseDiagnosisRow(data)
  window.localStorage.setItem(KEY_DIAGNOSIS, JSON.stringify(diagnosis))
  return diagnosis
}

export async function fetchDiagnosisHistory(userId?: string) {
  if (userId) {
    const preview = await fetchAdminPreviewPayload(userId)
    const history = preview.history
    window.localStorage.setItem(KEY_DIAGNOSIS_HISTORY, JSON.stringify(history))
    return history
  }

  const supabase = getSupabaseBrowserClient()
  const profile = await getSupabaseAppProfile()
  if (!profile?.id) {
    window.localStorage.removeItem(KEY_DIAGNOSIS_HISTORY)
    return []
  }

  const result = (await supabase.from('my_diagnosis_history').select('*')) as unknown as SupabaseResult<SupabaseDiagnosisRow[] | null>
  const { data, error } = result
  if (error || !data) {
    window.localStorage.removeItem(KEY_DIAGNOSIS_HISTORY)
    return []
  }

  const history = data.map(parseSupabaseDiagnosisRow)
  window.localStorage.setItem(KEY_DIAGNOSIS_HISTORY, JSON.stringify(history))
  return history
}

export async function submitDiagnosis(payload: DiagnosisPayload) {
  const supabase = getSupabaseBrowserClient()
  const profile = await getSupabaseAppProfile()
  if (!profile?.id) {
    throw new Error('supabase-session-required')
  }

  const rpc = supabase.rpc as unknown as SupabaseRpc
  const { error } = await rpc('save_diagnosis', {
    p_diagnosed_at: payload.diagnosedAt,
    p_total_score: payload.totalScore,
    p_max_score: payload.maxScore,
    p_category_scores: payload.categoryScores,
    p_top_gaps: payload.topGaps,
  })
  if (error) {
    throw new Error(error.message || 'save-diagnosis-failed')
  }

  window.localStorage.setItem(KEY_DIAGNOSIS, JSON.stringify(payload))
  const currentHistory = readJson<DiagnosisPayload[]>(KEY_DIAGNOSIS_HISTORY) ?? []
  const nextHistory = [payload, ...currentHistory.filter((item) => item.diagnosedAt !== payload.diagnosedAt)].slice(0, 12)
  window.localStorage.setItem(KEY_DIAGNOSIS_HISTORY, JSON.stringify(nextHistory))
  window.localStorage.removeItem(KEY_SELECTED_COURSE)
  window.localStorage.setItem(KEY_REMOTE_STAGE_SNAPSHOT, 'diagnosis_done')
  return { ok: true }
}

export async function fetchRecommendedCourses(level: 'all' | '입문' | '중급' | '심화' = 'all', userId?: string) {
  let role: string | undefined
  let diagnosis: DiagnosisPayload | null = null
  let courseRows: LearningCourseRow[] = []

  if (userId) {
    const preview = await fetchAdminPreviewPayload(userId)
    diagnosis = preview.diagnosis
    role = preview.role
    courseRows = preview.courses
  } else {
    const supabase = getSupabaseBrowserClient()
    const profile = await getSupabaseAppProfile()
    if (!profile?.id) {
      return []
    }

    const [courseResult, diagnosisResult, profileResult] = await Promise.all([
      supabase.from('learning_courses').select('*'),
      supabase.from('my_latest_diagnosis').select('*').maybeSingle(),
      supabase.from('my_profile').select('role').maybeSingle(),
    ])

    courseRows = (courseResult.data as LearningCourseRow[] | null) || []
    role = (profileResult.data as { role?: string } | null)?.role
    diagnosis = diagnosisResult.data ? parseSupabaseDiagnosisRow(diagnosisResult.data as unknown as SupabaseDiagnosisRow) : null
  }

  const courses = courseRows
    .map(parseLearningCourseRow)
    .map((course) => ({
      ...course,
      fitScore: scoreRecommendedCourse(course, diagnosis, role),
    }))
    .filter((course) => (level === 'all' ? true : course.level === level))
    .sort((left, right) => (right.fitScore || 0) - (left.fitScore || 0))

  return courses
}

export async function selectRecommendedCourse(course: RecommendedCourse) {
  const supabase = getSupabaseBrowserClient()
  const profile = await getSupabaseAppProfile()
  if (!profile?.id) {
    throw new Error('supabase-session-required')
  }

  const rpc = supabase.rpc as unknown as SupabaseRpc
  const { error } = await rpc('save_selected_course', {
    p_course: course,
  })
  if (error) {
    throw new Error(error.message || 'save-selected-course-failed')
  }

  window.localStorage.setItem(KEY_SELECTED_COURSE, JSON.stringify(course))
  window.localStorage.setItem(KEY_REMOTE_STAGE_SNAPSHOT, 'course_selected')
  return { ok: true }
}

export async function fetchSelectedCourse() {
  const supabase = getSupabaseBrowserClient()
  const profile = await getSupabaseAppProfile()
  if (!profile?.id) {
    window.localStorage.removeItem(KEY_SELECTED_COURSE)
    return null
  }

  const result = (await supabase.from('my_selected_course').select('course_json').maybeSingle()) as unknown as SupabaseResult<
    SupabaseSelectedCourseRow | null
  >
  const { data, error } = result
  if (error) {
    throw new Error(error.message || 'fetch-selected-course-failed')
  }

  const selected = data?.course_json ?? null
  if (selected) {
    window.localStorage.setItem(KEY_SELECTED_COURSE, JSON.stringify(selected))
  } else {
    window.localStorage.removeItem(KEY_SELECTED_COURSE)
  }
  return selected
}

export async function submitEnrollment(record: EnrollmentRecord) {
  const supabase = getSupabaseBrowserClient()
  const profile = await getSupabaseAppProfile()
  if (!profile?.id) {
    throw new Error('supabase-session-required')
  }

  const rpc = supabase.rpc as unknown as SupabaseRpc
  const { error } = await rpc('save_enrollment', {
    p_course_id: record.courseId,
    p_course_title: record.courseTitle,
    p_enrollment_requested_at: record.enrollmentRequestedAt,
    p_enrollment_status: record.enrollmentStatus,
    p_failure_reason: record.failureReason || null,
  })
  if (error) {
    throw new Error(error.message || 'save-enrollment-failed')
  }

  const current = readJson<EnrollmentRecord[]>(KEY_ENROLLMENT) ?? []
  const next = [record, ...current].filter(
    (item, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.courseId === item.courseId &&
          candidate.enrollmentRequestedAt === item.enrollmentRequestedAt &&
          candidate.enrollmentStatus === item.enrollmentStatus,
      ) === index,
  )
  window.localStorage.setItem(KEY_ENROLLMENT, JSON.stringify(next))
  if (record.enrollmentStatus === 'enrolled') {
    window.localStorage.setItem(KEY_REMOTE_STAGE_SNAPSHOT, 'enrollment_done')
  }
  return { ok: true }
}

export async function fetchEnrollmentHistory() {
  const supabase = getSupabaseBrowserClient()
  const profile = await getSupabaseAppProfile()
  if (!profile?.id) {
    window.localStorage.removeItem(KEY_ENROLLMENT)
    return []
  }

  const result = (await supabase.from('my_enrollments').select('*')) as unknown as SupabaseResult<SupabaseEnrollmentRow[] | null>
  const { data, error } = result
  if (error || !data) {
    throw new Error(error?.message || 'fetch-enrollments-failed')
  }

  const enrollments = data.map((row) => ({
    userId: profile.id,
    courseId: row.course_id,
    courseTitle: row.course_title,
    enrollmentRequestedAt: row.enrollment_requested_at,
    enrollmentStatus: row.enrollment_status,
    failureReason: row.failure_reason || undefined,
  })) as EnrollmentRecord[]
  window.localStorage.setItem(KEY_ENROLLMENT, JSON.stringify(enrollments))
  return enrollments
}

export async function fetchJourneyStage() {
  const supabase = getSupabaseBrowserClient()
  const profile = await getSupabaseAppProfile()
  if (!profile?.id) {
    window.localStorage.setItem(KEY_REMOTE_STAGE_SNAPSHOT, 'start')
    return 'start'
  }

  const rpc = supabase.rpc as unknown as SupabaseRpc
  const { data, error } = (await rpc('my_journey_stage')) as SupabaseResult<JourneyStage | null>
  if (error || typeof data !== 'string') {
    throw new Error(error?.message || 'fetch-journey-stage-failed')
  }

  const stage = data as JourneyStage
  window.localStorage.setItem(KEY_REMOTE_STAGE_SNAPSHOT, stage)
  return stage
}

async function fetchAdminPreviewPayload(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const rpc = supabase.rpc as unknown as SupabaseRpc
  const { data, error } = (await rpc('admin_dashboard_payload')) as SupabaseResult<AdminPreviewPayload | null>
  if (error || !data) {
    throw new Error(error?.message || 'admin-preview-payload-failed')
  }

  const role = data.users.find((user) => user.id === userId)?.role
  const history = (data.diagnoses || [])
    .filter((row) => row.user_id === userId)
    .map(parseSupabaseDiagnosisRow)
    .sort((left, right) => String(right.diagnosedAt).localeCompare(String(left.diagnosedAt)))

  return {
    role,
    history,
    diagnosis: history[0] || null,
    courses: data.courses || [],
  }
}

function parseSupabaseDiagnosisRow(row: SupabaseDiagnosisRow) {
  return {
    userId: row.user_id || '',
    diagnosedAt: row.diagnosed_at,
    totalScore: row.total_score,
    maxScore: row.max_score,
    categoryScores: row.category_scores_json,
    topGaps: row.top_gaps_json,
  } satisfies DiagnosisPayload
}

function parseLearningCourseRow(row: LearningCourseRow) {
  return {
    courseId: row.id,
    courseTitle: row.course_title,
    level: row.level,
    durationHours: row.duration_hours,
    competencyArea: row.competency_area,
    summary: row.summary,
    objectives: row.objectives_json || [],
    targetAudience: row.target_audience_json || [],
    expectedOutcomes: row.expected_outcomes_json || [],
    reasonTags: row.reason_tags_json || [],
    recommendedBy: row.recommended_by || 'skill-gap',
    sourceCategory1: row.source_category_1 || undefined,
    sourceCategory2: row.source_category_2 || undefined,
    previewUrl: row.preview_url || undefined,
    previewLabel: row.preview_label || undefined,
    contentCount: row.content_count || 0,
    instructor: row.instructor || undefined,
    hasAssessment: Boolean(row.has_assessment),
    sourceDurationText: row.source_duration_text || undefined,
  } satisfies RecommendedCourse
}

function scoreRecommendedCourse(course: RecommendedCourse, diagnosis: DiagnosisPayload | null, role: string | undefined) {
  if (!diagnosis) return 50

  let score = 18
  const topGaps = diagnosis.topGaps || []
  if (course.competencyArea === topGaps[0]) score += 42
  if (course.competencyArea === topGaps[1]) score += 24
  if (course.competencyArea === topGaps[2]) score += 12

  const rate = Number(diagnosis.totalScore || 0) / Math.max(1, Number(diagnosis.maxScore || 1))
  const preferredLevel: RecommendedCourse['level'] = rate >= 0.75 ? '심화' : rate >= 0.45 ? '중급' : '입문'
  const levelOrder: Record<RecommendedCourse['level'], number> = { 입문: 0, 중급: 1, 심화: 2 }
  const distance = Math.abs(levelOrder[course.level] - levelOrder[preferredLevel])
  score += distance === 0 ? 16 : distance === 1 ? 7 : -4

  const categoryScore = diagnosis.categoryScores?.[course.competencyArea] ?? 10
  const deficitRate = 1 - categoryScore / 20
  score += Math.max(0, Math.round(deficitRate * 18))
  if (course.recommendedBy === 'skill-gap') score += 8
  if (role === 'manager' && course.competencyArea === 'problemCollaboration') score += 8
  if (role === 'admin' && course.competencyArea === 'operationsQualitySafety') score += 8

  const signals = buildRecommendationSignals(course)
  if (signals.hasAssessment) score += 3
  if (signals.isTechnicalTrack) score += 4
  if (signals.isLanguageTrack && course.competencyArea !== topGaps[0]) score -= 12
  if (signals.isBookTrack && course.competencyArea !== topGaps[0]) score -= 8

  return Math.min(99, score)
}

function buildRecommendationSignals(course: {
  sourceCategory1?: string
  sourceCategory2?: string
  competencyArea: string
  hasAssessment?: boolean
}) {
  const c1 = normalized(course.sourceCategory1 || '')
  const penalties = ['영어', '제2외국어', '중국어', '일본어', '10분 독서', '비즈니스 북터뷰', '교보문고']
  const normalizedPenalties = penalties.map((item) => item.toLowerCase())
  return {
    isLanguageTrack: normalizedPenalties.slice(0, 4).includes(c1),
    isBookTrack: normalizedPenalties.slice(4).includes(c1),
    isTechnicalTrack: ['oa', 'it', '산업전문', 'ai', '자격증'].includes(c1),
    hasAssessment: Boolean(course.hasAssessment),
  }
}

function normalized(value: string) {
  return String(value || '').trim().toLowerCase()
}

const KEY_DIAGNOSIS = 'on_learning_diagnosis_payload_v1'
const KEY_DIAGNOSIS_HISTORY = 'on_learning_diagnosis_history_v1'
const KEY_SELECTED_COURSE = 'on_learning_selected_course_v1'
const KEY_ENROLLMENT = 'on_learning_enrollment_records_v1'
const KEY_REMOTE_STAGE_SNAPSHOT = 'on_learning_remote_stage_snapshot_v1'

function readJson<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key)
  if (!raw) return null

  try {
    return JSON.parse(raw) as T
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}
