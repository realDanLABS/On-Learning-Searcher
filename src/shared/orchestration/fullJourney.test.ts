import { beforeEach, describe, expect, it } from 'vitest'

import {
  fetchJourneyEvents,
  fetchJourneyStage,
  fetchRecommendedCourses,
  selectRecommendedCourse,
  submitDiagnosis,
  submitEnrollment,
} from '../api/learningApi'
import { clearAuthentication, setAuthenticated } from '../state/auth'
import { clearJourneyData } from '../state/learningFlow'
import { clearAuditLogs, getAuditLogs } from '../observability/audit'
import { clearUserProfile, saveUserProfile } from '../state/profile'
import { clearUserRole, setUserRole } from '../state/session'

describe('full journey orchestration', () => {
  beforeEach(() => {
    clearAuthentication()
    clearJourneyData()
    clearUserProfile()
    clearUserRole()
    clearAuditLogs()
  })

  it('completes end-to-end flow from diagnosis to enrollment', async () => {
    setAuthenticated(true)
    setUserRole('employee')
    saveUserProfile({
      employeeId: 'E1001',
      name: 'Tester',
      organization: 'Education',
    })

    await submitDiagnosis({
      userId: 'E1001',
      diagnosedAt: '2026-03-06T00:00:00.000Z',
      totalScore: 12,
      maxScore: 20,
      categoryScores: {
        digital: 2,
        leadership: 2,
        collaboration: 4,
        problemSolving: 4,
      },
      topGaps: ['digital', 'leadership'],
    })
    expect(await fetchJourneyStage()).toBe('diagnosis_done')

    const firstCourse = (await fetchRecommendedCourses('all'))[0]
    await selectRecommendedCourse(firstCourse)
    expect(await fetchJourneyStage()).toBe('course_selected')

    await submitEnrollment({
      courseId: firstCourse.courseId,
      courseTitle: firstCourse.courseTitle,
      enrollmentRequestedAt: '2026-03-06T00:10:00.000Z',
      enrollmentStatus: 'enrolled',
    })
    expect(await fetchJourneyStage()).toBe('enrollment_done')

    const events = await fetchJourneyEvents()
    expect(events.length).toBeGreaterThanOrEqual(3)

    const auditActions = getAuditLogs().map((item) => item.action)
    expect(auditActions).toContain('diagnosis_submitted')
    expect(auditActions).toContain('course_selected')
    expect(auditActions).toContain('enrollment_submitted')
  })
})

