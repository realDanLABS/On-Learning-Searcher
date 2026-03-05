import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearPendingNextPath,
  consumePendingNextPath,
  getPendingNextPath,
  savePendingNextPath,
} from './intent'

describe('pending next-path intent', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
    clearPendingNextPath()
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

  it('falls back safely when sessionStorage set/get/remove throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    savePendingNextPath('/history')
    expect(getPendingNextPath()).toBe('/history')
    clearPendingNextPath()
    expect(getPendingNextPath()).toBe(null)
  })
})
