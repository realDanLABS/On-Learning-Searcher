import { describe, expect, it } from 'vitest'

import { reportError } from './errorTracking'

describe('error tracking', () => {
  it('does not throw when report url is empty', async () => {
    await expect(
      reportError({
        at: new Date().toISOString(),
        message: 'test',
        source: 'unit',
      }),
    ).resolves.toBeUndefined()
  })
})

