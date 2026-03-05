export type EnrollmentCallback = {
  status: 'success' | 'failed' | null
  courseId: string | null
}

export function parseEnrollmentCallback(search: string): EnrollmentCallback {
  const params = new URLSearchParams(search)
  const enrollment = params.get('enrollment')
  const courseId = params.get('courseId')

  if (enrollment !== 'success' && enrollment !== 'failed') {
    return { status: null, courseId: null }
  }

  return {
    status: enrollment,
    courseId: courseId?.trim() || null,
  }
}

export function buildEcampusApplyUrl(baseUrl: string, returnTo: string, courseId?: string) {
  try {
    const url = new URL(baseUrl)
    if (!url.searchParams.get('return_url')) {
      url.searchParams.set('return_url', returnTo)
    }
    if (courseId && !url.searchParams.get('courseId')) {
      url.searchParams.set('courseId', courseId)
    }
    return url.toString()
  } catch {
    return baseUrl
  }
}
