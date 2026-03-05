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

const KEY_DIAGNOSIS = 'on_learning_diagnosis_payload_v1'
const KEY_SELECTED_COURSE = 'on_learning_selected_course_v1'
const KEY_ENROLLMENT = 'on_learning_enrollment_records_v1'

export function saveDiagnosisPayload(payload: DiagnosisPayload) {
  localStorage.setItem(KEY_DIAGNOSIS, JSON.stringify(payload))
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
  const next = [record, ...current]
  localStorage.setItem(KEY_ENROLLMENT, JSON.stringify(next))
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
