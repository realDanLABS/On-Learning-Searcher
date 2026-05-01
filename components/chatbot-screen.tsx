'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

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
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void syncAuthSession()
      .then((session) => {
        setSession(session)
        if (!session.authenticated || !session.profile) {
          router.replace('/login?next=%2Fchatbot')
          return
        }
        setProfile(session.profile)
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
              text: `안녕하세요, ${session.profile?.name ?? '구성원'}님. 현재 학습 상태와 진단 결과를 바탕으로 다음 행동을 함께 정리해드릴게요.`,
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
  const topCourses = useMemo(() => courses.slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT), [courses])
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
  const roadmap = topCourses.map((course, index) => {
    const matchedEnrollment = enrollments.find((item) => item.courseId === course.courseId)
    const isSelected = selectedCourse?.courseId === course.courseId || latest?.courseId === course.courseId
    if (matchedEnrollment?.enrollmentStatus === 'enrolled') return { title: course.courseTitle, statusLabel: '수강 완료', state: 'done' as const }
    if (isSelected || index === 0) return { title: course.courseTitle, statusLabel: matchedEnrollment?.enrollmentStatus === 'requested' ? '신청 완료' : '현재 단계', state: 'current' as const }
    return { title: course.courseTitle, statusLabel: index === 1 ? '다음 추천' : '확장 추천', state: 'upcoming' as const }
  })

  const quickReplies = useMemo<Record<string, string>>(() => ({
    '내 부족 역량 알려줘': `현재 보완 우선 역량은 ${gapText} 입니다. 추천 학습 경로에서 1단계 과정을 먼저 보는 것이 가장 좋습니다.`,
    '최근 신청 상태 알려줘': latestStatus,
    '추천 이유': `추천 과정은 ${gapText}을 우선 보완하도록 정렬되어 있습니다. 상단 카드부터 순서대로 보면 됩니다.`,
    '선택 과정 코칭': currentCourse
      ? `${currentCourse.courseTitle}은(는) 지금 점수에서 가장 빠르게 체감 효과를 주는 과정입니다. 먼저 핵심 목표 1개만 잡고 수강을 시작해 보세요.`
      : '먼저 추천 과정 한 개를 선택하면 선택 과정 기준 코칭을 이어드릴 수 있습니다.',
  }), [currentCourse, gapText, latestStatus])

  if (loading) {
    return <div className="app-bootstrap-loading">AI 상담 화면을 준비하는 중입니다...</div>
  }

  async function sendQuestion(question: string) {
    const normalized = question.trim()
    if (!normalized || submitting) return

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: normalized }
    setMessages((current) => [...current, userMessage])
    setDraft('')
    setSubmitting(true)

    try {
      const quickReply = quickReplies[normalized as keyof typeof quickReplies]
      if (quickReply) {
        setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', text: quickReply }])
        return
      }

      const reply = await fetchChatbotReply({
        question: normalized,
        diagnosis,
        enrollments,
        courses,
        profile: profile ? { name: profile.name, organization: profile.organization, employeeId: profile.employeeId } : null,
      })
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', text: reply.answer }])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: '답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        },
      ])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="home-react-page chatbot-react-page">
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

      <main className="chatbot-react-shell">
        <aside className="chatbot-react-sidebar">
          <div className="chatbot-react-sidebar-nav">
            <button className="active" onClick={() => router.push('/chatbot')} type="button">
              <span className="material-symbols-outlined">forum</span>
              <span>AI 챗봇 상담</span>
            </button>
            <button onClick={() => router.push('/history')} type="button">
              <span className="material-symbols-outlined">leaderboard</span>
              <span>내 학습 현황</span>
            </button>
            <button onClick={() => router.push('/learning-path')} type="button">
              <span className="material-symbols-outlined">map</span>
              <span>추천 로드맵</span>
            </button>
          </div>

          <div className="chatbot-react-sidebar-goal">
            <p>금주 학습 목표</p>
            <div>
              <strong>{currentCourse?.courseTitle || '추천 과정 확인'}</strong>
              <span>{completionPercent}%</span>
            </div>
            <div className="chatbot-react-progress-track">
              <div style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </aside>

        <section className="chatbot-react-main">
          <div className="chatbot-react-messages">
            <div className="chatbot-react-date">Today</div>
            {messages.map((message) => (
              <article className={`chatbot-react-message ${message.role}`} key={message.id}>
                {message.role === 'assistant' ? (
                  <div className="chatbot-react-avatar">
                    <img alt="HYUNDAI WIA" src="/brand/logo.png" />
                  </div>
                ) : null}
                <div className="chatbot-react-bubble-wrap">
                  <p>{message.role === 'assistant' ? 'AI 챗봇 상담사' : user.name || '나'}</p>
                  <div className="chatbot-react-bubble">
                    {message.text}
                  </div>
                </div>
              </article>
            ))}

            <div className="chatbot-react-quick">
              {[
                '내 부족 역량 알려줘',
                '최근 신청 상태 알려줘',
                '추천 이유',
                '선택 과정 코칭',
              ].map((label) => (
                <button key={label} onClick={() => void sendQuestion(label)} type="button">
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="chatbot-react-composer">
            <div className="chatbot-react-input">
              <button type="button">
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              <input
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void sendQuestion(draft)
                  }
                }}
                placeholder="궁금한 내용을 입력하세요..."
                value={draft}
              />
              <button onClick={() => void sendQuestion(draft)} type="button">
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <p>현대위아 AI 챗봇은 학습 데이터를 기반으로 답변을 생성하며 실수가 있을 수 있습니다.</p>
          </div>
        </section>

        <aside className="chatbot-react-context">
          <section className="chatbot-react-status">
            <h3>현재 학습 상태 요약</h3>
            <div className="chatbot-react-score">
              <div className="chatbot-react-score-ring">
                <svg viewBox="0 0 64 64">
                  <circle className="bg" cx="32" cy="32" r="28" />
                  <circle
                    className="fg"
                    cx="32"
                    cy="32"
                    r="28"
                    style={{
                      strokeDasharray: '175.9',
                      strokeDashoffset: `${175.9 - (175.9 * Math.max(0, Math.min(score, 100))) / 100}`,
                    }}
                  />
                </svg>
                <span>{score}점</span>
              </div>
              <div>
                <strong>AI 역량 성숙도</strong>
                <p>지난 진단 대비 {scoreDelta >= 0 ? '+' : ''}{scoreDelta}점</p>
              </div>
            </div>
            <button onClick={() => router.push('/diagnosis/results')} type="button">상세 진단 결과 보기</button>
          </section>

          <section className="chatbot-react-roadmap">
            <div className="chatbot-react-roadmap-head">
              <h3>추천 학습 로드맵</h3>
              <span>{completedRecommendationCount > 0 ? `${completedRecommendationCount}개 이수` : roadmap.length ? '진행 중' : '추천 없음'}</span>
            </div>
            <div className="chatbot-react-roadmap-list">
              {roadmap.map((item, index) => (
                <article className={`chatbot-react-roadmap-item ${item.state}`} key={`${item.title}-${index}`}>
                  <div className="chatbot-react-roadmap-marker">
                    <span>{index + 1}</span>
                    {index < roadmap.length - 1 ? <i /> : null}
                  </div>
                  <div>
                    <small>{item.statusLabel}</small>
                    <strong>{item.title}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <button className="chatbot-react-history-btn" onClick={() => router.push('/history')} type="button">
            <span className="material-symbols-outlined">schedule</span>
            전체 학습 이력 보기
          </button>
        </aside>
      </main>
    </div>
  )
}
