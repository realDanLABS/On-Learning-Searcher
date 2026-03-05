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

export type HomePrimaryAction =
  | { kind: 'login'; label: string }
  | { kind: 'save-profile'; label: string }
  | { kind: 'navigate'; label: string; to: string }

export function getHomePrimaryAction(params: {
  authenticated: boolean
  hasProfile: boolean
  stage: JourneyStage
}): HomePrimaryAction {
  if (!params.authenticated) {
    return { kind: 'login', label: '1) 로그인 진행' }
  }
  if (!params.hasProfile) {
    return { kind: 'save-profile', label: '2) 프로필 저장 진행' }
  }
  if (params.stage === 'start') {
    return { kind: 'navigate', label: '3) 역량 진단 시작', to: '/diagnosis' }
  }
  if (params.stage === 'diagnosis_done') {
    return { kind: 'navigate', label: '다음: 추천 과정 확인', to: '/recommendation' }
  }
  if (params.stage === 'course_selected') {
    return { kind: 'navigate', label: '다음: 교육 신청 진행', to: '/course-linking' }
  }
  return { kind: 'navigate', label: '다음: 이력 확인', to: '/history' }
}
