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
  hasDiagnosisDraft?: boolean
}

export type NextActionStatus = {
  to: string
  label: string
  enabled: boolean
  reason?: string
}

export function getNextActionStatus(context: NextActionContext): NextActionStatus {
  const base = getNextJourneyAction(context.stage)
  const adjustedBase =
    context.stage === 'start' && context.hasDiagnosisDraft
      ? { to: '/diagnosis', label: '미완료 진단 이어하기' }
      : base
  const route = featureRoutes.find((item) => item.path === adjustedBase.to)
  if (!route) {
    return { ...adjustedBase, enabled: true }
  }

  if (!isFeatureEnabled(route.featureKey)) {
    return { ...adjustedBase, enabled: false, reason: '현재 단계 기능이 비활성화되어 있습니다.' }
  }

  const allowed = canAccessRoute(route, context)
  if (!allowed) {
    return { ...adjustedBase, enabled: false, reason: '현재 단계 조건을 먼저 충족해야 합니다.' }
  }

  return { ...adjustedBase, enabled: true }
}
