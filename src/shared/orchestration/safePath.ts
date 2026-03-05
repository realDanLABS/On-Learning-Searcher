export function sanitizeInternalPath(path: string | null | undefined): string | null {
  if (!path) return null
  const trimmed = path.trim()
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//')) return null

  try {
    const url = new URL(trimmed, 'http://local.internal')
    if (url.origin !== 'http://local.internal') return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
