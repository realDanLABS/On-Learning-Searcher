import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchDiagnosis,
  fetchRecommendedCourses,
  setForcedApiErrorMode,
  submitEnrollment,
  submitDiagnosis,
  fetchJourneyStage,
  selectRecommendedCourse,
} from './learningApi'
import { toApiError } from './apiError'
import { clearJourneyData } from '../state/learningFlow'
import { clearUserRole, setUserRole } from '../state/session'
import { runtimeConfig } from '../config/runtime'

describe('learningApi error mode', () => {
  const originalApiMode = runtimeConfig.apiMode
  const originalApiBaseUrl = runtimeConfig.apiBaseUrl

  beforeEach(() => {
    clearJourneyData()
    setForcedApiErrorMode(false)
    clearUserRole()
    runtimeConfig.apiMode = 'mock'
    runtimeConfig.apiBaseUrl = originalApiBaseUrl
  })

  afterEach(() => {
    runtimeConfig.apiMode = originalApiMode
    runtimeConfig.apiBaseUrl = originalApiBaseUrl
    vi.restoreAllMocks()
  })

  it('throws when forced api error mode is enabled', async () => {
    setForcedApiErrorMode(true)
    await expect(fetchDiagnosis()).rejects.toThrow('API is temporarily unavailable')
  })

  it('normalizes api error shape', () => {
    const error = toApiError(new Error('oops'))
    expect(error.code).toBe('unknown')
    expect(error.message).toBe('oops')
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

  it('applies role bonus for leadership when user is manager', async () => {
    setUserRole('manager')
    await submitDiagnosis({
      userId: 'u4',
      diagnosedAt: '2026-03-06T00:00:00.000Z',
      totalScore: 10,
      maxScore: 20,
      categoryScores: {
        digital: 2,
        leadership: 2,
        collaboration: 3,
        problemSolving: 3,
      },
      topGaps: ['leadership', 'digital'],
    })

    const courses = await fetchRecommendedCourses('all')
    const leadershipCourse = courses.find((course) => course.courseId === 'LDR-210')
    expect((leadershipCourse?.fitScore ?? 0) > 50).toBe(true)
  })

  it('rejects invalid remote recommendation payload', async () => {
    runtimeConfig.apiMode = 'remote'
    runtimeConfig.apiBaseUrl = 'https://api.invalid'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { invalid: true } }),
    } as Response)

    await expect(fetchRecommendedCourses('all')).rejects.toMatchObject({ code: 'server' })
  })
})
