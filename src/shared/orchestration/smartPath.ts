import { featureRoutes } from '../../router/routeConfig'
import { getRouteAccessDecision, type RouteAccessContext } from './access'
import { getNextActionStatus } from './nextAction'
import { sanitizeInternalPath } from './safePath'

export type SmartPathInput = {
  preferredPath?: string | null
  gateNextPath?: string | null
  context: RouteAccessContext
  hasDiagnosisDraft?: boolean
}

function resolveCandidate(path: string | null | undefined, context: RouteAccessContext): string | null {
  const safePath = sanitizeInternalPath(path)
  if (!safePath) return null
  const routePathname = safePath.split('?')[0]?.split('#')[0] ?? safePath
  const route = featureRoutes.find((item) => item.path === routePathname)
  if (!route) return safePath
  const decision = getRouteAccessDecision(route, context)
  if (decision.allowed) return safePath
  return decision.nextPath
}

export function resolveBestReachablePath(input: SmartPathInput): string | null {
  const preferred = resolveCandidate(input.preferredPath, input.context)
  if (preferred) return preferred

  const gateNext = resolveCandidate(input.gateNextPath, input.context)
  if (gateNext) return gateNext

  const fallback = getNextActionStatus({
    ...input.context,
    hasDiagnosisDraft: input.hasDiagnosisDraft,
  })
  return fallback.enabled ? fallback.to : null
}
