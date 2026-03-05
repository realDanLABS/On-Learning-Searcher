import { describe, expect, it } from 'vitest'

import { buildApiErrorFromHttp, toApiErrorFromResponse, toApiErrorFromStatus } from './apiError'

describe('apiError status mapping', () => {
  it('maps common http status to app codes', () => {
    expect(toApiErrorFromStatus(400, 'bad').code).toBe('bad_request')
    expect(toApiErrorFromStatus(401, 'unauth').code).toBe('unauthorized')
    expect(toApiErrorFromStatus(403, 'forbidden').code).toBe('forbidden')
    expect(toApiErrorFromStatus(404, 'notfound').code).toBe('not_found')
    expect(toApiErrorFromStatus(409, 'conflict').code).toBe('conflict')
    expect(toApiErrorFromStatus(500, 'server').code).toBe('server')
  })

  it('maps backend error payload and keeps trace id', () => {
    const error = buildApiErrorFromHttp(
      400,
      'fallback',
      { code: 'CONFLICT', message: 'already processed', traceId: 'trace-100' },
      'trace-header',
    )
    expect(error.code).toBe('conflict')
    expect(error.message).toBe('already processed')
    expect(error.traceId).toBe('trace-100')
    expect(error.backendCode).toBe('CONFLICT')
  })

  it('extracts normalized error from fetch response body', async () => {
    const response = new Response(
      JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'bad input', traceId: 'trace-200' } }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'x-trace-id': 'trace-header' },
      },
    )

    const error = await toApiErrorFromResponse(response, 'fallback')
    expect(error.code).toBe('bad_request')
    expect(error.message).toBe('bad input')
    expect(error.traceId).toBe('trace-200')
  })
})
