import {
  appendEnrollment,
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

const coursePool: RecommendedCourse[] = [
  {
    courseId: 'DIG-101',
    courseTitle: '디지털 생산성 툴 실무',
    level: '입문',
    durationHours: 6,
    reasonTags: ['digital', 'skill-gap'],
    recommendedBy: 'skill-gap',
  },
  {
    courseId: 'LDR-210',
    courseTitle: '현업 리더십 커뮤니케이션',
    level: '중급',
    durationHours: 8,
    reasonTags: ['leadership', 'role-fit'],
    recommendedBy: 'role-fit',
  },
  {
    courseId: 'COL-180',
    courseTitle: '부서간 협업 문제 해결 워크숍',
    level: '중급',
    durationHours: 5,
    reasonTags: ['collaboration', 'skill-gap'],
    recommendedBy: 'skill-gap',
  },
  {
    courseId: 'PS-300',
    courseTitle: '문제해결 사고법 고급 과정',
    level: '심화',
    durationHours: 10,
    reasonTags: ['problemSolving', 'history-based'],
    recommendedBy: 'history-based',
  },
]

export async function fetchDiagnosis(): Promise<DiagnosisPayload | null> {
  return getDiagnosisPayload()
}

export async function submitDiagnosis(payload: DiagnosisPayload): Promise<void> {
  saveDiagnosisPayload(payload)
}

export async function fetchRecommendedCourses(
  levelFilter: 'all' | '입문' | '중급' | '심화',
): Promise<RecommendedCourse[]> {
  const diagnosis = getDiagnosisPayload()

  const base = coursePool.filter((course) => {
    if (!diagnosis) return true
    return diagnosis.topGaps.some((gap) => course.reasonTags.includes(gap))
  })

  if (levelFilter === 'all') return base
  return base.filter((course) => course.level === levelFilter)
}

export async function selectRecommendedCourse(course: RecommendedCourse): Promise<void> {
  saveSelectedCourse(course)
}

export async function fetchSelectedCourse(): Promise<RecommendedCourse | null> {
  return getSelectedCourse()
}

export async function submitEnrollment(record: EnrollmentRecord): Promise<void> {
  appendEnrollment(record)
}

export async function fetchEnrollmentHistory(): Promise<EnrollmentRecord[]> {
  return getEnrollmentRecords()
}

export async function fetchJourneyEvents() {
  return getJourneyEvents()
}

export async function fetchJourneyStage() {
  return getJourneyStage()
}
