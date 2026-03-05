import { describe, expect, it } from 'vitest'

import { sanitizeInternalPath } from './safePath'

describe('sanitizeInternalPath', () => {
  it('allows internal paths', () => {
    expect(sanitizeInternalPath('/diagnosis')).toBe('/diagnosis')
    expect(sanitizeInternalPath('/history?from=enrollment')).toBe('/history?from=enrollment')
  })

  it('rejects external or invalid paths', () => {
    expect(sanitizeInternalPath('https://evil.example')).toBe(null)
    expect(sanitizeInternalPath('//evil.example/path')).toBe(null)
    expect(sanitizeInternalPath('javascript:alert(1)')).toBe(null)
  })
})
