import { isStageAllowed } from './journey'
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

export function canAccessRoute(policy: RouteAccessPolicy, context: RouteAccessContext) {
  const authAllowed = policy.requireAuth === false || context.authenticated
  const profileAllowed = policy.requireProfile === false || context.hasProfile
  const roleAllowed = !policy.allowedRoles || policy.allowedRoles.includes(context.role)
  const stageAllowed = isStageAllowed(context.stage, policy.minStage)
  return authAllowed && profileAllowed && roleAllowed && stageAllowed
}

