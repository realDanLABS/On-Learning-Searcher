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

