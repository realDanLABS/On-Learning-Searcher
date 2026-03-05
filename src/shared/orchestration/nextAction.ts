import { featureRoutes } from '../../router/routeConfig'
import { canAccessRoute } from './access'
import { isFeatureEnabled } from './features'
import { getNextJourneyAction } from './journey'
import type { JourneyStage } from '../state/learningFlow'
import type { UserRole } from '../state/session'

export type NextActionContext = {
  authenticated: boolean
  hasProfile: boolean
  role: UserRole
  stage: JourneyStage
}

export type NextActionStatus = {
  to: string
  label: string
  enabled: boolean
  reason?: string
}

export function getNextActionStatus(context: NextActionContext): NextActionStatus {
  const base = getNextJourneyAction(context.stage)
  const route = featureRoutes.find((item) => item.path === base.to)
  if (!route) {
    return { ...base, enabled: true }
  }

  if (!isFeatureEnabled(route.featureKey)) {
    return { ...base, enabled: false, reason: '현재 단계 기능이 비활성화되어 있습니다.' }
  }

  const allowed = canAccessRoute(route, context)
  if (!allowed) {
    return { ...base, enabled: false, reason: '현재 단계 조건을 먼저 충족해야 합니다.' }
  }

  return { ...base, enabled: true }
}

