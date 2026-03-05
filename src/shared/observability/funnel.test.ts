import { beforeEach, describe, expect, it } from 'vitest'

import {
  appendEnrollment,
  clearJourneyData,
  saveDiagnosisPayload,
  saveSelectedCourse,
} from '../state/learningFlow'
import { getFunnelSnapshot } from './funnel'

describe('funnel snapshot', () => {
  beforeEach(() => {
    clearJourneyData()
  })

  it('calculates conversions from journey events', () => {
    saveDiagnosisPayload({
      userId: 'u1',
      diagnosedAt: '2026-03-05T00:00:00.000Z',
      totalScore: 7,
      maxScore: 10,
      categoryScores: { digital: 2, leadership: 2, collaboration: 2, problemSolving: 1 },
      topGaps: ['problemSolving', 'digital'],
    })

    saveSelectedCourse({
      courseId: 'DIG-101',
      courseTitle: '디지털 생산성 툴 실무',
      level: '입문',
      durationHours: 6,
      reasonTags: ['digital', 'skill-gap'],
      recommendedBy: 'skill-gap',
    })

    appendEnrollment({
      courseId: 'DIG-101',
      courseTitle: '디지털 생산성 툴 실무',
      enrollmentRequestedAt: '2026-03-05T00:00:01.000Z',
      enrollmentStatus: 'enrolled',
    })

    const snapshot = getFunnelSnapshot()
    expect(snapshot.diagnosisCompleted).toBe(1)
    expect(snapshot.courseSelected).toBe(1)
    expect(snapshot.enrollmentCompleted).toBe(1)
    expect(snapshot.conversionToSelection).toBe(100)
    expect(snapshot.conversionToEnrollment).toBe(100)
  })
})
