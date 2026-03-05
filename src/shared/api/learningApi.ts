import { runtimeConfig } from '../config/runtime'
import {
  appendEnrollment,
  type CategoryScores,
  getDiagnosisPayload,
  getEnrollmentRecords,
  getJourneyEvents,
  getJourneyStage,
  getSelectedCourse,
  saveDiagnosisPayload,
  saveSelectedCourse,
  type DiagnosisPayload,
  type EnrollmentRecord,
  type JourneyEvent,
  type JourneyStage,
  type RecommendedCourse,
} from '../state/learningFlow'
import { getUserRole } from '../state/session'

const KEY_FORCE_API_ERROR = 'on_learning_force_api_error'

type CourseCatalogItem = RecommendedCourse & {
  targetGaps: Array<keyof CategoryScores>
}

const coursePool: CourseCatalogItem[] = [
  {
    courseId: 'DIG-101',
    courseTitle: '디지털 생산성 툴 실무',
    level: '입문',
    durationHours: 6,
    reasonTags: ['digital', 'skill-gap'],
    recommendedBy: 'skill-gap',
    targetGaps: ['digital'],
  },
  {
    courseId: 'LDR-210',
    courseTitle: '현업 리더십 커뮤니케이션',
    level: '중급',
    durationHours: 8,
    reasonTags: ['leadership', 'role-fit'],
    recommendedBy: 'role-fit',
    targetGaps: ['leadership', 'collaboration'],
  },
  {
    courseId: 'COL-180',
    courseTitle: '부서간 협업 문제 해결 워크숍',
    level: '중급',
    durationHours: 5,
    reasonTags: ['collaboration', 'skill-gap'],
    recommendedBy: 'skill-gap',
    targetGaps: ['collaboration'],
  },
  {
    courseId: 'PS-300',
    courseTitle: '문제해결 사고법 고급 과정',
    level: '심화',
    durationHours: 10,
    reasonTags: ['problemSolving', 'history-based'],
    recommendedBy: 'history-based',
    targetGaps: ['problemSolving'],
  },
]

export async function fetchDiagnosis(): Promise<DiagnosisPayload | null> {
  if (isRemoteMode()) {
    return requestJson<DiagnosisPayload | null>('/diagnosis')
  }
  return withApiGuard(() => getDiagnosisPayload())
}

export async function submitDiagnosis(payload: DiagnosisPayload): Promise<void> {
  if (isRemoteMode()) {
    await requestJson('/diagnosis', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return
  }
  return withApiGuard(() => {
    saveDiagnosisPayload(payload)
  })
}

export async function fetchRecommendedCourses(
  levelFilter: 'all' | '입문' | '중급' | '심화',
): Promise<RecommendedCourse[]> {
  if (isRemoteMode()) {
    const query = new URLSearchParams({ level: levelFilter }).toString()
    return requestJson<RecommendedCourse[]>(`/recommendations?${query}`)
  }

  return withApiGuard(() => {
    const diagnosis = getDiagnosisPayload()
    const personalized = coursePool
      .map((course) => ({ course, fitScore: calculateFitScore(course, diagnosis) }))
      .sort((a, b) => b.fitScore - a.fitScore)
      .map(({ course, fitScore }) => ({
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        level: course.level,
        durationHours: course.durationHours,
        reasonTags: course.reasonTags,
        recommendedBy: course.recommendedBy,
        fitScore,
      }))

    const base = diagnosis
      ? personalized.filter((course) => diagnosis.topGaps.some((gap) => course.reasonTags.includes(gap)))
      : personalized

    if (levelFilter === 'all') return base
    return base.filter((course) => course.level === levelFilter)
  })
}

export async function selectRecommendedCourse(course: RecommendedCourse): Promise<void> {
  if (isRemoteMode()) {
    await requestJson('/recommendations/select', {
      method: 'POST',
      body: JSON.stringify(course),
    })
    return
  }
  return withApiGuard(() => {
    saveSelectedCourse(course)
  })
}

export async function fetchSelectedCourse(): Promise<RecommendedCourse | null> {
  if (isRemoteMode()) {
    return requestJson<RecommendedCourse | null>('/selected-course')
  }
  return withApiGuard(() => getSelectedCourse())
}

export async function submitEnrollment(record: EnrollmentRecord): Promise<void> {
  if (isRemoteMode()) {
    await requestJson('/enrollments', {
      method: 'POST',
      body: JSON.stringify(record),
    })
    return
  }
  return withApiGuard(() => {
    appendEnrollment(record)
  })
}

export async function fetchEnrollmentHistory(): Promise<EnrollmentRecord[]> {
  if (isRemoteMode()) {
    return requestJson<EnrollmentRecord[]>('/enrollments')
  }
  return withApiGuard(() => getEnrollmentRecords())
}

export async function fetchJourneyEvents(): Promise<JourneyEvent[]> {
  if (isRemoteMode()) {
    return requestJson<JourneyEvent[]>('/journey/events')
  }
  return withApiGuard(() => getJourneyEvents())
}

export async function fetchJourneyStage(): Promise<JourneyStage> {
  if (isRemoteMode()) {
    return requestJson<JourneyStage>('/journey/stage')
  }
  return withApiGuard(() => getJourneyStage())
}

export function isForcedApiErrorMode() {
  return localStorage.getItem(KEY_FORCE_API_ERROR) === '1'
}

export function setForcedApiErrorMode(enabled: boolean) {
  if (enabled) localStorage.setItem(KEY_FORCE_API_ERROR, '1')
  else localStorage.removeItem(KEY_FORCE_API_ERROR)
}

function isRemoteMode() {
  return runtimeConfig.apiMode === 'remote'
}

async function withApiGuard<T>(fn: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 80))
  if (isForcedApiErrorMode()) {
    throw new Error('API is temporarily unavailable')
  }
  return fn()
}

function calculateFitScore(course: CourseCatalogItem, diagnosis: DiagnosisPayload | null) {
  if (!diagnosis) return 50
  const gapBonus = diagnosis.topGaps.reduce((score, gap, index) => {
    const weight = index === 0 ? 30 : 20
    return course.reasonTags.includes(gap) ? score + weight : score
  }, 0)

  const totalRate = diagnosis.totalScore / Math.max(1, diagnosis.maxScore)
  const preferredLevel = totalRate >= 0.75 ? '심화' : totalRate >= 0.45 ? '중급' : '입문'
  const levelBonus = course.level === preferredLevel ? 15 : 0
  const strategyBonus =
    course.recommendedBy === 'skill-gap' && gapBonus > 0
      ? 10
      : course.recommendedBy === 'role-fit'
        ? 6
        : 3
  const role = getUserRole()
  const roleBonus =
    role === 'manager' && course.reasonTags.includes('leadership')
      ? 8
      : role === 'admin' && course.reasonTags.includes('problemSolving')
        ? 8
        : 0

  return Math.min(99, 40 + gapBonus + levelBonus + strategyBonus + roleBonus)
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (isForcedApiErrorMode()) {
    throw new Error('API is temporarily unavailable')
  }
  if (!runtimeConfig.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required when VITE_API_MODE=remote')
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      credentials: 'include',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    const payload = (await response.json()) as T | { data: T }
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data
    }
    return payload as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API request timeout')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
