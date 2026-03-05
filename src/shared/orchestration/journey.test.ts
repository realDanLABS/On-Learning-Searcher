import { describe, expect, it } from 'vitest'

import {
  getNextJourneyAction,
  getPrevJourneyAction,
  getRedirectForStage,
  getStagePath,
  isStageAllowed,
} from './journey'

describe('journey orchestration helpers', () => {
  it('checks stage access correctly', () => {
    expect(isStageAllowed('start', 'start')).toBe(true)
    expect(isStageAllowed('start', 'diagnosis_done')).toBe(false)
    expect(isStageAllowed('course_selected', 'diagnosis_done')).toBe(true)
  })

  it('returns correct redirect by required stage', () => {
    expect(getRedirectForStage('diagnosis_done')).toBe('/diagnosis')
    expect(getRedirectForStage('course_selected')).toBe('/recommendation')
    expect(getRedirectForStage('enrollment_done')).toBe('/course-linking')
  })

  it('returns next action label and path', () => {
    expect(getNextJourneyAction('start').to).toBe('/diagnosis')
    expect(getNextJourneyAction('diagnosis_done').to).toBe('/recommendation')
    expect(getNextJourneyAction('course_selected').to).toBe('/course-linking')
    expect(getNextJourneyAction('enrollment_done').to).toBe('/history')
  })

  it('returns stage path for progress navigation', () => {
    expect(getStagePath('start')).toBe('/')
    expect(getStagePath('diagnosis_done')).toBe('/recommendation')
    expect(getStagePath('course_selected')).toBe('/course-linking')
    expect(getStagePath('enrollment_done')).toBe('/history')
  })

  it('returns previous action for stage', () => {
    expect(getPrevJourneyAction('start')).toBe(null)
    expect(getPrevJourneyAction('diagnosis_done')?.to).toBe('/diagnosis')
    expect(getPrevJourneyAction('course_selected')?.to).toBe('/recommendation')
    expect(getPrevJourneyAction('enrollment_done')?.to).toBe('/course-linking')
  })
})
