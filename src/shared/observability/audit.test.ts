import { beforeEach, describe, expect, it } from 'vitest'

import { appendAuditLog, clearAuditLogs, getAuditLogs } from './audit'

describe('audit logs', () => {
  beforeEach(() => {
    clearAuditLogs()
  })

  it('appends and reads audit logs', () => {
    appendAuditLog('login', '테스트 로그인 E100012')
    const logs = getAuditLogs()
    expect(logs.length).toBe(1)
    expect(logs[0].action).toBe('login')
    expect(logs[0].detail.includes('E****12')).toBe(true)
  })
})
