import { describe, expect, it } from 'vitest'

import { resolveBestReachablePath } from './smartPath'

describe('resolveBestReachablePath', () => {
  it('uses preferred path when it is directly reachable', () => {
    const result = resolveBestReachablePath({
      preferredPath: '/history',
      context: {
        authenticated: true,
        hasProfile: true,
        role: 'employee',
        stage: 'diagnosis_done',
      },
    })
    expect(result).toBe('/history')
  })

  it('falls back to nearest required step when preferred path is locked', () => {
    const result = resolveBestReachablePath({
      preferredPath: '/recommendation',
      context: {
        authenticated: true,
        hasProfile: true,
        role: 'employee',
        stage: 'start',
      },
    })
    expect(result).toBe('/diagnosis')
  })

  it('uses gate next path when preferred path is absent', () => {
    const result = resolveBestReachablePath({
      gateNextPath: '/recommendation',
      context: {
        authenticated: true,
        hasProfile: true,
        role: 'employee',
        stage: 'start',
      },
    })
    expect(result).toBe('/diagnosis')
  })

  it('ignores unsafe preferred path and falls back to next action', () => {
    const result = resolveBestReachablePath({
      preferredPath: 'https://evil.example',
      context: {
        authenticated: true,
        hasProfile: true,
        role: 'employee',
        stage: 'start',
      },
    })
    expect(result).toBe('/diagnosis')
  })

  it('keeps query when preferred route is reachable', () => {
    const result = resolveBestReachablePath({
      preferredPath: '/course-linking?from=recommendation',
      context: {
        authenticated: true,
        hasProfile: true,
        role: 'employee',
        stage: 'course_selected',
      },
    })
    expect(result).toBe('/course-linking?from=recommendation')
  })

  it('does not bypass route lock when preferred path has query', () => {
    const result = resolveBestReachablePath({
      preferredPath: '/course-linking?from=recommendation',
      context: {
        authenticated: true,
        hasProfile: true,
        role: 'employee',
        stage: 'start',
      },
    })
    expect(result).toBe('/recommendation')
  })
})
