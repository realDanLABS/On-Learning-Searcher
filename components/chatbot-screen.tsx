'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { StitchFrame } from '@/components/stitch-frame'
import { UserTopNav } from '@/components/user-top-nav'
import { syncAuthSession, type UserProfile } from '@/lib/auth-client'
import { fetchChatbotReply } from '@/lib/chatbot-client'
import {
  fetchDiagnosis,
  fetchDiagnosisHistory,
  fetchEnrollmentHistory,
  fetchRecommendedCourses,
  fetchSelectedCourse,
  type DiagnosisPayload,
  type EnrollmentRecord,
  type RecommendedCourse,
} from '@/lib/learning-client'
import {
  RECOMMENDED_COURSE_PREVIEW_COUNT,
  clearIdentity,
  formatCompetencyAreaList,
  getDiagnosisScoreRate,
  getDisplayUser,
} from '@/lib/stitch-ui'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

export function ChatbotScreen() {
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [diagnosis, setDiagnosis] = useState<DiagnosisPayload | null>(null)
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisPayload[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [courses, setCourses] = useState<RecommendedCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<RecommendedCourse | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    void syncAuthSession()
      .then((currentSession) => {
        setSession(currentSession)
        if (!currentSession.authenticated || !currentSession.profile) {
          router.replace('/login?next=%2Fchatbot')
          return
        }
        setProfile(currentSession.profile)
        return Promise.all([
          fetchDiagnosis(),
          fetchDiagnosisHistory().catch(() => []),
          fetchEnrollmentHistory().catch(() => []),
          fetchRecommendedCourses('all').catch(() => []),
          fetchSelectedCourse().catch(() => null),
        ]).then(([diagnosisPayload, diagnosisHistoryPayload, enrollmentHistory, recommended, selected]) => {
          setDiagnosis(diagnosisPayload)
          setDiagnosisHistory(diagnosisHistoryPayload)
          setEnrollments(enrollmentHistory)
          setCourses(recommended)
          setSelectedCourse(selected)
          setMessages([
            {
              id: 'assistant-initial',
              role: 'assistant',
              text: `안녕하세요, ${currentSession.profile?.name ?? '구성원'}님. 현재 학습 상태를 바탕으로 다음 행동을 안내해드릴게요. 궁금하신 점이 있으신가요?`,
            },
          ])
        })
      })
      .finally(() => setLoading(false))
  }, [router])

  const user = getDisplayUser(session?.profile)
  const score = getDiagnosisScoreRate(diagnosis) || 56
  const previousDiagnosis = diagnosisHistory.length > 1 ? diagnosisHistory[1] : null
  const previousScore = getDiagnosisScoreRate(previousDiagnosis)
  const scoreDelta = diagnosis ? score - previousScore : 0
  const latest = enrollments[0]
  const gapText = diagnosis?.topGaps?.length ? formatCompetencyAreaList(diagnosis.topGaps) : 'AI/자동화 활용'
  const topCourses = courses.slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT)
  const completedRecommendationCount = topCourses.filter((course) =>
    enrollments.some((item) => item.courseId === course.courseId && item.enrollmentStatus === 'enrolled'),
  ).length
  const completionBaseCount = topCourses.length || RECOMMENDED_COURSE_PREVIEW_COUNT
  const completionPercent = Math.round((completedRecommendationCount / completionBaseCount) * 100)
  const activeCourseId = selectedCourse?.courseId ?? latest?.courseId ?? null
  const currentCourse = activeCourseId ? topCourses.find((course) => course.courseId === activeCourseId) ?? topCourses[0] : topCourses[0]
  const latestStatus = latest
    ? latest.enrollmentStatus === 'requested'
      ? `${latest.courseTitle} 과정이 신청 요청 상태입니다.`
      : latest.enrollmentStatus === 'return-missing'
        ? `${latest.courseTitle} 과정은 복귀 확인이 필요합니다.`
        : latest.enrollmentStatus === 'failed'
          ? `${latest.courseTitle} 과정 신청이 실패로 기록되었습니다.`
          : `${latest.courseTitle} 과정은 현재 수강 중입니다.`
    : '최근 신청 이력이 없습니다. 추천 과정부터 확인해 보세요.'

  const quickReplies: Record<string, string> = {
    '내 부족 역량 알려줘': `현재 보완 우선 역량은 ${gapText} 입니다. 추천 학습 경로에서 1단계 과정을 먼저 보는 것이 가장 좋습니다.`,
    '최근 신청 상태 알려줘': latestStatus,
    '추천 이유': `추천 과정은 ${gapText}을 우선 보완하도록 정렬되어 있습니다. 상단 카드부터 순서대로 보면 됩니다.`,
    '선택 과정 코칭': currentCourse
      ? `${currentCourse.courseTitle}은(는) 지금 점수에서 가장 빠르게 체감 효과를 주는 과정입니다. 먼저 핵심 목표 1개만 잡고 수강을 시작해 보세요.`
      : '먼저 추천 과정 한 개를 선택하면 선택 과정 기준 코칭을 이어드릴 수 있습니다.',
  }

  const roadmap = topCourses.map((course, index) => {
    const matchedEnrollment = enrollments.find((item) => item.courseId === course.courseId)
    const isSelected = selectedCourse?.courseId === course.courseId || latest?.courseId === course.courseId
    if (matchedEnrollment?.enrollmentStatus === 'enrolled') return { title: course.courseTitle, statusLabel: '수강 완료', state: 'done' as const }
    if (isSelected || index === 0) return { title: course.courseTitle, statusLabel: matchedEnrollment?.enrollmentStatus === 'requested' ? '신청 완료' : '현재 단계', state: 'current' as const }
    return { title: course.courseTitle, statusLabel: index === 1 ? '다음 추천' : '확장 추천', state: 'upcoming' as const }
  })

  const payload = {
    userName: user.name,
    organization: user.organization,
    completionPercent,
    completionSummaryLabel: '현재 학습 상태 요약',
    completionSummaryText: `${completedRecommendationCount}/${completionBaseCount}개 완료`,
    roadmapPill: completedRecommendationCount > 0
      ? `${completedRecommendationCount}개 이수`
      : selectedCourse || latest
        ? '추천 완료'
        : roadmap.length
          ? '추천 준비'
          : '추천 없음',
    roadmap,
    messages,
    score,
    scoreDelta,
  }

  async function handleAction(action: string, data: unknown) {
    const payloadData = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    if (action === 'goto') {
      router.push(typeof payloadData.route === 'string' ? payloadData.route : '/history')
      return
    }
    if (action === 'notify') {
      window.alert(typeof payloadData.message === 'string' ? payloadData.message : '준비 중인 기능입니다.')
      return
    }
    if (action === 'logout') {
      await clearIdentity()
      router.push('/')
      return
    }
    if (action === 'chat-message') {
      const question = typeof payloadData.question === 'string' ? payloadData.question.trim() : ''
      if (!question) return
      setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text: question }])
      try {
        const quickReply = quickReplies[question]
        if (quickReply) {
          setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', text: quickReply }])
          return
        }
        const reply = await fetchChatbotReply({
          question,
          diagnosis,
          enrollments,
          courses,
          profile: profile ? { name: profile.name, organization: profile.organization, employeeId: profile.employeeId } : null,
        })
        setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', text: reply.answer }])
      } catch {
        setMessages((current) => [
          ...current,
          { id: `assistant-${Date.now()}`, role: 'assistant', text: '답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
        ])
      }
    }
  }

  if (loading) {
    return <div className="app-bootstrap-loading">AI 상담 화면을 준비하는 중입니다...</div>
  }

  return (
    <div className="home-react-page">
      <UserTopNav
        activeRoute="/chatbot"
        authenticated
        onLogout={async () => {
          await clearIdentity()
          router.push('/')
        }}
        organization={user.organization}
        role={session?.role}
        userName={user.name}
      />
      <StitchFrame file="09-chatbot.html" hideEmbeddedHeader onAction={handleAction} payload={payload} />
    </div>
  )
}
