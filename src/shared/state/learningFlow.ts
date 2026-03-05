export type CategoryScores = {
  digital: number
  leadership: number
  collaboration: number
  problemSolving: number
}

export type DiagnosisPayload = {
  userId: string
  diagnosedAt: string
  totalScore: number
  maxScore: number
  categoryScores: CategoryScores
  topGaps: string[]
}

export type RecommendedCourse = {
  courseId: string
  courseTitle: string
  level: '입문' | '중급' | '심화'
  durationHours: number
  reasonTags: string[]
  recommendedBy: 'skill-gap' | 'role-fit' | 'history-based'
}

export type EnrollmentRecord = {
  courseId: string
  courseTitle: string
  enrollmentRequestedAt: string
  enrollmentStatus: 'requested' | 'enrolled' | 'failed'
}

export type JourneyEventType =
  | 'diagnosis_completed'
  | 'course_selected'
  | 'enrollment_completed'

export type JourneyEvent = {
  id: string
  type: JourneyEventType
  at: string
  label: string
}

export type JourneyStage =
  | 'start'
  | 'diagnosis_done'
  | 'course_selected'
  | 'enrollment_done'

const KEY_DIAGNOSIS = 'on_learning_diagnosis_payload_v1'
const KEY_SELECTED_COURSE = 'on_learning_selected_course_v1'
const KEY_ENROLLMENT = 'on_learning_enrollment_records_v1'
const KEY_JOURNEY_EVENTS = 'on_learning_journey_events_v1'

export function saveDiagnosisPayload(payload: DiagnosisPayload) {
  localStorage.setItem(KEY_DIAGNOSIS, JSON.stringify(payload))
  appendJourneyEvent({
    id: `diag-${payload.diagnosedAt}`,
    type: 'diagnosis_completed',
    at: payload.diagnosedAt,
    label: `진단 완료 (${payload.totalScore}/${payload.maxScore})`,
  })
}

export function getDiagnosisPayload(): DiagnosisPayload | null {
  const raw = localStorage.getItem(KEY_DIAGNOSIS)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DiagnosisPayload
  } catch {
    return null
  }
}

export function saveSelectedCourse(course: RecommendedCourse) {
  localStorage.setItem(KEY_SELECTED_COURSE, JSON.stringify(course))
  appendJourneyEvent({
    id: `course-${course.courseId}-${new Date().toISOString()}`,
    type: 'course_selected',
    at: new Date().toISOString(),
    label: `추천 과정 선택: ${course.courseTitle}`,
  })
}

export function getSelectedCourse(): RecommendedCourse | null {
  const raw = localStorage.getItem(KEY_SELECTED_COURSE)
  if (!raw) return null
  try {
    return JSON.parse(raw) as RecommendedCourse
  } catch {
    return null
  }
}

export function appendEnrollment(record: EnrollmentRecord) {
  const current = getEnrollmentRecords()
  const duplicate = current.some(
    (item) => item.courseId === record.courseId && item.enrollmentStatus === 'enrolled',
  )
  if (duplicate) {
    return
  }
  const next = [record, ...current]
  localStorage.setItem(KEY_ENROLLMENT, JSON.stringify(next))
  appendJourneyEvent({
    id: `enroll-${record.courseId}-${record.enrollmentRequestedAt}`,
    type: 'enrollment_completed',
    at: record.enrollmentRequestedAt,
    label: `신청 처리: ${record.courseTitle} (${record.enrollmentStatus})`,
  })
}

export function getEnrollmentRecords(): EnrollmentRecord[] {
  const raw = localStorage.getItem(KEY_ENROLLMENT)
  if (!raw) return []
  try {
    return JSON.parse(raw) as EnrollmentRecord[]
  } catch {
    return []
  }
}

export function getJourneyEvents(): JourneyEvent[] {
  const raw = localStorage.getItem(KEY_JOURNEY_EVENTS)
  if (!raw) return []
  try {
    return JSON.parse(raw) as JourneyEvent[]
  } catch {
    return []
  }
}

export function getJourneyStage(): JourneyStage {
  const hasDiagnosis = Boolean(getDiagnosisPayload())
  const hasSelectedCourse = Boolean(getSelectedCourse())
  const hasEnrollment = getEnrollmentRecords().length > 0

  if (hasEnrollment) return 'enrollment_done'
  if (hasSelectedCourse) return 'course_selected'
  if (hasDiagnosis) return 'diagnosis_done'
  return 'start'
}

function appendJourneyEvent(event: JourneyEvent) {
  const current = getJourneyEvents()
  const duplicate = current.some((item) => item.id === event.id)
  if (duplicate) return
  const next = [event, ...current]
  localStorage.setItem(KEY_JOURNEY_EVENTS, JSON.stringify(next))
}

export function clearJourneyData() {
  localStorage.removeItem(KEY_DIAGNOSIS)
  localStorage.removeItem(KEY_SELECTED_COURSE)
  localStorage.removeItem(KEY_ENROLLMENT)
  localStorage.removeItem(KEY_JOURNEY_EVENTS)
}
