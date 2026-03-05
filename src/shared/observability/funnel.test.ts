import { beforeEach, describe, expect, it } from 'vitest'

import {
  appendEnrollment,
  clearJourneyData,
  saveDiagnosisPayload,
  saveSelectedCourse,
  type JourneyEvent,
} from '../state/learningFlow'
import { buildFunnelSnapshotFromEvents, buildWeeklyConversionSeriesFromEvents, getFunnelSnapshot } from './funnel'

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
    expect(snapshot.dropOffAfterDiagnosis).toBe(0)
    expect(snapshot.dropOffAfterSelection).toBe(0)
  })

  it('computes drop-off and weekly conversion from events', () => {
    const events: JourneyEvent[] = [
      { id: '1', type: 'diagnosis_completed', at: '2026-03-01T10:00:00.000Z', label: '' },
      { id: '2', type: 'diagnosis_completed', at: '2026-03-02T10:00:00.000Z', label: '' },
      { id: '3', type: 'course_selected', at: '2026-03-02T10:10:00.000Z', label: '' },
      { id: '4', type: 'enrollment_completed', at: '2026-03-03T10:20:00.000Z', label: '' },
    ]
    const snapshot = buildFunnelSnapshotFromEvents(events)
    expect(snapshot.dropOffAfterDiagnosis).toBe(1)
    expect(snapshot.dropOffAfterSelection).toBe(0)

    const weekly = buildWeeklyConversionSeriesFromEvents(events, 3, new Date('2026-03-03T12:00:00.000Z'))
    expect(weekly.length).toBe(3)
    expect(weekly[0].date).toBe('2026-03-01')
    expect(weekly[1].diagnosisCompleted).toBe(1)
    expect(weekly[2].enrollmentCompleted).toBe(1)
  })
})
