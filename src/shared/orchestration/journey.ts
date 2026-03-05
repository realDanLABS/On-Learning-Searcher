import type { JourneyStage } from '../state/learningFlow'

export type NextJourneyAction = { to: string; label: string }

export const stageOrder: JourneyStage[] = ['start', 'diagnosis_done', 'course_selected', 'enrollment_done']

export function isStageAllowed(current: JourneyStage, minStage: JourneyStage) {
  return stageOrder.indexOf(current) >= stageOrder.indexOf(minStage)
}

export function getRedirectForStage(minStage: JourneyStage) {
  if (minStage === 'diagnosis_done') return '/diagnosis'
  if (minStage === 'course_selected') return '/recommendation'
  if (minStage === 'enrollment_done') return '/course-linking'
  return '/'
}

export function getNextJourneyAction(stage: JourneyStage): NextJourneyAction {
  if (stage === 'start') return { to: '/diagnosis', label: '진단 시작' }
  if (stage === 'diagnosis_done') return { to: '/recommendation', label: '추천 확인' }
  if (stage === 'course_selected') return { to: '/course-linking', label: '신청 진행' }
  return { to: '/history', label: '이력 보기' }
}

export function getStagePath(stage: JourneyStage) {
  if (stage === 'start') return '/'
  if (stage === 'diagnosis_done') return '/recommendation'
  if (stage === 'course_selected') return '/course-linking'
  return '/history'
}
