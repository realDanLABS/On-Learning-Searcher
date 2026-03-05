import { describe, expect, it } from 'vitest'

import { getHandoffMessage } from './handoff'

describe('handoff message', () => {
  it('returns history to diagnosis notice', () => {
    const result = getHandoffMessage('?from=history', 'diagnosis')
    expect(result?.kind).toBe('info')
  })

  it('returns recommendation to diagnosis notice', () => {
    const result = getHandoffMessage('?from=recommendation', 'diagnosis')
    expect(result?.kind).toBe('info')
  })

  it('returns chatbot to diagnosis notice', () => {
    const result = getHandoffMessage('?from=chatbot', 'diagnosis')
    expect(result?.kind).toBe('info')
  })

  it('returns diagnosis to recommendation notice', () => {
    const result = getHandoffMessage('?from=diagnosis', 'recommendation')
    expect(result?.kind).toBe('success')
  })

  it('returns history to recommendation notice', () => {
    const result = getHandoffMessage('?from=history', 'recommendation')
    expect(result?.kind).toBe('info')
  })

  it('returns course-linking to recommendation notice', () => {
    const result = getHandoffMessage('?from=course-linking', 'recommendation')
    expect(result?.kind).toBe('info')
  })

  it('returns recommendation to course-linking notice', () => {
    const result = getHandoffMessage('?from=recommendation', 'course-linking')
    expect(result?.kind).toBe('info')
  })

  it('returns enrollment to history notice', () => {
    const result = getHandoffMessage('?from=enrollment', 'history')
    expect(result?.kind).toBe('success')
  })

  it('returns course-linking to history notice', () => {
    const result = getHandoffMessage('?from=course-linking', 'history')
    expect(result?.kind).toBe('success')
  })

  it('returns recommendation to history notice', () => {
    const result = getHandoffMessage('?from=recommendation', 'history')
    expect(result?.kind).toBe('info')
  })

  it('returns diagnosis to history notice', () => {
    const result = getHandoffMessage('?from=diagnosis', 'history')
    expect(result?.kind).toBe('info')
  })

  it('returns home to history notice', () => {
    const result = getHandoffMessage('?from=home', 'history')
    expect(result?.kind).toBe('info')
  })

  it('returns chatbot to history notice', () => {
    const result = getHandoffMessage('?from=chatbot', 'history')
    expect(result?.kind).toBe('info')
  })

  it('returns diagnosis to chatbot notice', () => {
    const result = getHandoffMessage('?from=diagnosis', 'chatbot')
    expect(result?.kind).toBe('info')
  })

  it('returns recommendation to chatbot notice', () => {
    const result = getHandoffMessage('?from=recommendation', 'chatbot')
    expect(result?.kind).toBe('info')
  })

  it('returns history to chatbot notice', () => {
    const result = getHandoffMessage('?from=history', 'chatbot')
    expect(result?.kind).toBe('info')
  })

  it('returns null when no handoff', () => {
    expect(getHandoffMessage('', 'history')).toBeNull()
  })
})
