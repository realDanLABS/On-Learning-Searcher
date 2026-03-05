import { describe, expect, it } from 'vitest'

import { consumeSessionExpiredNotice, emitSessionExpiredNotice } from './sessionSignals'

describe('session expiration signals', () => {
  it('stores and consumes expiration notice once', () => {
    emitSessionExpiredNotice()
    expect(consumeSessionExpiredNotice()).toBe(true)
    expect(consumeSessionExpiredNotice()).toBe(false)
  })
})

