import { describe, expect, it } from 'vitest'

import { getJourneyChecklist, getJourneyStartBlockers } from './readiness'

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
})

