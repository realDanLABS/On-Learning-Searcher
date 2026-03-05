import { beforeEach, describe, expect, it } from 'vitest'

import {
  appendEnrollment,
  clearJourneyData,
  getDiagnosisPayload,
  getEnrollmentRecords,
  getJourneyEvents,
  getJourneyStage,
  getSelectedCourse,
  saveDiagnosisPayload,
  saveSelectedCourse,
  type DiagnosisPayload,
} from './learningFlow'

describe('learningFlow journey lifecycle', () => {
  beforeEach(() => {
    clearJourneyData()
  })

  it('moves stages in correct order', () => {
    expect(getJourneyStage()).toBe('start')

    const diagnosis: DiagnosisPayload = {
      userId: 'u1',
      diagnosedAt: '2026-03-05T00:00:00.000Z',
      totalScore: 8,
      maxScore: 10,
      categoryScores: {
        digital: 2,
        leadership: 2,
        collaboration: 2,
        problemSolving: 2,
      },
      topGaps: ['digital', 'leadership'],
    }

    saveDiagnosisPayload(diagnosis)
    expect(getJourneyStage()).toBe('diagnosis_done')

    saveSelectedCourse({
      courseId: 'DIG-101',
      courseTitle: '디지털 생산성 툴 실무',
      level: '입문',
      durationHours: 6,
      reasonTags: ['digital', 'skill-gap'],
      recommendedBy: 'skill-gap',
    })
    expect(getJourneyStage()).toBe('course_selected')

    appendEnrollment({
      courseId: 'DIG-101',
      courseTitle: '디지털 생산성 툴 실무',
      enrollmentRequestedAt: '2026-03-05T00:00:01.000Z',
      enrollmentStatus: 'enrolled',
    })
    expect(getJourneyStage()).toBe('enrollment_done')
  })

  it('prevents duplicate enrolled record for same course', () => {
    appendEnrollment({
      courseId: 'COL-180',
      courseTitle: '부서간 협업 문제 해결 워크숍',
      enrollmentRequestedAt: '2026-03-05T00:00:01.000Z',
      enrollmentStatus: 'enrolled',
    })

    appendEnrollment({
      courseId: 'COL-180',
      courseTitle: '부서간 협업 문제 해결 워크숍',
      enrollmentRequestedAt: '2026-03-05T00:00:02.000Z',
      enrollmentStatus: 'enrolled',
    })

    expect(getEnrollmentRecords()).toHaveLength(1)
  })

  it('writes journey events as user advances', () => {
    saveDiagnosisPayload({
      userId: 'u2',
      diagnosedAt: '2026-03-05T01:00:00.000Z',
      totalScore: 6,
      maxScore: 10,
      categoryScores: {
        digital: 1,
        leadership: 2,
        collaboration: 2,
        problemSolving: 1,
      },
      topGaps: ['digital', 'problemSolving'],
    })

    saveSelectedCourse({
      courseId: 'PS-300',
      courseTitle: '문제해결 사고법 고급 과정',
      level: '심화',
      durationHours: 10,
      reasonTags: ['problemSolving', 'history-based'],
      recommendedBy: 'history-based',
    })

    const events = getJourneyEvents()
    expect(events.length).toBeGreaterThanOrEqual(2)
    expect(events[0]).toHaveProperty('type')
    expect(events[0]).toHaveProperty('label')
  })

  it('keeps stage at course_selected when only failed enrollment exists', () => {
    saveDiagnosisPayload({
      userId: 'u3',
      diagnosedAt: '2026-03-05T02:00:00.000Z',
      totalScore: 7,
      maxScore: 10,
      categoryScores: {
        digital: 2,
        leadership: 2,
        collaboration: 1,
        problemSolving: 2,
      },
      topGaps: ['collaboration', 'digital'],
    })

    saveSelectedCourse({
      courseId: 'COL-180',
      courseTitle: '부서간 협업 문제 해결 워크숍',
      level: '중급',
      durationHours: 5,
      reasonTags: ['collaboration', 'skill-gap'],
      recommendedBy: 'skill-gap',
    })

    appendEnrollment({
      courseId: 'COL-180',
      courseTitle: '부서간 협업 문제 해결 워크숍',
      enrollmentRequestedAt: '2026-03-05T02:10:00.000Z',
      enrollmentStatus: 'failed',
    })

    expect(getJourneyStage()).toBe('course_selected')
  })

  it('resets active selection when a new diagnosis is submitted', () => {
    saveDiagnosisPayload({
      userId: 'u4',
      diagnosedAt: '2026-03-05T03:00:00.000Z',
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
      enrollmentRequestedAt: '2026-03-05T03:10:00.000Z',
      enrollmentStatus: 'enrolled',
    })
    expect(getJourneyStage()).toBe('enrollment_done')

    saveDiagnosisPayload({
      userId: 'u4',
      diagnosedAt: '2026-03-06T03:00:00.000Z',
      totalScore: 7,
      maxScore: 10,
      categoryScores: {
        digital: 2,
        leadership: 2,
        collaboration: 1,
        problemSolving: 2,
      },
      topGaps: ['collaboration', 'digital'],
    })

    expect(getJourneyStage()).toBe('diagnosis_done')
  })

  it('removes corrupted diagnosis/selected-course payloads', () => {
    localStorage.setItem('on_learning_diagnosis_payload_v1', '{broken')
    localStorage.setItem('on_learning_selected_course_v1', '{broken')

    expect(getDiagnosisPayload()).toBeNull()
    expect(getSelectedCourse()).toBeNull()
    expect(localStorage.getItem('on_learning_diagnosis_payload_v1')).toBeNull()
    expect(localStorage.getItem('on_learning_selected_course_v1')).toBeNull()
  })

  it('removes corrupted list payloads for enrollments/events', () => {
    localStorage.setItem('on_learning_enrollment_records_v1', '{"invalid":true}')
    localStorage.setItem('on_learning_journey_events_v1', '{"invalid":true}')

    expect(getEnrollmentRecords()).toEqual([])
    expect(getJourneyEvents()).toEqual([])
    expect(localStorage.getItem('on_learning_enrollment_records_v1')).toBeNull()
    expect(localStorage.getItem('on_learning_journey_events_v1')).toBeNull()
  })

  it('auto-recovers selected course when diagnosis is missing', () => {
    localStorage.setItem(
      'on_learning_selected_course_v1',
      JSON.stringify({
        courseId: 'DIG-101',
        courseTitle: '디지털 생산성 툴 실무',
        level: '입문',
        durationHours: 6,
        reasonTags: ['digital', 'skill-gap'],
        recommendedBy: 'skill-gap',
      }),
    )
    localStorage.removeItem('on_learning_diagnosis_payload_v1')

    expect(getJourneyStage()).toBe('start')
    expect(localStorage.getItem('on_learning_selected_course_v1')).toBeNull()
  })
})
