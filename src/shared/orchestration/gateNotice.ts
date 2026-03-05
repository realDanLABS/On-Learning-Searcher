import { sanitizeInternalPath } from './safePath'

export type GateNotice = {
  message: string | null
  nextPath: string | null
}

export function getGateNoticeFromSearch(search: string): GateNotice {
  const params = new URLSearchParams(search)
  const gate = params.get('gate')
  const nextPath = sanitizeInternalPath(params.get('next'))

  if (!gate) {
    return { message: null, nextPath: null }
  }

  if (gate === 'auth-required') {
    return { message: '로그인이 필요한 단계입니다. 로그인 후 다시 진행해 주세요.', nextPath }
  }
  if (gate === 'profile-required') {
    return { message: '프로필 저장이 필요한 단계입니다. 사번/이름/소속을 먼저 저장해 주세요.', nextPath }
  }
  if (gate === 'role-denied') {
    return { message: '현재 권한으로 접근할 수 없는 페이지입니다.', nextPath: null }
  }
  if (gate === 'feature-disabled') {
    return { message: '운영 정책에 의해 현재 기능이 비활성화되어 있습니다.', nextPath: null }
  }
  if (gate === 'stage-locked') {
    return { message: '현재 단계에서는 접근할 수 없습니다. 안내된 순서대로 진행해 주세요.', nextPath }
  }
  return { message: null, nextPath: null }
}
