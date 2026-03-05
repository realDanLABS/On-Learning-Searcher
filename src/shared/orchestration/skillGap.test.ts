import { describe, expect, it } from 'vitest'

import { buildSkillGapItems } from './skillGap'

describe('buildSkillGapItems', () => {
  it('sorts categories by score ascending and marks critical/watch/strong bands', () => {
    const result = buildSkillGapItems({
      digital: 1,
      leadership: 3,
      collaboration: 5,
      problemSolving: 8,
    })

    expect(result.map((item) => item.key)).toEqual([
      'digital',
      'leadership',
      'collaboration',
      'problemSolving',
    ])
    expect(result[0].status).toBe('critical')
    expect(result[1].status).toBe('critical')
    expect(result[2].status).toBe('watch')
    expect(result[3].status).toBe('strong')
  })
})
