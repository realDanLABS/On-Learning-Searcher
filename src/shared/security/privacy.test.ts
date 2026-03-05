import { describe, expect, it } from 'vitest'

import { maskEmployeeId, sanitizeAuditDetail } from './privacy'

describe('privacy helpers', () => {
  it('masks employee id safely', () => {
    expect(maskEmployeeId('E100012')).toBe('E****12')
  })

  it('sanitizes audit detail with possible id tokens', () => {
    const sanitized = sanitizeAuditDetail('사용자 E100012 로그인')
    expect(sanitized.includes('E****12')).toBe(true)
  })
})

