import { isStageAllowed } from './journey'
import { getRedirectForStage } from './journey'
import type { JourneyStage } from '../state/learningFlow'
import type { UserRole } from '../state/session'

export type RouteAccessPolicy = {
  minStage: JourneyStage
  requireProfile?: boolean
  requireAuth?: boolean
  allowedRoles?: UserRole[]
}

export type RouteAccessContext = {
  authenticated: boolean
  hasProfile: boolean
  role: UserRole
  stage: JourneyStage
}

export type RouteGate = 'auth-required' | 'profile-required' | 'role-denied' | 'stage-locked'

export type RouteAccessDecision = {
  allowed: boolean
  gate: RouteGate | null
  nextPath: string | null
}

export function canAccessRoute(policy: RouteAccessPolicy, context: RouteAccessContext) {
  return getRouteAccessDecision(policy, context).allowed
}

export function getRouteAccessDecision(
  policy: RouteAccessPolicy,
  context: RouteAccessContext,
): RouteAccessDecision {
  const authAllowed = policy.requireAuth === false || context.authenticated
  if (!authAllowed) {
    return { allowed: false, gate: 'auth-required', nextPath: null }
  }

  const profileAllowed = policy.requireProfile === false || context.hasProfile
  if (!profileAllowed) {
    return { allowed: false, gate: 'profile-required', nextPath: null }
  }

  const roleAllowed = !policy.allowedRoles || policy.allowedRoles.includes(context.role)
  if (!roleAllowed) {
    return { allowed: false, gate: 'role-denied', nextPath: null }
  }

  const stageAllowed = isStageAllowed(context.stage, policy.minStage)
  if (!stageAllowed) {
    return {
      allowed: false,
      gate: 'stage-locked',
      nextPath: getRedirectForStage(policy.minStage),
    }
  }

  return { allowed: true, gate: null, nextPath: null }
}
