import { describe, expect, it } from 'vitest'

import { buildEcampusApplyUrl, parseEnrollmentCallback } from './enrollmentCallback'

describe('enrollment callback parser', () => {
  it('parses success callback', () => {
    expect(parseEnrollmentCallback('?enrollment=success&courseId=DIG-101')).toEqual({
      status: 'success',
      courseId: 'DIG-101',
    })
  })

  it('returns null for unknown status', () => {
    expect(parseEnrollmentCallback('?foo=bar')).toEqual({ status: null, courseId: null })
  })

  it('parses failed callback', () => {
    expect(parseEnrollmentCallback('?enrollment=failed&courseId=DIG-101')).toEqual({
      status: 'failed',
      courseId: 'DIG-101',
    })
  })
})

describe('ecampus apply url builder', () => {
  it('injects return url and course id', () => {
    const built = buildEcampusApplyUrl(
      'https://example.com/apply',
      'https://app.local/course-linking?source=ecampus&courseId=DIG-101',
      'DIG-101',
    )
    expect(built).toContain('return_url=')
    expect(built).toContain('courseId=DIG-101')
    expect(decodeURIComponent(built)).toContain('/course-linking?source=ecampus&courseId=DIG-101')
  })
})
