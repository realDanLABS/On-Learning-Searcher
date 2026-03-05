import { featureRoutes } from '../../router/routeConfig'
import { getRouteAccessDecision, type RouteAccessContext } from './access'
import { getNextActionStatus } from './nextAction'

export type SmartPathInput = {
  preferredPath?: string | null
  gateNextPath?: string | null
  context: RouteAccessContext
  hasDiagnosisDraft?: boolean
}

function resolveCandidate(path: string | null | undefined, context: RouteAccessContext): string | null {
  if (!path) return null
  const route = featureRoutes.find((item) => item.path === path)
  if (!route) return path
  const decision = getRouteAccessDecision(route, context)
  if (decision.allowed) return path
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
