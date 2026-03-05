const fromByPathname: Record<string, string> = {
  '/': 'home',
  '/auth/callback': 'auth-callback',
  '/diagnosis': 'diagnosis',
  '/recommendation': 'recommendation',
  '/course-linking': 'course-linking',
  '/history': 'history',
  '/chatbot': 'chatbot',
}

export function withJourneyFrom(targetPath: string, currentPathname: string): string {
  if (!targetPath.startsWith('/')) return targetPath

  const source = fromByPathname[currentPathname]
  if (!source) return targetPath

  const parsed = new URL(targetPath, 'http://local.app')
  const targetPathname = parsed.pathname
  if (targetPathname === currentPathname) return targetPath
  if (parsed.searchParams.get('from')) return targetPath

  parsed.searchParams.set('from', source)
  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}
