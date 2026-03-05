export type HandoffMessage = {
  kind: 'info' | 'success'
  text: string
} | null

export function getHandoffMessage(search: string, page: 'recommendation' | 'course-linking' | 'history'): HandoffMessage {
  const from = new URLSearchParams(search).get('from')

  if (page === 'recommendation' && from === 'diagnosis') {
    return {
      kind: 'success',
      text: '진단이 완료되었습니다. 역량 갭 기반 추천 과정을 확인해 주세요.',
    }
  }

  if (page === 'course-linking' && from === 'recommendation') {
    return {
      kind: 'info',
      text: '과정 선택이 완료되었습니다. 이캠퍼스 신청 후 복귀하면 자동으로 이력에 반영됩니다.',
    }
  }

  if (page === 'history' && from === 'enrollment') {
    return {
      kind: 'success',
      text: '신청 완료가 반영되었습니다. 다음 학습 계획을 점검해 보세요.',
    }
  }

  return null
}
