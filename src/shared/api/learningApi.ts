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
  type RecommendedCourse,
} from '../state/learningFlow'

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
  return withApiGuard(() => getDiagnosisPayload())
}

export async function submitDiagnosis(payload: DiagnosisPayload): Promise<void> {
  return withApiGuard(() => {
    saveDiagnosisPayload(payload)
  })
}

export async function fetchRecommendedCourses(
  levelFilter: 'all' | '입문' | '중급' | '심화',
): Promise<RecommendedCourse[]> {
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
  return withApiGuard(() => {
    saveSelectedCourse(course)
  })
}

export async function fetchSelectedCourse(): Promise<RecommendedCourse | null> {
  return withApiGuard(() => getSelectedCourse())
}

export async function submitEnrollment(record: EnrollmentRecord): Promise<void> {
  return withApiGuard(() => {
    appendEnrollment(record)
  })
}

export async function fetchEnrollmentHistory(): Promise<EnrollmentRecord[]> {
  return withApiGuard(() => getEnrollmentRecords())
}

export async function fetchJourneyEvents() {
  return withApiGuard(() => getJourneyEvents())
}

export async function fetchJourneyStage() {
  return withApiGuard(() => getJourneyStage())
}

export function isForcedApiErrorMode() {
  return localStorage.getItem(KEY_FORCE_API_ERROR) === '1'
}

export function setForcedApiErrorMode(enabled: boolean) {
  if (enabled) localStorage.setItem(KEY_FORCE_API_ERROR, '1')
  else localStorage.removeItem(KEY_FORCE_API_ERROR)
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

  return Math.min(99, 40 + gapBonus + levelBonus + strategyBonus)
}
