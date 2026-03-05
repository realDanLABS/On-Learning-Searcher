import { describe, expect, it } from 'vitest'

import { getGateNoticeFromSearch } from './gateNotice'

describe('gate notice parser', () => {
  it('parses stage-locked with next path', () => {
    const result = getGateNoticeFromSearch('?gate=stage-locked&next=%2Frecommendation')
    expect(result.message).toContain('현재 단계')
    expect(result.nextPath).toBe('/recommendation')
  })

  it('parses role-denied without next path', () => {
    const result = getGateNoticeFromSearch('?gate=role-denied')
    expect(result.message).toContain('권한')
    expect(result.nextPath).toBe(null)
  })
})

