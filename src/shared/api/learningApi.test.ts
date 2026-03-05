import { beforeEach, describe, expect, it } from 'vitest'

import {
  fetchDiagnosis,
  setForcedApiErrorMode,
  submitDiagnosis,
} from './learningApi'
import { clearJourneyData } from '../state/learningFlow'

describe('learningApi error mode', () => {
  beforeEach(() => {
    clearJourneyData()
    setForcedApiErrorMode(false)
  })

  it('throws when forced api error mode is enabled', async () => {
    setForcedApiErrorMode(true)
    await expect(fetchDiagnosis()).rejects.toThrow('API is temporarily unavailable')
  })

  it('works normally when error mode is disabled', async () => {
    await submitDiagnosis({
      userId: 'u1',
      diagnosedAt: '2026-03-06T00:00:00.000Z',
      totalScore: 8,
      maxScore: 10,
      categoryScores: {
        digital: 2,
        leadership: 2,
        collaboration: 2,
        problemSolving: 2,
      },
      topGaps: ['digital', 'leadership'],
    })

    const diagnosis = await fetchDiagnosis()
    expect(diagnosis?.userId).toBe('u1')
  })
})
