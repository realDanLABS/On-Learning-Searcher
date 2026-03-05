import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runtimeConfig } from '../config/runtime'
import { clearUserProfile, getUserProfile } from '../state/profile'
import { saveProfile } from './profileApi'

describe('profileApi', () => {
  const originalApiMode = runtimeConfig.apiMode
  const originalApiBaseUrl = runtimeConfig.apiBaseUrl

  beforeEach(() => {
    clearUserProfile()
    runtimeConfig.apiMode = 'mock'
    runtimeConfig.apiBaseUrl = originalApiBaseUrl
  })

  afterEach(() => {
    runtimeConfig.apiMode = originalApiMode
    runtimeConfig.apiBaseUrl = originalApiBaseUrl
    vi.restoreAllMocks()
  })

  it('stores profile in mock mode', async () => {
    const profile = await saveProfile({
      employeeId: 'E1001',
      name: 'Kim',
      organization: 'HR',
    })

    expect(profile.employeeId).toBe('E1001')
    expect(getUserProfile()?.employeeId).toBe('E1001')
  })

  it('stores validated remote profile', async () => {
    runtimeConfig.apiMode = 'remote'
    runtimeConfig.apiBaseUrl = 'https://api.invalid'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { employeeId: 'E2001', name: 'Lee', organization: 'L&D' } }),
    } as Response)

    const profile = await saveProfile({ employeeId: 'E2001', name: 'Lee', organization: 'L&D' })
    expect(profile.name).toBe('Lee')
    expect(getUserProfile()?.organization).toBe('L&D')
  })

  it('rejects invalid remote profile payload', async () => {
    runtimeConfig.apiMode = 'remote'
    runtimeConfig.apiBaseUrl = 'https://api.invalid'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ employeeId: 'E9999' }),
    } as Response)

    await expect(saveProfile({ employeeId: 'E9999', name: 'Park', organization: 'Ops' })).rejects.toMatchObject({
      code: 'server',
    })
  })
})
