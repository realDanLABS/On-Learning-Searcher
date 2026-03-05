import { describe, expect, it } from 'vitest'

import { toApiErrorFromStatus } from './apiError'

describe('apiError status mapping', () => {
  it('maps common http status to app codes', () => {
    expect(toApiErrorFromStatus(400, 'bad').code).toBe('bad_request')
    expect(toApiErrorFromStatus(401, 'unauth').code).toBe('unauthorized')
    expect(toApiErrorFromStatus(403, 'forbidden').code).toBe('forbidden')
    expect(toApiErrorFromStatus(404, 'notfound').code).toBe('not_found')
    expect(toApiErrorFromStatus(409, 'conflict').code).toBe('conflict')
    expect(toApiErrorFromStatus(500, 'server').code).toBe('server')
  })
})
