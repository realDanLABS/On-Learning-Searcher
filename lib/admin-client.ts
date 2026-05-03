'use client'

import { isSupabaseMode } from '@/lib/data-mode'
import { runtime } from '@/lib/runtime'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export type AdminDashboardPayload = {
  userName: string
  organization?: string
  kpis: Array<{ label: string; value: string; delta: string; tone: string; unit?: string; progress?: number }>
  funnel: Array<{ label: string; percent: number }>
  insights: Array<{ title: string; body: string }>
  urgentActions: string[]
  departmentComparisons: AdminDepartment[]
  trendComparison?: Array<{ label: string; completion: number; competency: number }>
  summary?: {
    departmentCount: number
    displayedDepartments: number
  }
}

export type AdminDepartment = {
  name: string
  users: number
  participation: number
  completion: number
  avgScore: number
}

export type AdminDepartmentDetail = {
  name: string
  users: number
  participation: number
  completion: number
  avgScore: number
  avgLearningHours: number
  topStrength: string
  statusLabel: string
  statusTone: 'emerald' | 'blue' | 'slate'
  topCourses: Array<{ title: string; count: number }>
}

export type AdminDepartmentsPayload = {
  userName: string
  focusDivision: string
  filters: string[]
  kpis: Array<{ label: string; value: string; delta: string; tone: string }>
  competencyComparison: Array<{ label: string; departmentScore: number; overallScore: number }>
  topCourses: Array<{ rank: number; title: string; percent: number }>
  departments: AdminDepartmentDetail[]
  summary: {
    departmentCount: number
    displayedDepartments: number
  }
}

export type AdminQuestion = {
  id: string
  order: number
  categoryKey: string
  area: string
  title: string
  date: string
  status: string
}

export type AdminCourse = {
  id: string
  title: string
  summary: string
  competencyArea: string
  category: string
  level: '입문' | '중급' | '심화'
  durationHours: number
  users: number
  status: string
}

export type AdminUser = {
  id: string
  name: string
  employeeId: string
  division: string
  team: string
  email: string
  interestCourse: string
  role: 'employee' | 'manager' | 'admin'
  joinedAt: string
  diagnosisDate: string
  status: string
}

export type AdminUsersPayload = {
  userName: string
  users: AdminUser[]
  filters?: {
    divisions?: string[]
    statuses?: string[]
  }
}

export type AdminNotice = {
  id: string
  category: string
  date: string
  title: string
  summary: string
  status?: string
  created_at?: string
  updated_at?: string
}

export type AdminFaq = {
  id: string
  question: string
  answer: string
  status?: string
  created_at?: string
  updated_at?: string
}

export type AdminCourseImportHistoryItem = {
  id: string
  fileName: string
  uploadedAt: string
  processedCount: number
  replaceMode: boolean
  status: 'success' | 'fail'
  detail: string
  uploadedBy?: string
}

type SupabaseErrorLike = { message?: string } | null

type SupabaseResult<T> = {
  data: T
  error: SupabaseErrorLike
}

type AdminCourseRow = {
  id: string
  course_title: string
  summary: string
  competency_area: string
  level: AdminCourse['level']
  duration_hours: number
  status: string
  source_category_1?: string | null
  source_category_2?: string | null
  preview_url?: string | null
  content_count?: number | null
  instructor?: string | null
  has_assessment?: boolean | null
}

type AdminUserRow = {
  id: string
  name: string
  employee_id: string
  division: string
  team: string
  company_email: string
  interest_course: string
  role: AdminUser['role']
  created_at: string
  admin_status_override?: string | null
}

type AdminEnrollmentSummaryRow = {
  user_id: string
  course_id?: string
  enrollment_status: EnrollmentRecordStatus
  enrollment_requested_at: string
  division?: string
}

type AdminDashboardDiagnosisRow = {
  user_id: string
  diagnosed_at: string
  total_score: number
  max_score: number
  category_scores_json: Record<string, number>
  top_gaps_json: string[]
  division?: string
}

type AdminCourseDetailedRow = AdminCourseRow & {
  objectives_json?: string[] | null
  target_audience_json?: string[] | null
  expected_outcomes_json?: string[] | null
  reason_tags_json?: string[] | null
  recommended_by?: string | null
}

type EnrollmentRecordStatus = 'requested' | 'enrolled' | 'failed' | 'return-missing'

type ImportCourseInput = {
  id: string
  course_title: string
  level: AdminCourse['level']
  duration_hours: number
  competency_area: string
  summary: string
  objectives_json: string[]
  target_audience_json: string[]
  expected_outcomes_json: string[]
  reason_tags_json: string[]
  recommended_by: string
  rank_in_area: number
  status: string
  created_at: string
  preview_url: string
  preview_label: string
  source_category_1: string
  source_category_2: string
  content_count: number
  instructor: string
  has_assessment: boolean
  source_duration_text: string
}

const competencyAreaText: Record<string, string> = {
  aiAutomation: 'AI/자동화 활용',
  dataDecision: '데이터 기반 의사결정',
  dxInnovation: 'DX 혁신 이해',
  operationsQualitySafety: '생산/품질/안전 운영',
  problemCollaboration: '문제해결/협업',
}

function shouldUseSupabaseAdmin() {
  return isSupabaseMode()
}

type AdminDashboardRpcPayload = {
  userName: string
  organization?: string
  users: Array<Pick<AdminUserRow, 'id' | 'role' | 'division'>>
  diagnoses: AdminDashboardDiagnosisRow[]
  enrollments: AdminEnrollmentSummaryRow[]
  courses: AdminCourseDetailedRow[]
}

type AdminDepartmentsRpcPayload = AdminDashboardRpcPayload & {
  requestedDivision?: string
}

export function fetchAdminDashboardPayload() {
  if (shouldUseSupabaseAdmin()) {
    return fetchAdminDashboardPayloadFromSupabase()
  }
  return requestJson<AdminDashboardPayload>('/admin/dashboard')
}

export function fetchAdminDepartmentsPayload(division?: string) {
  if (shouldUseSupabaseAdmin()) {
    return fetchAdminDepartmentsPayloadFromSupabase(division)
  }
  const query = division ? `?division=${encodeURIComponent(division)}` : ''
  return requestJson<AdminDepartmentsPayload>(`/admin/departments${query}`)
}

export function fetchAdminQuestionsPayload() {
  if (shouldUseSupabaseAdmin()) {
    return fetchAdminQuestionsPayloadFromSupabase()
  }
  return requestJson<{ userName: string; questions: AdminQuestion[] }>('/admin/questions')
}

export function createAdminQuestion(input: { title: string; category: string; options?: Array<{ label: string; value: number }> }) {
  if (shouldUseSupabaseAdmin()) {
    return createAdminQuestionInSupabase(input)
  }
  return requestJson<{ ok: boolean }>('/admin/questions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAdminQuestion(id: string, input: { title: string; category: string }) {
  if (shouldUseSupabaseAdmin()) {
    return updateAdminQuestionInSupabase(id, input)
  }
  return requestJson<{ ok: boolean }>(`/admin/questions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAdminQuestion(id: string) {
  if (shouldUseSupabaseAdmin()) {
    return deleteAdminQuestionInSupabase(id)
  }
  return requestJson<{ ok: boolean }>(`/admin/questions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchAdminCoursesPayload() {
  if (shouldUseSupabaseAdmin()) {
    return fetchAdminCoursesPayloadFromSupabase()
  }
  return requestJson<{ userName: string; courses: AdminCourse[] }>('/admin/courses')
}

export function createAdminCourse(input: Record<string, unknown>) {
  if (shouldUseSupabaseAdmin()) {
    return createAdminCourseInSupabase(input)
  }
  return requestJson<{ ok: boolean }>('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function importAdminCourses(input: { rows: Record<string, unknown>[]; replace?: boolean; fileName?: string }) {
  if (shouldUseSupabaseAdmin()) {
    return importAdminCoursesToSupabase(input)
  }
  return requestJson<{ ok: boolean; importedCount?: number; replace?: boolean }>('/admin/courses/import', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchAdminCourseImportHistory() {
  if (shouldUseSupabaseAdmin()) {
    return fetchAdminCourseImportHistoryFromSupabase()
  }
  return requestJson<AdminCourseImportHistoryItem[]>('/admin/courses/import-history')
}

export function updateAdminCourse(id: string, input: Record<string, unknown>) {
  if (shouldUseSupabaseAdmin()) {
    return updateAdminCourseInSupabase(id, input)
  }
  return requestJson<{ ok: boolean }>(`/admin/courses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAdminCourse(id: string) {
  if (shouldUseSupabaseAdmin()) {
    return deleteAdminCourseInSupabase(id)
  }
  return requestJson<{ ok: boolean }>(`/admin/courses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchAdminUsersPayload() {
  if (shouldUseSupabaseAdmin()) {
    return fetchAdminUsersPayloadFromSupabase()
  }
  return requestJson<AdminUsersPayload>('/admin/users')
}

export function updateAdminUser(id: string, input: Record<string, unknown>) {
  if (shouldUseSupabaseAdmin()) {
    return updateAdminUserInSupabase(id, input)
  }
  return requestJson<{ ok: boolean }>(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function createAdminUser(input: Record<string, unknown>) {
  if (shouldUseSupabaseAdmin()) {
    return createAdminUserInSupabase(input)
  }
  return requestJson<{ ok: boolean }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function importAdminUsers(input: { users: Record<string, unknown>[] }) {
  if (shouldUseSupabaseAdmin()) {
    return importAdminUsersToSupabase(input)
  }
  return requestJson<{ ok: boolean; importedCount?: number; updatedCount?: number }>('/admin/users/import', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteAdminUser(id: string, confirmationEmployeeId?: string) {
  if (shouldUseSupabaseAdmin()) {
    return deleteAdminUserInSupabase(id, confirmationEmployeeId)
  }
  return requestJson<{ ok: boolean }>(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: JSON.stringify(
      confirmationEmployeeId
        ? { confirmationEmployeeId }
        : {},
    ),
  })
}

export function fetchAdminBoardsPayload() {
  if (shouldUseSupabaseAdmin()) {
    return fetchAdminBoardsPayloadFromSupabase()
  }
  return requestJson<{ userName: string; notices: AdminNotice[]; faqs: AdminFaq[] }>('/admin/boards')
}

export function createAdminNotice(input: Record<string, unknown>) {
  if (shouldUseSupabaseAdmin()) {
    return createAdminNoticeInSupabase(input)
  }
  return requestJson<{ ok: boolean }>('/admin/notices', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAdminNotice(id: string, input: Record<string, unknown>) {
  if (shouldUseSupabaseAdmin()) {
    return updateAdminNoticeInSupabase(id, input)
  }
  return requestJson<{ ok: boolean }>(`/admin/notices/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAdminNotice(id: string) {
  if (shouldUseSupabaseAdmin()) {
    return deleteAdminNoticeInSupabase(id)
  }
  return requestJson<{ ok: boolean }>(`/admin/notices/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function createAdminFaq(input: Record<string, unknown>) {
  if (shouldUseSupabaseAdmin()) {
    return createAdminFaqInSupabase(input)
  }
  return requestJson<{ ok: boolean }>('/admin/faqs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAdminFaq(id: string, input: Record<string, unknown>) {
  if (shouldUseSupabaseAdmin()) {
    return updateAdminFaqInSupabase(id, input)
  }
  return requestJson<{ ok: boolean }>(`/admin/faqs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAdminFaq(id: string) {
  if (shouldUseSupabaseAdmin()) {
    return deleteAdminFaqInSupabase(id)
  }
  return requestJson<{ ok: boolean }>(`/admin/faqs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function fetchAdminQuestionsPayloadFromSupabase() {
  const supabase = await requireAdminSupabaseClient()
  const rpc = getSupabaseRpc(supabase)
  const result = (await rpc('admin_questions_payload')) as SupabaseResult<{
    userName: string
    questions: AdminQuestion[]
  }>
  if (result.error) throw new Error(result.error.message || '문항 데이터를 불러오지 못했습니다.')
  return result.data
}

async function fetchAdminDashboardPayloadFromSupabase() {
  const payload = await callAdminRpc<AdminDashboardRpcPayload>('admin_dashboard_payload', undefined, '대시보드 데이터를 불러오지 못했습니다.')
  const latestDiagnoses = dedupeLatestByUser(payload.diagnoses ?? [], (row) => row.user_id, (row) => row.diagnosed_at)
  const latestEnrollments = dedupeLatestByUser(payload.enrollments ?? [], (row) => row.user_id, (row) => row.enrollment_requested_at)
  const departmentComparisons = buildDepartmentStatsFromRows(payload.users ?? [], latestDiagnoses, latestEnrollments)
  const trends = buildDashboardTrendsFromRows(latestDiagnoses, latestEnrollments, payload.users ?? [], payload.courses ?? [])
  const activeLearners = new Set([
    ...latestDiagnoses.map((item) => item.user_id),
    ...latestEnrollments.map((item) => item.user_id),
  ]).size
  const diagnosed = latestDiagnoses.length
  const completed = latestEnrollments.filter((item) => item.enrollment_status === 'enrolled').length
  const applied = latestEnrollments.length
  const failed = latestEnrollments.filter((item) => item.enrollment_status === 'failed').length
  const avgParticipation = averageRounded(departmentComparisons.map((item) => item.participation))
  const avgCompletion = averageRounded(departmentComparisons.map((item) => item.completion))
  const avgScore = averageFixed(departmentComparisons.map((item) => item.avgScore), 1)
  const latestDiagnosis = [...latestDiagnoses].sort((a, b) => String(b.diagnosed_at).localeCompare(String(a.diagnosed_at)))[0]
  const topGap = latestDiagnosis?.top_gaps_json?.[0]
  const lowPerformingDepartment = [...departmentComparisons].sort((left, right) => left.completion - right.completion)[0]
  const topPerformingDepartment = [...departmentComparisons].sort((left, right) => right.participation - left.participation)[0]
  return {
    userName: payload.userName,
    organization: payload.organization || '',
    kpis: [
      {
        label: '평균 참여율',
        value: String(avgParticipation),
        delta: `${diagnosed}명 진단 완료`,
        tone: avgParticipation >= 80 ? 'positive' : 'warning',
        unit: '%',
        progress: avgParticipation,
      },
      {
        label: '평균 완료율',
        value: String(avgCompletion),
        delta: `${completed}명 수강완료`,
        tone: avgCompletion >= 70 ? 'positive' : 'warning',
        unit: '%',
        progress: avgCompletion,
      },
      {
        label: '평균 역량 점수',
        value: String(avgScore),
        delta: `${topGap ? `${competencyAreaText[topGap] || topGap} 보완 필요` : '진단 데이터 기준'}`,
        tone: avgScore >= 70 ? 'positive' : 'neutral',
        unit: '/100',
        progress: Math.round(avgScore),
      },
      {
        label: '활성 학습자',
        value: String(activeLearners),
        delta: `${(payload.users ?? []).filter((user) => user.role === 'admin').length}명 관리자 포함`,
        tone: 'neutral',
        unit: '명',
        progress: (payload.users ?? []).length ? Math.round((activeLearners / (payload.users ?? []).length) * 100) : 0,
      },
    ],
    funnel: [
      { label: `진단 완료 (${diagnosed}명)`, percent: diagnosed ? 100 : 0 },
      { label: `추천 교육 확인 (${Math.max(0, diagnosed - failed)}명)`, percent: diagnosed ? Math.round((Math.max(0, diagnosed - failed) / diagnosed) * 100) : 0 },
      { label: `신청 폼 진입 (${applied}명)`, percent: diagnosed ? Math.round((applied / diagnosed) * 100) : 0 },
      { label: `신청 최종 완료 (${completed}명)`, percent: diagnosed ? Math.round((completed / diagnosed) * 100) : 0 },
    ],
    insights: [
      {
        title: '집중 관리 필요',
        body: lowPerformingDepartment
          ? `${lowPerformingDepartment.name}의 완료율이 ${lowPerformingDepartment.completion}%로 가장 낮습니다.`
          : '완료율 하락 부서는 아직 없습니다.',
      },
      {
        title: '참여 우수 부서',
        body: topPerformingDepartment
          ? `${topPerformingDepartment.name}의 참여율이 ${topPerformingDepartment.participation}%로 가장 높습니다.`
          : '참여 우수 부서 데이터가 아직 없습니다.',
      },
    ],
    urgentActions: [
      completed ? '완료 처리된 과정의 후기/이력 반영 상태를 점검합니다.' : '완료 처리 데이터가 없어 수강 완료 버튼 플로우를 다시 확인합니다.',
      topGap ? `${topGap} 영역 보완 과정이 충분히 추천되는지 확인합니다.` : '최신 진단이 없어 진단부터 한 번 더 진행해 주세요.',
      '현재 선택 과정과 신청/이력 반영 상태를 점검합니다.',
    ],
    departmentComparisons,
    trendComparison: trends,
    summary: {
      departmentCount: departmentComparisons.length,
      displayedDepartments: Math.min(5, departmentComparisons.length),
    },
  }
}

async function fetchAdminDepartmentsPayloadFromSupabase(requestedDivision = '') {
  const payload = await callAdminRpc<AdminDepartmentsRpcPayload>(
    'admin_departments_payload',
    { p_division: requestedDivision || null },
    '부서 분석 데이터를 불러오지 못했습니다.',
  )
  const latestDiagnoses = dedupeLatestByUser(payload.diagnoses ?? [], (row) => row.user_id, (row) => row.diagnosed_at)
  const latestEnrollments = dedupeLatestByUser(payload.enrollments ?? [], (row) => row.user_id, (row) => row.enrollment_requested_at)
  const departments = buildDepartmentDetails(payload.users ?? [], payload.courses ?? [], latestDiagnoses, latestEnrollments)
  const focusDepartment = requestedDivision ? departments.find((item) => item.name === requestedDivision) || null : null
  const focusUsers = focusDepartment ? (payload.users ?? []).filter((user) => (user.division || '미분류') === focusDepartment.name) : (payload.users ?? [])
  const diagnosisByUserId = new Map(latestDiagnoses.map((row) => [row.user_id, row]))
  const coursePayloads = (payload.courses ?? []).map((row) => parseAdminCourseDetailedRow(row))
  const recommendationCounts = new Map<string, number>()
  for (const user of focusUsers) {
    const diagnosis = diagnosisByUserId.get(user.id) || null
    const ranked = coursePayloads
      .map((course) => ({ title: course.courseTitle, fitScore: scoreCourse(course, diagnosis, user.role) }))
      .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))
      .slice(0, 5)
    for (const item of ranked) {
      recommendationCounts.set(item.title, (recommendationCounts.get(item.title) || 0) + 1)
    }
  }

  const overallAreaScores: Record<string, number[]> = Object.fromEntries(Object.keys(competencyAreaText).map((area) => [area, []]))
  const focusAreaScores: Record<string, number[]> = Object.fromEntries(Object.keys(competencyAreaText).map((area) => [area, []]))
  const divisionByUserId = new Map((payload.users ?? []).map((user) => [user.id, user.division || '미분류']))
  for (const diagnosis of latestDiagnoses) {
    for (const area of Object.keys(competencyAreaText)) {
      const raw = Number(diagnosis.category_scores_json?.[area] || 0)
      if (!raw) continue
      overallAreaScores[area].push((raw / 16) * 100)
      if (focusDepartment && divisionByUserId.get(diagnosis.user_id) === focusDepartment.name) {
        focusAreaScores[area].push((raw / 16) * 100)
      }
    }
  }

  const competencyComparison = Object.entries(competencyAreaText).map(([area, label]) => ({
    label,
    departmentScore: !focusDepartment
      ? averageRounded(overallAreaScores[area])
      : averageRounded(focusAreaScores[area]),
    overallScore: averageRounded(overallAreaScores[area]),
  }))

  const baseForCards = focusDepartment || {
    participation: averageRounded(departments.map((item) => item.participation)),
    avgScore: averageFixed(departments.map((item) => item.avgScore), 1),
    completion: averageRounded(departments.map((item) => item.completion)),
    topCourses: [] as Array<{ title: string; count: number }>,
    users: (payload.users ?? []).length,
  }

  return {
    userName: payload.userName,
    focusDivision: focusDepartment?.name || '',
    filters: departments.map((item) => item.name),
    kpis: [
      {
        label: '부서별 평균 참여율',
        value: `${baseForCards.participation}%`,
        delta: `${focusDepartment ? focusDepartment.users : (payload.users ?? []).length}명 기준`,
        tone: baseForCards.participation >= 80 ? 'positive' : 'warning',
      },
      {
        label: '평균 역량 지수 (DCI)',
        value: `${baseForCards.avgScore}`,
        delta: '/ 100',
        tone: baseForCards.avgScore >= 70 ? 'positive' : 'warning',
      },
      {
        label: '수강 완료율',
        value: `${baseForCards.completion}%`,
        delta: `${focusDepartment ? focusDepartment.topCourses.length : 0}개 과정 반영`,
        tone: baseForCards.completion >= 70 ? 'positive' : 'warning',
      },
    ],
    competencyComparison,
    topCourses: (() => {
      const entries = Array.from(recommendationCounts.entries()).sort((left, right) => right[1] - left[1])
      const totalRecommendations = entries.reduce((sum, [, count]) => sum + count, 0)
      return entries.slice(0, 5).map(([title, count], index) => ({
        rank: index + 1,
        title,
        percent: totalRecommendations ? Math.round((count / totalRecommendations) * 100) : 0,
      }))
    })(),
    departments,
    summary: {
      departmentCount: departments.length,
      displayedDepartments: Math.min(5, departments.length),
    },
  }
}

async function createAdminQuestionInSupabase(input: { title: string; category: string; options?: Array<{ label: string; value: number }> }) {
  return callAdminRpc('admin_question_create', {
    p_title: String(input.title || '').trim(),
    p_category: String(input.category || '').trim(),
    p_options: input.options || defaultChoiceOptions,
  }, '문항 추가에 실패했습니다.')
}

async function updateAdminQuestionInSupabase(id: string, input: { title: string; category: string }) {
  return callAdminRpc('admin_question_update', {
    p_id: id,
    p_title: String(input.title || '').trim(),
    p_category: String(input.category || '').trim(),
  }, '문항 수정에 실패했습니다.')
}

async function deleteAdminQuestionInSupabase(id: string) {
  return callAdminRpc('admin_question_delete', { p_id: id }, '문항 삭제에 실패했습니다.')
}

async function fetchAdminCoursesPayloadFromSupabase() {
  const supabase = await requireAdminSupabaseClient()
  const rpc = getSupabaseRpc(supabase)
  const result = (await rpc('admin_courses_payload')) as SupabaseResult<{
    userName: string
    courses: AdminCourse[]
  }>
  if (result.error) throw new Error(result.error.message || '과정 데이터를 불러오지 못했습니다.')
  return result.data
}

async function createAdminCourseInSupabase(input: Record<string, unknown>) {
  return callAdminRpc('admin_course_create', {
    p_payload: {
      courseTitle: String(input.courseTitle || '').trim(),
      competencyArea: String(input.competencyArea || '').trim(),
      level: input.level,
      durationHours: Number(input.durationHours || 0),
      summary: String(input.summary || '').trim(),
      objectives: input.objectives || ['핵심 개념 정리', '현업 적용 포인트 확보'],
      targetAudience: input.targetAudience || ['현대위아 구성원'],
      expectedOutcomes: input.expectedOutcomes || ['추천 과정 확대'],
      reasonTags: input.reasonTags || ['관리자추가'],
      recommendedBy: input.recommendedBy || 'role-fit',
    },
  }, '과정 추가에 실패했습니다.')
}

async function importAdminCoursesToSupabase(input: { rows: Record<string, unknown>[]; replace?: boolean; fileName?: string }) {
  const rawRows = Array.isArray(input.rows) ? input.rows : []
  if (!rawRows.length) {
    throw new Error('업로드할 과정 데이터가 없습니다.')
  }
  const normalizedRows = normalizeCourseImportRowsForSupabase(rawRows, {}, new Date().toISOString())
  return invokeSupabaseFunction<{ ok: boolean; importedCount: number; replace: boolean }>(
    'admin-course-import',
    {
      rows: normalizedRows,
      replace: Boolean(input.replace),
      fileName: String(input.fileName || '').trim() || 'course_list_upload.xlsx',
    },
    '과정 업로드에 실패했습니다.',
  )
}

async function fetchAdminCourseImportHistoryFromSupabase() {
  return callAdminRpc<AdminCourseImportHistoryItem[]>('admin_course_import_history_payload', undefined, '업로드 이력을 불러오지 못했습니다.')
}

async function updateAdminCourseInSupabase(id: string, input: Record<string, unknown>) {
  return callAdminRpc('admin_course_update', {
    p_id: id,
    p_payload: {
      courseTitle: String(input.courseTitle || '').trim(),
      competencyArea: String(input.competencyArea || '').trim(),
      level: input.level,
      durationHours: Number(input.durationHours || 0),
      summary: String(input.summary || '').trim(),
    },
  }, '과정 수정에 실패했습니다.')
}

async function deleteAdminCourseInSupabase(id: string) {
  return callAdminRpc('admin_course_delete', { p_id: id }, '과정 삭제에 실패했습니다.')
}

async function fetchAdminUsersPayloadFromSupabase() {
  const supabase = await requireAdminSupabaseClient()
  const rpc = getSupabaseRpc(supabase)
  const result = (await rpc('admin_users_payload')) as SupabaseResult<{
    userName: string
    users: AdminUser[]
    filters?: {
      divisions?: string[]
      statuses?: string[]
    }
  }>
  if (result.error) throw new Error(result.error.message || '회원 데이터를 불러오지 못했습니다.')
  return result.data
}

async function createAdminUserInSupabase(input: Record<string, unknown>) {
  return callAdminRpc('admin_user_create', {
    p_payload: {
      employeeId: String(input.employeeId || '').trim(),
      name: String(input.name || '').trim(),
      division: String(input.division || '').trim(),
      team: String(input.team || '').trim(),
      email: String(input.email || '').trim().toLowerCase(),
      interestCourse: String(input.interestCourse || '').trim(),
      role: normalizeRole(String(input.role || 'employee')),
    },
  }, '회원 추가에 실패했습니다.')
}

async function importAdminUsersToSupabase(input: { users: Record<string, unknown>[] }) {
  return callAdminRpc<{ ok: boolean; importedCount: number; updatedCount: number }>(
    'admin_user_import',
    { p_users: Array.isArray(input.users) ? input.users : [] },
    '회원 일괄 업로드에 실패했습니다.',
  )
}

async function updateAdminUserInSupabase(id: string, input: Record<string, unknown>) {
  return callAdminRpc('admin_user_update', {
    p_id: id,
    p_payload: {
      name: String(input.name || ''),
      division: String(input.division || ''),
      team: String(input.team || ''),
      interestCourse: String(input.interestCourse || ''),
      role: normalizeRole(String(input.role || 'employee')),
      employeeId: String(input.employeeId || ''),
      statusOverride: input.statusOverride,
    },
  }, '회원 수정에 실패했습니다.')
}

async function deleteAdminUserInSupabase(id: string, confirmationEmployeeId?: string) {
  return callAdminRpc('admin_user_delete', {
    p_id: id,
    p_confirmation_employee_id: confirmationEmployeeId || '',
  }, '회원 삭제에 실패했습니다.')
}

async function fetchAdminBoardsPayloadFromSupabase() {
  const supabase = await requireAdminSupabaseClient()
  const rpc = getSupabaseRpc(supabase)
  const result = (await rpc('admin_boards_payload')) as SupabaseResult<{
    userName: string
    notices: AdminNotice[]
    faqs: AdminFaq[]
  }>
  if (result.error) throw new Error(result.error.message || '게시판 데이터를 불러오지 못했습니다.')
  return result.data
}

async function createAdminNoticeInSupabase(input: Record<string, unknown>) {
  return callAdminRpc('admin_notice_create', {
    p_payload: {
      category: String(input.category || '').trim(),
      title: String(input.title || '').trim(),
      summary: String(input.summary || '').trim(),
    },
  }, '공지 추가에 실패했습니다.')
}

async function updateAdminNoticeInSupabase(id: string, input: Record<string, unknown>) {
  return callAdminRpc('admin_notice_update', {
    p_id: id,
    p_payload: {
      category: String(input.category || '').trim(),
      title: String(input.title || '').trim(),
      summary: String(input.summary || '').trim(),
    },
  }, '공지 수정에 실패했습니다.')
}

async function deleteAdminNoticeInSupabase(id: string) {
  return callAdminRpc('admin_notice_delete', { p_id: id }, '공지 삭제에 실패했습니다.')
}

async function createAdminFaqInSupabase(input: Record<string, unknown>) {
  return callAdminRpc('admin_faq_create', {
    p_payload: {
      question: String(input.question || '').trim(),
      answer: String(input.answer || '').trim(),
    },
  }, 'FAQ 추가에 실패했습니다.')
}

async function updateAdminFaqInSupabase(id: string, input: Record<string, unknown>) {
  return callAdminRpc('admin_faq_update', {
    p_id: id,
    p_payload: {
      question: String(input.question || '').trim(),
      answer: String(input.answer || '').trim(),
    },
  }, 'FAQ 수정에 실패했습니다.')
}

async function deleteAdminFaqInSupabase(id: string) {
  return callAdminRpc('admin_faq_delete', { p_id: id }, 'FAQ 삭제에 실패했습니다.')
}

async function requireAdminSupabaseClient() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user) {
    throw new Error(error?.message || 'Supabase 세션이 없습니다.')
  }
  return supabase
}

function getSupabaseRpc(supabase: ReturnType<typeof getSupabaseBrowserClient>) {
  return supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<SupabaseResult<unknown>>
}

async function callAdminRpc<T>(fn: string, args?: Record<string, unknown>, fallbackMessage?: string) {
  const supabase = await requireAdminSupabaseClient()
  const rpc = getSupabaseRpc(supabase)
  const result = (await rpc(fn, args)) as SupabaseResult<T>
  if (result.error) {
    throw new Error(result.error.message || fallbackMessage || '관리자 요청을 처리하지 못했습니다.')
  }
  return result.data
}

async function invokeSupabaseFunction<T>(name: string, body: Record<string, unknown>, fallbackMessage: string) {
  const supabase = await requireAdminSupabaseClient()
  const functionsClient = (supabase as unknown as {
    functions: {
      invoke: (fnName: string, options: { body: Record<string, unknown> }) => Promise<SupabaseResult<T>>
    }
  }).functions
  const result = await functionsClient.invoke(name, { body })
  if (result.error) {
    throw new Error(result.error.message || fallbackMessage)
  }
  return result.data
}

function normalizeCourseImportRowsForSupabase(rows: Record<string, unknown>[], initialRankCounts: Record<string, number>, createdAt: string) {
  const rankCounts = { ...initialRankCounts }
  return rows
    .map((raw) => normalizeCourseImportRow(raw))
    .filter((course) => course.course_title)
    .map((course, index) => {
      const competencyArea = course.competency_area
      const nextRank = Number(rankCounts[competencyArea] || 0) + 1
      rankCounts[competencyArea] = nextRank
      return {
        ...course,
        id: `XLSX-${String(index + 1).padStart(4, '0')}-${globalThis.crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        rank_in_area: nextRank,
        created_at: createdAt,
      } satisfies ImportCourseInput
    })
}

function normalizeCourseImportRow(raw: Record<string, unknown>) {
  const category1 = text(raw.category1 ?? raw['카테고리1'])
  const category2 = text(raw.category2 ?? raw['카테고리2'])
  const courseTitle = text(raw.courseTitle ?? raw['과정명'])
  const summary = text(raw.summary ?? raw['요약'])
  const objectives = splitBullets(raw.objectives ?? raw['학습목표'])
  const targetAudience = splitBullets(raw.targetAudience ?? raw['학습대상'])
  const previewUrl = text(raw.previewUrl ?? raw['프리뷰URL'])
  const previewLabel = text(raw.previewLabel ?? raw['미리보기']) || '미리보기'
  const durationText = text(raw.durationText ?? raw['학습시간'])
  const contentCount = Number(raw.contentCount ?? raw['콘텐츠수'] ?? 0)
  const instructor = text(raw.instructor ?? raw['강사'])
  const hasAssessment = normalized(raw.hasAssessment ?? raw['평가유무']) === 'y'
  const durationHours = Number(raw.durationHours) || parseDurationHours(durationText)
  const competencyArea = text(raw.competencyArea) || inferCompetencyArea({ category1, category2, courseTitle, summary, objectives, targetAudience })
  const level = normalizeCourseLevel(text(raw.level)) || inferLevel({ durationHours, contentCount, courseTitle, summary, category1, category2 })
  return {
    id: '',
    course_title: courseTitle,
    level,
    duration_hours: durationHours,
    competency_area: competencyArea,
    summary,
    objectives_json: objectives.length ? objectives : [summary || '과정 핵심 내용을 확인합니다.'],
    target_audience_json: targetAudience.length ? targetAudience : ['현대위아 구성원'],
    expected_outcomes_json: objectives.length ? objectives : ['업무 적용 포인트를 이해합니다.'],
    reason_tags_json: [category1, category2, hasAssessment ? '평가포함' : '평가없음'].filter(Boolean),
    recommended_by: 'skill-gap',
    rank_in_area: 0,
    status: '운영중',
    created_at: '',
    preview_url: previewUrl,
    preview_label: previewLabel,
    source_category_1: category1,
    source_category_2: category2,
    content_count: Number.isFinite(contentCount) ? contentCount : 0,
    instructor,
    has_assessment: hasAssessment,
    source_duration_text: durationText,
  }
}

function normalizeRole(value: string): AdminUser['role'] {
  return value === 'manager' || value === 'admin' ? value : 'employee'
}

function normalizeCourseLevel(value: string): AdminCourse['level'] | '' {
  return value === '입문' || value === '중급' || value === '심화' ? value : ''
}

function text(value: unknown) {
  return String(value ?? '').replace(/\r/g, '').replace(/\u00a0/g, ' ').trim()
}

function normalized(value: unknown) {
  return text(value).toLowerCase()
}

function splitBullets(value: unknown) {
  return text(value)
    .split('\n')
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
}

function parseDurationHours(value: unknown) {
  const raw = text(value)
  const match = raw.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/)
  if (!match) return 1
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return Math.max(1, Math.round(hours + minutes / 60 + seconds / 3600))
}

function inferLevel(input: { durationHours: number; contentCount: number; courseTitle: string; summary: string; category1: string; category2: string }) {
  const blob = normalized(`${input.category1} ${input.category2} ${input.courseTitle} ${input.summary}`)
  if (blob.includes('심화') || blob.includes('전문') || blob.includes('master') || blob.includes('고급')) return '심화'
  if (blob.includes('입문') || blob.includes('기초') || blob.includes('basic') || blob.includes('초급')) return '입문'
  if (input.durationHours >= 5 || input.contentCount >= 20) return '심화'
  if (input.durationHours >= 2 || input.contentCount >= 8) return '중급'
  return '입문'
}

function inferCompetencyArea(input: {
  category1: string
  category2: string
  courseTitle: string
  summary: string
  objectives: string[]
  targetAudience: string[]
}) {
  const content = [input.category1, input.category2, input.courseTitle, input.summary, ...input.objectives, ...input.targetAudience]
    .map(normalized)
    .join(' ')
  if (content.includes('ai') || content.includes('자동화') || content.includes('생성형')) return 'aiAutomation'
  if (content.includes('데이터') || content.includes('분석') || content.includes('엑셀') || content.includes('sql')) return 'dataDecision'
  if (content.includes('혁신') || content.includes('전략') || content.includes('dx')) return 'dxInnovation'
  if (content.includes('생산') || content.includes('품질') || content.includes('안전') || content.includes('제조')) return 'operationsQualitySafety'
  return 'problemCollaboration'
}

const defaultChoiceOptions = [
  { label: '전혀 그렇지 않다', value: 1 },
  { label: '가끔 그렇다', value: 2 },
  { label: '대체로 그렇다', value: 3 },
  { label: '항상 그렇다', value: 4 },
]

function dedupeLatestByUser<T>(rows: T[], getUserId: (row: T) => string, getAt: (row: T) => string) {
  const seen = new Set<string>()
  const ordered = [...rows].sort((left, right) => String(getAt(right)).localeCompare(String(getAt(left))))
  return ordered.filter((row) => {
    const userId = getUserId(row)
    if (seen.has(userId)) return false
    seen.add(userId)
    return true
  })
}

function buildDepartmentStatsFromRows(
  users: Array<Pick<AdminUserRow, 'id' | 'role' | 'division'>>,
  diagnoses: AdminDashboardDiagnosisRow[],
  enrollments: AdminEnrollmentSummaryRow[],
) {
  const stats = new Map<string, { users: number; diagnosis: number; completed: number; avgScore: number }>()
  for (const user of users) {
    const key = user.division || '미분류'
    if (!stats.has(key)) stats.set(key, { users: 0, diagnosis: 0, completed: 0, avgScore: 0 })
    stats.get(key)!.users += 1
  }
  const divisionByUserId = new Map(users.map((user) => [user.id, user.division || '미분류']))
  for (const item of diagnoses) {
    const key = divisionByUserId.get(item.user_id) || '미분류'
    if (!stats.has(key)) stats.set(key, { users: 0, diagnosis: 0, completed: 0, avgScore: 0 })
    stats.get(key)!.diagnosis += 1
    stats.get(key)!.avgScore += (Number(item.total_score || 0) / Math.max(1, Number(item.max_score || 1))) * 100
  }
  for (const item of enrollments) {
    const key = divisionByUserId.get(item.user_id) || '미분류'
    if (!stats.has(key)) stats.set(key, { users: 0, diagnosis: 0, completed: 0, avgScore: 0 })
    if (item.enrollment_status === 'enrolled') stats.get(key)!.completed += 1
  }
  return Array.from(stats.entries())
    .map(([name, value]) => ({
      name,
      users: value.users,
      participation: value.users ? Math.round((value.diagnosis / value.users) * 100) : 0,
      completion: value.users ? Math.round((value.completed / value.users) * 100) : 0,
      avgScore: value.diagnosis ? Math.round(value.avgScore / value.diagnosis) : 0,
    }))
    .sort((left, right) => right.users - left.users)
}

function buildDashboardTrendsFromRows(
  diagnoses: AdminDashboardDiagnosisRow[],
  enrollments: AdminEnrollmentSummaryRow[],
  users: Array<Pick<AdminUserRow, 'id' | 'role' | 'division'>>,
  courses: AdminCourseDetailedRow[],
) {
  const courseAreaById = new Map(courses.map((course) => [course.id, course.competency_area]))
  const enrolledByArea = new Map<string, number>()
  for (const enrollment of enrollments) {
    if (enrollment.enrollment_status !== 'enrolled') continue
    const area = courseAreaById.get((enrollment as unknown as { course_id?: string }).course_id || '')
    if (!area) continue
    enrolledByArea.set(area, (enrolledByArea.get(area) || 0) + 1)
  }
  return Object.entries(competencyAreaText).map(([areaKey, label]) => {
    const areaScores = diagnoses
      .map((item) => Number(item.category_scores_json?.[areaKey] || 0))
      .filter((value) => Number.isFinite(value) && value > 0)
    const competency = areaScores.length
      ? Math.round((areaScores.reduce((sum, value) => sum + value, 0) / areaScores.length / 16) * 100)
      : 0
    const completion = users.length ? Math.round(((enrolledByArea.get(areaKey) || 0) / users.length) * 100) : 0
    return {
      label,
      completion: Math.min(100, completion),
      competency: Math.min(100, competency),
    }
  })
}

function buildDepartmentDetails(
  users: Array<Pick<AdminUserRow, 'id' | 'role' | 'division'>>,
  courseRows: AdminCourseDetailedRow[],
  diagnoses: AdminDashboardDiagnosisRow[],
  enrollments: AdminEnrollmentSummaryRow[],
) {
  const departmentMap = new Map<
    string,
    {
      name: string
      users: number
      diagnosisCount: number
      completedCount: number
      avgScoreSum: number
      learningHoursSum: number
      competencySums: Record<string, number>
      competencyCounts: Record<string, number>
      courseCounts: Map<string, number>
    }
  >()
  const ensureDepartment = (name: string) => {
    const key = name || '미분류'
    if (!departmentMap.has(key)) {
      departmentMap.set(key, {
        name: key,
        users: 0,
        diagnosisCount: 0,
        completedCount: 0,
        avgScoreSum: 0,
        learningHoursSum: 0,
        competencySums: Object.fromEntries(Object.keys(competencyAreaText).map((area) => [area, 0])),
        competencyCounts: Object.fromEntries(Object.keys(competencyAreaText).map((area) => [area, 0])),
        courseCounts: new Map(),
      })
    }
    return departmentMap.get(key)!
  }

  for (const user of users) {
    ensureDepartment(user.division || '미분류').users += 1
  }

  const divisionByUserId = new Map(users.map((user) => [user.id, user.division || '미분류']))
  for (const diagnosis of diagnoses) {
    const bucket = ensureDepartment(divisionByUserId.get(diagnosis.user_id) || '미분류')
    bucket.diagnosisCount += 1
    bucket.avgScoreSum += Number(diagnosis.max_score || 0)
      ? (Number(diagnosis.total_score || 0) / Number(diagnosis.max_score || 1)) * 100
      : 0
    for (const area of Object.keys(competencyAreaText)) {
      const raw = Number(diagnosis.category_scores_json?.[area] || 0)
      if (!raw) continue
      bucket.competencySums[area] += (raw / 16) * 100
      bucket.competencyCounts[area] += 1
    }
  }

  for (const enrollment of enrollments) {
    if (enrollment.enrollment_status !== 'enrolled') continue
    ensureDepartment(divisionByUserId.get(enrollment.user_id) || '미분류').completedCount += 1
  }

  const diagnosisByUserId = new Map(diagnoses.map((row) => [row.user_id, row]))
  const coursePayloads = courseRows.map((row) => parseAdminCourseDetailedRow(row))
  for (const user of users) {
    const bucket = ensureDepartment(user.division || '미분류')
    const diagnosis = diagnosisByUserId.get(user.id) || null
    const ranked = coursePayloads
      .map((course) => ({
        courseTitle: course.courseTitle,
        durationHours: Number(course.durationHours || 0),
        fitScore: scoreCourse(course, diagnosis, user.role),
      }))
      .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))
      .slice(0, 5)
    bucket.learningHoursSum += ranked.reduce((sum, item) => sum + Math.max(0, Number(item.durationHours || 0)), 0)
    for (const item of ranked) {
      const title = item.courseTitle || '과정 미상'
      bucket.courseCounts.set(title, (bucket.courseCounts.get(title) || 0) + 1)
    }
  }

  return Array.from(departmentMap.values())
    .map((bucket) => {
      const topStrength = Object.entries(bucket.competencySums)
        .map(([area, sum]) => ({
          area,
          score: bucket.competencyCounts[area] ? sum / bucket.competencyCounts[area] : 0,
        }))
        .sort((left, right) => right.score - left.score)[0]
      return {
        name: bucket.name,
        users: bucket.users,
        participation: bucket.users ? Math.round((bucket.diagnosisCount / bucket.users) * 100) : 0,
        completion: bucket.users ? Math.round((bucket.completedCount / bucket.users) * 100) : 0,
        avgScore: bucket.diagnosisCount ? Number((bucket.avgScoreSum / bucket.diagnosisCount).toFixed(1)) : 0,
        avgLearningHours: bucket.users ? Number((bucket.learningHoursSum / bucket.users).toFixed(1)) : 0,
        topStrength: competencyAreaText[topStrength?.area] || '데이터 없음',
        statusLabel: bucket.completedCount > 0 ? '수강연계' : bucket.diagnosisCount > 0 ? '진단완료' : '미진단',
        statusTone: (bucket.completedCount > 0 ? 'emerald' : bucket.diagnosisCount > 0 ? 'blue' : 'slate') as
          | 'emerald'
          | 'blue'
          | 'slate',
        topCourses: Array.from(bucket.courseCounts.entries())
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([title, count]) => ({ title, count })),
      }
    })
    .sort((left, right) => right.users - left.users)
}

function parseAdminCourseDetailedRow(row: AdminCourseDetailedRow) {
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
    contentCount: row.content_count || 0,
    instructor: row.instructor || undefined,
    hasAssessment: Boolean(row.has_assessment),
  }
}

function scoreCourse(
  course: ReturnType<typeof parseAdminCourseDetailedRow>,
  diagnosis: AdminDashboardDiagnosisRow | null,
  role: string | undefined,
) {
  if (!diagnosis) return 50
  let score = 18
  const topGaps = diagnosis.top_gaps_json || []
  if (course.competencyArea === topGaps[0]) score += 42
  if (course.competencyArea === topGaps[1]) score += 24
  if (course.competencyArea === topGaps[2]) score += 12
  const rate = Number(diagnosis.total_score || 0) / Math.max(1, Number(diagnosis.max_score || 1))
  const preferredLevel: AdminCourse['level'] = rate >= 0.75 ? '심화' : rate >= 0.45 ? '중급' : '입문'
  const levelOrder: Record<AdminCourse['level'], number> = { 입문: 0, 중급: 1, 심화: 2 }
  const distance = Math.abs(levelOrder[course.level] - levelOrder[preferredLevel])
  score += distance === 0 ? 16 : distance === 1 ? 7 : -4
  const categoryScore = diagnosis.category_scores_json?.[course.competencyArea] ?? 10
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

function averageRounded(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0
}

function averageFixed(values: number[], digits: number) {
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(digits)) : 0
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${runtime.apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `API request failed: ${response.status}`
    try {
      const payload = (await response.json()) as { error?: { message?: string } }
      message = payload.error?.message || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
