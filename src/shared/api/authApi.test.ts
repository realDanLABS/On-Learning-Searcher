import { beforeEach, describe, expect, it } from 'vitest'

import { completeAuthCallback, syncAuthSession } from './authApi'
import { isAuthenticated, clearAuthentication } from '../state/auth'
import { clearUserProfile, getUserProfile } from '../state/profile'

describe('authApi mock mode', () => {
  beforeEach(() => {
    clearAuthentication()
    clearUserProfile()
  })

  it('completes callback and stores auth/profile', async () => {
    await completeAuthCallback('?status=success&employeeId=E001&name=Kim&organization=HR')
    expect(isAuthenticated()).toBe(true)
    expect(getUserProfile()?.employeeId).toBe('E001')
  })

  it('syncs current auth state in mock mode', async () => {
    const session = await syncAuthSession()
    expect(typeof session.authenticated).toBe('boolean')
  })
})

