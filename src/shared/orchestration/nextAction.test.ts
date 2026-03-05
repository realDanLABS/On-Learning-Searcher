import { describe, expect, it } from 'vitest'

import { getNextActionStatus } from './nextAction'

describe('next action status', () => {
  it('returns enabled next step when prerequisites are met', () => {
    const result = getNextActionStatus({
      authenticated: true,
      hasProfile: true,
      role: 'employee',
      stage: 'diagnosis_done',
    })
    expect(result.to).toBe('/recommendation')
    expect(result.enabled).toBe(true)
  })

  it('returns disabled when prerequisites are missing', () => {
    const result = getNextActionStatus({
      authenticated: false,
      hasProfile: false,
      role: 'employee',
      stage: 'diagnosis_done',
    })
    expect(result.enabled).toBe(false)
  })
})

