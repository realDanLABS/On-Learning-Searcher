export type HandoffMessage = {
  kind: 'info' | 'success'
  text: string
} | null

export function getHandoffMessage(
  search: string,
  page: 'diagnosis' | 'recommendation' | 'course-linking' | 'history' | 'chatbot',
): HandoffMessage {
  const from = new URLSearchParams(search).get('from')

  if (page === 'diagnosis' && from === 'history') {
    return {
      kind: 'info',
      text: '이력 페이지에서 진단으로 이동했습니다. 최신 역량 상태를 다시 점검해 보세요.',
    }
  }

  if (page === 'diagnosis' && from === 'home') {
    return {
      kind: 'info',
      text: '홈에서 진단으로 이동했습니다. 현재 역량을 점검해 맞춤 추천의 정확도를 높여보세요.',
    }
  }

  if (page === 'diagnosis' && from === 'recommendation') {
    return {
      kind: 'info',
      text: '추천 단계에서 진단으로 돌아왔습니다. 진단을 갱신하면 추천 정확도가 향상됩니다.',
    }
  }

  if (page === 'diagnosis' && from === 'chatbot') {
    return {
      kind: 'info',
      text: '챗봇 상담 후 진단으로 이동했습니다. 상담 내용을 반영해 응답을 진행해 보세요.',
    }
  }

  if (page === 'recommendation' && from === 'diagnosis') {
    return {
      kind: 'success',
      text: '진단이 완료되었습니다. 역량 갭 기반 추천 과정을 확인해 주세요.',
    }
  }

  if (page === 'recommendation' && from === 'home') {
    return {
      kind: 'info',
      text: '홈에서 추천으로 이동했습니다. 최신 진단 결과 기반으로 추천 과정을 확인해 보세요.',
    }
  }

  if (page === 'recommendation' && from === 'history') {
    return {
      kind: 'info',
      text: '이력 페이지에서 추천으로 이동했습니다. 다음 성장 단계에 맞는 과정을 확인해 보세요.',
    }
  }

  if (page === 'recommendation' && from === 'course-linking') {
    return {
      kind: 'info',
      text: '신청 연동 단계에서 추천으로 돌아왔습니다. 과정을 다시 선택해 진행할 수 있습니다.',
    }
  }

  if (page === 'recommendation' && from === 'chatbot') {
    return {
      kind: 'info',
      text: '챗봇 상담에서 추천으로 이동했습니다. 상담 내용을 참고해 우선 수강 과정을 선택해 보세요.',
    }
  }

  if (page === 'course-linking' && from === 'recommendation') {
    return {
      kind: 'info',
      text: '과정 선택이 완료되었습니다. 이캠퍼스 신청 후 복귀하면 자동으로 이력에 반영됩니다.',
    }
  }

  if (page === 'course-linking' && from === 'home') {
    return {
      kind: 'info',
      text: '홈에서 신청 연동으로 이동했습니다. 추천 과정 선택 후 신청을 완료해 주세요.',
    }
  }

  if (page === 'course-linking' && from === 'history') {
    return {
      kind: 'info',
      text: '이력 페이지에서 신청 연동으로 이동했습니다. 다음 학습 과정을 이어서 신청할 수 있습니다.',
    }
  }

  if (page === 'course-linking' && from === 'chatbot') {
    return {
      kind: 'info',
      text: '챗봇 상담에서 신청 연동으로 이동했습니다. 제안된 과정을 바로 신청해 보세요.',
    }
  }

  if (page === 'history' && from === 'enrollment') {
    return {
      kind: 'success',
      text: '신청 완료가 반영되었습니다. 다음 학습 계획을 점검해 보세요.',
    }
  }

  if (page === 'history' && from === 'course-linking') {
    return {
      kind: 'success',
      text: '신청 완료 처리가 반영되었습니다. 이력에서 결과를 확인해 보세요.',
    }
  }

  if (page === 'history' && from === 'recommendation') {
    return {
      kind: 'info',
      text: '추천 확인 후 이력으로 이동했습니다. 신청 완료 전에는 이력이 비어 있을 수 있습니다.',
    }
  }

  if (page === 'history' && from === 'diagnosis') {
    return {
      kind: 'info',
      text: '진단 단계에서 이력으로 이동했습니다. 추천과 신청을 진행하면 이력이 누적됩니다.',
    }
  }

  if (page === 'history' && from === 'home') {
    return {
      kind: 'info',
      text: '홈에서 이력으로 이동했습니다. 진단/추천/신청 단계를 완료하면 이력이 상세히 표시됩니다.',
    }
  }

  if (page === 'history' && from === 'chatbot') {
    return {
      kind: 'info',
      text: '챗봇 상담에서 이력으로 이동했습니다. 상담 제안과 실제 신청 이력을 함께 점검해 보세요.',
    }
  }

  if (page === 'chatbot' && from === 'diagnosis') {
    return {
      kind: 'info',
      text: '진단 단계에서 상담으로 이동했습니다. 진단 결과를 바탕으로 학습 전략을 질문해 보세요.',
    }
  }

  if (page === 'chatbot' && from === 'home') {
    return {
      kind: 'info',
      text: '홈에서 상담으로 이동했습니다. 현재 단계에 맞는 학습 질문을 선택해 보세요.',
    }
  }

  if (page === 'chatbot' && from === 'recommendation') {
    return {
      kind: 'info',
      text: '추천 단계에서 상담으로 이동했습니다. 추천 근거와 우선순위를 함께 점검해 보세요.',
    }
  }

  if (page === 'chatbot' && from === 'history') {
    return {
      kind: 'info',
      text: '이력 페이지에서 상담으로 이동했습니다. 최근 수강 이력 기반 다음 학습 계획을 제안합니다.',
    }
  }

  return null
}
