'use client'

import { runtime } from '@/lib/runtime'

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

export async function fetchDiagnosis(userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : ''
  const diagnosis = await requestJson<DiagnosisPayload | null>(`/diagnosis${query}`)
  if (diagnosis) {
    window.localStorage.setItem(KEY_DIAGNOSIS, JSON.stringify(diagnosis))
  } else {
    window.localStorage.removeItem(KEY_DIAGNOSIS)
  }
  return diagnosis
}

export async function fetchDiagnosisHistory(userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : ''
  const history = await requestJson<DiagnosisPayload[]>(`/diagnosis/history${query}`)
  window.localStorage.setItem(KEY_DIAGNOSIS_HISTORY, JSON.stringify(history))
  return history
}

export async function submitDiagnosis(payload: DiagnosisPayload) {
  const response = await requestJson<{ ok: boolean }>('/diagnosis', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  window.localStorage.setItem(KEY_DIAGNOSIS, JSON.stringify(payload))
  const currentHistory = readJson<DiagnosisPayload[]>(KEY_DIAGNOSIS_HISTORY) ?? []
  const nextHistory = [payload, ...currentHistory.filter((item) => item.diagnosedAt !== payload.diagnosedAt)].slice(0, 12)
  window.localStorage.setItem(KEY_DIAGNOSIS_HISTORY, JSON.stringify(nextHistory))
  window.localStorage.removeItem(KEY_SELECTED_COURSE)
  window.localStorage.setItem(KEY_REMOTE_STAGE_SNAPSHOT, 'diagnosis_done')
  return response
}

export async function fetchRecommendedCourses(level: 'all' | '입문' | '중급' | '심화' = 'all', userId?: string) {
  const query = new URLSearchParams({ level })
  if (userId) query.set('userId', userId)
  return requestJson<RecommendedCourse[]>(`/recommendations?${query}`)
}

export async function selectRecommendedCourse(course: RecommendedCourse) {
  const response = await requestJson<{ ok: boolean }>('/recommendations/select', {
    method: 'POST',
    body: JSON.stringify(course),
  })
  window.localStorage.setItem(KEY_SELECTED_COURSE, JSON.stringify(course))
  window.localStorage.setItem(KEY_REMOTE_STAGE_SNAPSHOT, 'course_selected')
  return response
}

export async function fetchSelectedCourse() {
  const selected = await requestJson<RecommendedCourse | null>('/selected-course')
  if (selected) {
    window.localStorage.setItem(KEY_SELECTED_COURSE, JSON.stringify(selected))
  } else {
    window.localStorage.removeItem(KEY_SELECTED_COURSE)
  }
  return selected
}

export async function submitEnrollment(record: EnrollmentRecord) {
  const response = await requestJson<{ ok: boolean }>('/enrollments', {
    method: 'POST',
    body: JSON.stringify(record),
  })
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
  return response
}

export async function fetchEnrollmentHistory() {
  const enrollments = await requestJson<EnrollmentRecord[]>('/enrollments')
  window.localStorage.setItem(KEY_ENROLLMENT, JSON.stringify(enrollments))
  return enrollments
}

export async function fetchJourneyStage() {
  const stage = await requestJson<JourneyStage>('/journey/stage')
  window.localStorage.setItem(KEY_REMOTE_STAGE_SNAPSHOT, stage)
  return stage
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
      message = payload?.error?.message || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}
