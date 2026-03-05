import { describe, expect, it } from 'vitest'

import { getHomePrimaryAction, getJourneyChecklist, getJourneyStartBlockers } from './readiness'

describe('journey readiness', () => {
  it('returns blockers when auth/profile missing', () => {
    const blockers = getJourneyStartBlockers({ authenticated: false, hasProfile: false })
    expect(blockers.length).toBe(2)
  })

  it('returns no blocker when ready', () => {
    const blockers = getJourneyStartBlockers({ authenticated: true, hasProfile: true })
    expect(blockers.length).toBe(0)
  })

  it('builds checklist based on stage', () => {
    const items = getJourneyChecklist({
      authenticated: true,
      hasProfile: true,
      stage: 'course_selected',
    })
    expect(items.find((item) => item.label === '로그인 완료')?.done).toBe(true)
    expect(items.find((item) => item.label === '교육 신청 완료')?.done).toBe(false)
  })

  it('returns home primary action by readiness and stage', () => {
    expect(
      getHomePrimaryAction({ authenticated: false, hasProfile: false, stage: 'start' }).kind,
    ).toBe('login')
    expect(
      getHomePrimaryAction({ authenticated: true, hasProfile: false, stage: 'start' }).kind,
    ).toBe('save-profile')
    const next = getHomePrimaryAction({ authenticated: true, hasProfile: true, stage: 'course_selected' })
    expect(next.kind).toBe('navigate')
    if (next.kind === 'navigate') {
      expect(next.to).toBe('/course-linking')
    }
  })
})
