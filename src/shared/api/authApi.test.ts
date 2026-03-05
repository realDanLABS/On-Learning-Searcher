import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { completeAuthCallback, syncAuthSession } from './authApi'
import { isAuthenticated, clearAuthentication } from '../state/auth'
import { clearUserProfile, getUserProfile } from '../state/profile'
import { runtimeConfig } from '../config/runtime'

describe('authApi mock mode', () => {
  const originalApiMode = runtimeConfig.apiMode
  const originalApiBaseUrl = runtimeConfig.apiBaseUrl

  beforeEach(() => {
    clearAuthentication()
    clearUserProfile()
    runtimeConfig.apiMode = 'mock'
    runtimeConfig.apiBaseUrl = originalApiBaseUrl
  })

  afterEach(() => {
    runtimeConfig.apiMode = originalApiMode
    runtimeConfig.apiBaseUrl = originalApiBaseUrl
    vi.restoreAllMocks()
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

  it('rejects invalid remote auth payload', async () => {
    runtimeConfig.apiMode = 'remote'
    runtimeConfig.apiBaseUrl = 'https://api.invalid'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ wrong: true }),
    } as Response)

    await expect(syncAuthSession()).rejects.toMatchObject({ code: 'server' })
  })
})
