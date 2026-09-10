'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { UserTopNav } from '@/components/user-top-nav'
import { syncAuthSession } from '@/lib/auth-client'
import {
  fetchEnrollmentHistory,
  fetchRecommendedCourses,
  fetchSelectedCourse,
  submitEnrollment,
  type RecommendedCourse,
} from '@/lib/learning-client'
import {
  buildCourseCurriculum,
  buildRecommendationCourse,
  clearIdentity,
  formatDurationText,
  getAreaImage,
  getDisplayUser,
} from '@/lib/stitch-ui'

export function CourseLinkingScreen({ search }: { search?: string }) {
  void search
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<RecommendedCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    void syncAuthSession()
      .then((session) => {
        setSession(session)
        if (!session.authenticated) {
          router.replace('/login?next=%2Fcourse-linking')
          return
        }
        return Promise.all([fetchSelectedCourse(), fetchRecommendedCourses('all'), fetchEnrollmentHistory()]).then(
          async ([selected]) => {
            setSelectedCourse(selected)
          },
        )
      })
      .finally(() => setLoading(false))
  }, [router])

  const course = selectedCourse
  const view = useMemo(() => {
    const fallbackCard = course ? buildRecommendationCourse(course, 0) : null
    return {
      title: course?.courseTitle ?? 'AI가 말했다 그건 네가 안 해도 돼 - 반복 업무 대신 AI가 일하는 업무 자동화 입문',
      summary: course?.summary ?? '업무 효율의 혁명! 단순히 AI를 아는 것을 넘어, 실질적인 업무 프로세스를 자동화하여 생산성을 향상시키는 교육입니다.',
      durationText: course ? `${formatDurationText(course.durationHours)} (${Math.max(1, Math.round(course.durationHours / 8))}Day 과정)` : '8시간 (1Day 과정)',
      deliveryMode: '실시간 온라인 교육',
      heroCaption: fallbackCard?.title ?? '차세대 업무 자동화 솔루션',
      heroImageUrl: getAreaImage(course?.competencyArea),
      objectives: course?.objectives ?? ['AI 도구의 기본 원리와 업무 적용 방법 습득', '노코드 협업 도구와 AI 자동화 워크플로우 설계'],
      curriculum: course
        ? buildCourseCurriculum(course)
        : [
            { title: 'AI 시대의 업무 방식 변화', subtitle: '생성형 AI의 이해와 업무 자동화의 필요성 파악' },
            { title: '프롬프트 엔지니어링 실습', subtitle: '원하는 결과를 즉시 얻어내는 고급 프롬프트 기술' },
            { title: '데이터 분석 및 보고서 자동화', subtitle: '엑셀 및 파워포인트 작업 시간을 줄이는 AI 활용법' },
          ],
      expectedOutcomes: course?.expectedOutcomes ?? [
        '단순 반복 업무에서 해방되어 핵심 가치 업무에 집중 가능',
        '최신 AI 기술 습득을 통한 개인 및 조직의 디지털 경쟁력 강화',
        '팀 전체의 업무 프로세스 최적화 및 커뮤니케이션 효율 증대',
      ],
      targetAudience: course?.targetAudience ?? ['전사 임직원', 'R&D 센터', '기획/관리팀', '생산기술'],
    }
  }, [course])

  if (loading) {
    return <div className="app-bootstrap-loading">교육 신청 화면을 준비하는 중입니다...</div>
  }

  const user = getDisplayUser(session?.profile)

  if (!course) {
    return (
      <div className="home-react-page">
        <UserTopNav
          activeRoute="/history"
          authenticated={Boolean(session?.authenticated)}
          loginHref="/login?next=%2Fcourse-linking"
          onLogout={async () => {
            await clearIdentity()
            router.push('/')
          }}
          organization={user.organization}
          role={session?.role}
          signupHref="/signup?next=%2Fcourse-linking"
          userName={user.name}
        />
        <main className="learning-react-main">
          <section className="learning-react-title home-react-reveal is-visible">
            <h1>선택된 과정이 없습니다.</h1>
            <p>추천 과정에서 과정을 먼저 선택해야 상세 정보와 수강 신청을 진행할 수 있습니다.</p>
            <div className="recommendation-react-card-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
              <button onClick={() => router.push('/recommendation')} type="button">추천 과정 보러 가기</button>
            </div>
          </section>
        </main>
      </div>
    )
  }

  async function handleExternalApply() {
    if (!course) return
    await submitEnrollment({
      userId: user.employeeId || 'anonymous',
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      enrollmentRequestedAt: new Date().toISOString(),
      enrollmentStatus: 'requested',
    })
    setStatusMessage('E-Campus 신청 요청 상태로 저장되었습니다.')
  }

  async function handleDemoEnroll() {
    if (!course) return
    await submitEnrollment({
      userId: user.employeeId || 'anonymous',
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      enrollmentRequestedAt: new Date().toISOString(),
      enrollmentStatus: 'enrolled',
    })
    router.push('/history')
  }

  return (
    <div className="home-react-page course-linking-react-page">
      <UserTopNav
        activeRoute="/history"
        authenticated={Boolean(session?.authenticated)}
        loginHref="/login?next=%2Fcourse-linking"
        onLogout={async () => {
          await clearIdentity()
          router.push('/')
        }}
        organization={user.organization}
        role={session?.role}
        signupHref="/signup?next=%2Fcourse-linking"
        userName={user.name}
      />

      <main className="course-linking-react-main">
        <nav className="course-linking-react-breadcrumb" aria-label="breadcrumb">
          <button onClick={() => router.push('/')} type="button">홈</button>
          <span className="material-symbols-outlined">chevron_right</span>
          <b>교육 신청 연동</b>
        </nav>

        <section className="course-linking-react-hero">
          <div className="course-linking-react-hero-copy">
            <span>Recommended Course</span>
            <h1>{view.title}</h1>
            <p>{view.summary}</p>
          </div>

          <aside className="course-linking-react-actions">
            <div className="course-linking-react-action-row">
              <div className="course-linking-react-action-icon navy">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <small>총 학습 시간</small>
                <strong>{view.durationText}</strong>
              </div>
            </div>
            <div className="course-linking-react-action-row">
              <div className="course-linking-react-action-icon accent">
                <span className="material-symbols-outlined">laptop_mac</span>
              </div>
              <div>
                <small>교육 방식</small>
                <strong>{view.deliveryMode}</strong>
              </div>
            </div>
            <div className="course-linking-react-action-buttons">
              <p>이 과정은 회사 E-Campus 시스템과 연동되어 있습니다. 신청 시 해당 시스템 기준으로 요청 상태가 저장됩니다.</p>
              <button className="course-linking-react-primary" onClick={() => void handleExternalApply()} type="button">
                <span>E-Campus에서 신청하기</span>
                <span className="material-symbols-outlined">open_in_new</span>
              </button>
              <button className="course-linking-react-secondary" onClick={() => void handleDemoEnroll()} type="button">
                <span className="material-symbols-outlined">check_circle</span>
                <span>추천 과정 수강 완료</span>
              </button>
              {statusMessage ? <small className="course-linking-react-status">{statusMessage}</small> : null}
            </div>
          </aside>
        </section>

        <section className="course-linking-react-content">
          <div className="course-linking-react-left">
            <div className="course-linking-react-cover">
              <img alt={view.title} src={view.heroImageUrl || '/brand/logo.png'} />
              <div className="course-linking-react-cover-overlay">
                <p>Modern AI Workflow</p>
                <strong>{view.heroCaption}</strong>
              </div>
            </div>

            <section className="course-linking-react-section">
              <h2><span className="material-symbols-outlined">target</span>학습 목표</h2>
              <div className="course-linking-react-objectives">
                {view.objectives.map((objective, index) => (
                  <article key={`${objective}-${index}`}>{objective}</article>
                ))}
              </div>
            </section>

            <section className="course-linking-react-section">
              <h2><span className="material-symbols-outlined">menu_book</span>커리큘럼</h2>
              <div className="course-linking-react-curriculum">
                {view.curriculum.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <b>{String(index + 1).padStart(2, '0')}</b>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.subtitle}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="course-linking-react-right">
            <section className="course-linking-react-impact">
              <h3><span className="material-symbols-outlined">trending_up</span>기대 효과</h3>
              <ul>
                {view.expectedOutcomes.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="course-linking-react-audience">
              <h3>권장 대상</h3>
              <div>
                {view.targetAudience.map((item, index) => (
                  <span key={`${item}-${index}`}>#{item}</span>
                ))}
              </div>
            </section>

            <section className="course-linking-react-notice">
              <span className="material-symbols-outlined">info</span>
              <p>
                <b>외부 시스템 안내:</b>
                <br />
                본 페이지는 교육 정보를 제공하며 실제 수강 신청 및 이수 처리는 회사 E-Campus 기준으로 관리됩니다.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}
