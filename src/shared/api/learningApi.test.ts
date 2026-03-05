import { beforeEach, describe, expect, it } from 'vitest'

import {
  fetchDiagnosis,
  fetchRecommendedCourses,
  setForcedApiErrorMode,
  submitEnrollment,
  submitDiagnosis,
  fetchJourneyStage,
  selectRecommendedCourse,
} from './learningApi'
import { clearJourneyData } from '../state/learningFlow'

describe('learningApi error mode', () => {
  beforeEach(() => {
    clearJourneyData()
    setForcedApiErrorMode(false)
  })

  it('throws when forced api error mode is enabled', async () => {
    setForcedApiErrorMode(true)
    await expect(fetchDiagnosis()).rejects.toThrow('API is temporarily unavailable')
  })

  it('works normally when error mode is disabled', async () => {
    await submitDiagnosis({
      userId: 'u1',
      diagnosedAt: '2026-03-06T00:00:00.000Z',
      totalScore: 8,
      maxScore: 10,
      categoryScores: {
        digital: 2,
        leadership: 2,
        collaboration: 2,
        problemSolving: 2,
      },
      topGaps: ['digital', 'leadership'],
    })

    const diagnosis = await fetchDiagnosis()
    expect(diagnosis?.userId).toBe('u1')
  })

  it('sorts recommendations by personalized fit score', async () => {
    await submitDiagnosis({
      userId: 'u2',
      diagnosedAt: '2026-03-06T00:00:00.000Z',
      totalScore: 9,
      maxScore: 20,
      categoryScores: {
        digital: 1,
        leadership: 2,
        collaboration: 2,
        problemSolving: 4,
      },
      topGaps: ['digital', 'leadership'],
    })

    const courses = await fetchRecommendedCourses('all')
    expect(courses.length).toBeGreaterThan(0)
    expect((courses[0].fitScore ?? 0) >= (courses[1].fitScore ?? 0)).toBe(true)
  })

  it('moves journey stage from selection to enrollment completion', async () => {
    await submitDiagnosis({
      userId: 'u3',
      diagnosedAt: '2026-03-06T00:00:00.000Z',
      totalScore: 12,
      maxScore: 20,
      categoryScores: {
        digital: 3,
        leadership: 3,
        collaboration: 3,
        problemSolving: 3,
      },
      topGaps: ['collaboration', 'digital'],
    })
    const course = (await fetchRecommendedCourses('all'))[0]
    await selectRecommendedCourse(course)
    expect(await fetchJourneyStage()).toBe('course_selected')

    await submitEnrollment({
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      enrollmentRequestedAt: '2026-03-06T00:10:00.000Z',
      enrollmentStatus: 'enrolled',
    })
    expect(await fetchJourneyStage()).toBe('enrollment_done')
  })
})
