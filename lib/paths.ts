export function buildOrganizationLabel(input: {
  division?: string
  office?: string
  team?: string
  fallback?: string
}) {
  return [input.division, input.office, input.team].filter(Boolean).join(' / ') || input.fallback || '회사'
}

export function sanitizeInternalPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/')) return null
  if (path.startsWith('//')) return null
  return path
}
