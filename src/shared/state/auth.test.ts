import { describe, expect, it } from 'vitest'

import { clearAuthentication, isAuthenticated, setAuthenticated } from './auth'

describe('auth state', () => {
  it('sets and clears authentication state', () => {
    clearAuthentication()
    expect(isAuthenticated()).toBe(false)
    setAuthenticated(true)
    expect(isAuthenticated()).toBe(true)
    setAuthenticated(false)
    expect(isAuthenticated()).toBe(false)
  })
})

