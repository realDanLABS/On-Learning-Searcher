'use client'

import type { DiagnosisPayload, EnrollmentRecord, RecommendedCourse } from '@/lib/learning-client'

export type ChatbotReplyContext = {
  question: string
  diagnosis: DiagnosisPayload | null
  enrollments: EnrollmentRecord[]
  courses: RecommendedCourse[]
  profile: {
    name: string
    organization: string
    employeeId?: string
  } | null
}

export async function fetchChatbotReply(context: ChatbotReplyContext) {
  return Promise.resolve({ answer: buildSupabaseChatbotReply(context) })
}

function buildSupabaseChatbotReply(context: ChatbotReplyContext) {
  const question = String(context.question || '').trim()
  const normalizedQuestion = question.toLowerCase()
  const userName = context.profile?.name || '학습자'
  const topGap = context.diagnosis?.topGaps?.[0] || 'AI/자동화 활용'
  const topGapList = Array.isArray(context.diagnosis?.topGaps) && context.diagnosis?.topGaps.length
    ? context.diagnosis.topGaps.join(', ')
    : topGap
  const diagnosisScore = Number(context.diagnosis?.totalScore || 0)
  const courses = Array.isArray(context.courses) ? context.courses : []
  const enrollments = Array.isArray(context.enrollments) ? context.enrollments : []
  const selectedCourse = courses[0] || null
  const latestEnrollment = enrollments[0] || null
  const completedCourses = enrollments.filter((item) => item?.enrollmentStatus === 'enrolled')

  if (!question) {
    return `${userName}님, 현재 기준으로는 ${topGap} 보완이 우선입니다. 추천 과정 상단부터 순서대로 확인해 보시면 가장 빠르게 다음 학습을 정할 수 있습니다.`
  }

  if (normalizedQuestion.includes('부족') || normalizedQuestion.includes('역량') || normalizedQuestion.includes('약한')) {
    return `${userName}님의 현재 보완 우선 역량은 ${topGapList}입니다. 현재 진단 점수는 ${diagnosisScore || '미확인'}점이고, 가장 먼저 추천 과정 1단계부터 시작하는 것이 좋습니다.`
  }

  if (normalizedQuestion.includes('신청') || normalizedQuestion.includes('수강') || normalizedQuestion.includes('이수') || normalizedQuestion.includes('완료')) {
    if (latestEnrollment?.enrollmentStatus === 'enrolled') {
      return `최근 완료한 추천 과정은 ${latestEnrollment.courseTitle}입니다. 현재 추천 과정 이수 현황은 ${completedCourses.length}개 완료 상태입니다.`
    }
    if (latestEnrollment?.enrollmentStatus === 'requested') {
      return `가장 최근 신청한 과정은 ${latestEnrollment.courseTitle}이고 현재 상태는 신청 완료입니다. 수강 완료 처리 후 나의 학습과 학습 경로 상태도 함께 갱신됩니다.`
    }
    if (latestEnrollment?.enrollmentStatus === 'return-missing') {
      return `최근 신청 과정인 ${latestEnrollment.courseTitle}은 복귀 확인이 필요한 상태입니다. 먼저 신청 상태를 정리한 뒤 다음 추천 과정을 이어가는 것이 좋습니다.`
    }
    if (latestEnrollment?.enrollmentStatus === 'failed') {
      return `최근 신청 과정인 ${latestEnrollment.courseTitle}은 신청 실패로 기록되어 있습니다. 다른 추천 과정을 먼저 확인하거나 다시 신청해 보세요.`
    }
    return '아직 신청하거나 수강 완료한 추천 과정이 없습니다. 추천 과정 상단의 1개 과정을 먼저 선택해 시작해 보세요.'
  }

  if (normalizedQuestion.includes('추천 이유') || normalizedQuestion.includes('왜') || normalizedQuestion.includes('추천')) {
    if (selectedCourse) {
      return `${selectedCourse.courseTitle}은(는) ${topGap} 보완 우선순위와 현재 진단 결과를 바탕으로 가장 먼저 추천된 과정입니다. 학습시간은 ${selectedCourse.durationHours}시간이며, 지금 시작하기에 가장 적합한 과정입니다.`
    }
    return `${userName}님에게는 ${topGap} 보완 우선순위를 기준으로 추천 과정이 정렬됩니다. 추천 과정 페이지에서 상단 과정부터 확인해 보세요.`
  }

  if (normalizedQuestion.includes('다음') || normalizedQuestion.includes('뭐부터') || normalizedQuestion.includes('어떻게') || normalizedQuestion.includes('학습')) {
    if (selectedCourse) {
      return `다음 학습으로는 ${selectedCourse.courseTitle}부터 시작하는 것을 권장합니다. 그다음에는 학습 경로에 보이는 다음 추천 과정을 순서대로 이어가면 됩니다.`
    }
    return `${userName}님은 먼저 진단 결과 기준 1순위 추천 과정을 선택하고, 수강 완료 후 다음 추천 과정을 이어가는 방식이 가장 좋습니다.`
  }

  return `${userName}님의 현재 상태 기준으로는 ${topGap} 보완이 가장 중요합니다. 최근 추천 과정과 학습 이력을 함께 보면 다음 행동을 더 정확하게 정할 수 있습니다.`
}
