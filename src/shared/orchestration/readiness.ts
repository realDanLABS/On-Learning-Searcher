import type { JourneyStage } from '../state/learningFlow'

export function getJourneyStartBlockers(params: {
  authenticated: boolean
  hasProfile: boolean
}) {
  const blockers: string[] = []
  if (!params.authenticated) {
    blockers.push('로그인이 필요합니다.')
  }
  if (!params.hasProfile) {
    blockers.push('사번/이름/소속 프로필 저장이 필요합니다.')
  }
  return blockers
}

export type ChecklistItem = {
  label: string
  done: boolean
}

export function getJourneyChecklist(params: {
  authenticated: boolean
  hasProfile: boolean
  stage: JourneyStage
}): ChecklistItem[] {
  return [
    { label: '로그인 완료', done: params.authenticated },
    { label: '프로필 저장 완료', done: params.hasProfile },
    { label: '역량 진단 완료', done: params.stage !== 'start' },
    { label: '추천 과정 선택 완료', done: params.stage === 'course_selected' || params.stage === 'enrollment_done' },
    { label: '교육 신청 완료', done: params.stage === 'enrollment_done' },
  ]
}
