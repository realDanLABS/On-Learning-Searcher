import { describe, expect, it } from 'vitest'

import { getHandoffMessage } from './handoff'

describe('handoff message', () => {
  it('returns diagnosis to recommendation notice', () => {
    const result = getHandoffMessage('?from=diagnosis', 'recommendation')
    expect(result?.kind).toBe('success')
  })

  it('returns recommendation to course-linking notice', () => {
    const result = getHandoffMessage('?from=recommendation', 'course-linking')
    expect(result?.kind).toBe('info')
  })

  it('returns enrollment to history notice', () => {
    const result = getHandoffMessage('?from=enrollment', 'history')
    expect(result?.kind).toBe('success')
  })

  it('returns null when no handoff', () => {
    expect(getHandoffMessage('', 'history')).toBeNull()
  })
})
