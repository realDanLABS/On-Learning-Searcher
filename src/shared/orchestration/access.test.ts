import { describe, expect, it } from 'vitest'

import { canAccessRoute, type RouteAccessPolicy } from './access'

const basePolicy: RouteAccessPolicy = {
  minStage: 'start',
  requireAuth: true,
  requireProfile: true,
}

describe('route access policy', () => {
  it('allows when all conditions pass', () => {
    expect(
      canAccessRoute(basePolicy, {
        authenticated: true,
        hasProfile: true,
        role: 'employee',
        stage: 'start',
      }),
    ).toBe(true)
  })

  it('denies when role is not allowed', () => {
    expect(
      canAccessRoute(
        { ...basePolicy, allowedRoles: ['admin'] },
        {
          authenticated: true,
          hasProfile: true,
          role: 'employee',
          stage: 'start',
        },
      ),
    ).toBe(false)
  })

  it('denies when stage is below minimum', () => {
    expect(
      canAccessRoute(
        { ...basePolicy, minStage: 'course_selected' },
        {
          authenticated: true,
          hasProfile: true,
          role: 'admin',
          stage: 'diagnosis_done',
        },
      ),
    ).toBe(false)
  })
})

