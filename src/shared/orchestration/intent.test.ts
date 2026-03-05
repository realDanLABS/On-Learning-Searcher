import { beforeEach, describe, expect, it } from 'vitest'

import {
  consumePendingNextPath,
  getPendingNextPath,
  savePendingNextPath,
} from './intent'

describe('pending next-path intent', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('saves and reads pending path', () => {
    savePendingNextPath('/recommendation')
    expect(getPendingNextPath()).toBe('/recommendation')
  })

  it('consumes and clears pending path', () => {
    savePendingNextPath('/diagnosis')
    expect(consumePendingNextPath()).toBe('/diagnosis')
    expect(getPendingNextPath()).toBe(null)
  })

  it('ignores unsafe external path', () => {
    savePendingNextPath('https://evil.example')
    expect(getPendingNextPath()).toBe(null)
  })
})
