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
  fitScore?: number
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
const JOURNEY_UPDATED_EVENT = 'on-learning:journey-updated'
const RETENTION_DAYS = 180

export function saveDiagnosisPayload(payload: DiagnosisPayload) {
  localStorage.setItem(KEY_DIAGNOSIS, JSON.stringify(payload))
  appendJourneyEvent({
    id: `diag-${payload.diagnosedAt}`,
    type: 'diagnosis_completed',
    at: payload.diagnosedAt,
    label: `진단 완료 (${payload.totalScore}/${payload.maxScore})`,
  })
  emitJourneyUpdated()
}

export function getDiagnosisPayload(): DiagnosisPayload | null {
  const raw = localStorage.getItem(KEY_DIAGNOSIS)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DiagnosisPayload
  } catch {
    localStorage.removeItem(KEY_DIAGNOSIS)
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
  emitJourneyUpdated()
}

export function getSelectedCourse(): RecommendedCourse | null {
  const raw = localStorage.getItem(KEY_SELECTED_COURSE)
  if (!raw) return null
  try {
    return JSON.parse(raw) as RecommendedCourse
  } catch {
    localStorage.removeItem(KEY_SELECTED_COURSE)
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
  emitJourneyUpdated()
}

export function getEnrollmentRecords(): EnrollmentRecord[] {
  const raw = localStorage.getItem(KEY_ENROLLMENT)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(KEY_ENROLLMENT)
      return []
    }
    return parsed as EnrollmentRecord[]
  } catch {
    localStorage.removeItem(KEY_ENROLLMENT)
    return []
  }
}

export function getJourneyEvents(): JourneyEvent[] {
  const raw = localStorage.getItem(KEY_JOURNEY_EVENTS)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(KEY_JOURNEY_EVENTS)
      return []
    }
    const all = parsed as JourneyEvent[]
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
    const kept = all.filter((item) => new Date(item.at) >= cutoff)
    if (kept.length !== all.length) {
      localStorage.setItem(KEY_JOURNEY_EVENTS, JSON.stringify(kept))
    }
    return kept
  } catch {
    localStorage.removeItem(KEY_JOURNEY_EVENTS)
    return []
  }
}

export function getJourneyStage(): JourneyStage {
  const hasDiagnosis = Boolean(getDiagnosisPayload())
  const hasSelectedCourse = Boolean(getSelectedCourse())
  const hasSuccessfulEnrollment = getEnrollmentRecords().some(
    (item) => item.enrollmentStatus === 'enrolled',
  )

  if (hasSuccessfulEnrollment) return 'enrollment_done'
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
  emitJourneyUpdated()
}

export function subscribeJourneyUpdates(callback: () => void): () => void {
  const handler = () => callback()
  window.addEventListener(JOURNEY_UPDATED_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(JOURNEY_UPDATED_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

function emitJourneyUpdated() {
  window.dispatchEvent(new Event(JOURNEY_UPDATED_EVENT))
}
