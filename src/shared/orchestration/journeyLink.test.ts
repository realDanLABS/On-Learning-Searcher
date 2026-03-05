import { describe, expect, it } from 'vitest'

import { withJourneyFrom } from './journeyLink'

describe('withJourneyFrom', () => {
  it('adds from query for internal path', () => {
    expect(withJourneyFrom('/history', '/recommendation')).toBe('/history?from=recommendation')
  })

  it('preserves existing from query', () => {
    expect(withJourneyFrom('/history?from=course-linking', '/recommendation')).toBe('/history?from=course-linking')
  })

  it('does not modify when moving within same pathname', () => {
    expect(withJourneyFrom('/recommendation', '/recommendation')).toBe('/recommendation')
  })

  it('does not modify external target path', () => {
    expect(withJourneyFrom('https://example.com', '/history')).toBe('https://example.com')
  })
})
