'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { syncAuthSession } from '@/lib/auth-client'
import {
  fetchDiagnosis,
  fetchDiagnosisHistory,
  fetchEnrollmentHistory,
  fetchJourneyStage,
  fetchRecommendedCourses,
  fetchSelectedCourse,
  selectRecommendedCourse,
  type DiagnosisPayload,
  type EnrollmentRecord,
  type JourneyStage,
  type RecommendedCourse,
} from '@/lib/learning-client'
import {
  RECOMMENDED_COURSE_PREVIEW_COUNT,
  buildRecommendationCourse,
  clearIdentity,
  type FaqItem,
  type NoticeItem,
  getDiagnosisScoreRate,
  getDisplayUser,
  getDefaultFaqItems,
  getDefaultNoticeItems,
} from '@/lib/stitch-ui'
import { fetchPublicFaqs, fetchPublicNotices } from '@/lib/public-content-client'
import { SiteFooter } from '@/components/site-footer'
import { UserTopNav } from '@/components/user-top-nav'

type HomeCourseCard = {
  courseId: string
  title: string
  durationText: string
  level: string
  badge: string
  imageUrl?: string
}

const fallbackCourseImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAq2Ogz7S_fC_IbavkX8JRmE9xQqUBXsbL-5KIRGeppJhCQcSUCaPqL1mtAdt4oYgyRSQzYWPSzsPZhmpzvkli3-yILjX2Dsh2QgfID0ZQufFkq0WEVMS_xXiUEhKewzgQYAKbYxLUjP_wE00zWIACx1voVPEbr9T_jq-d0ZdItcVL5HaqGsGb8hkU-Qf2EiXm8yE17IvWHnnPyIKuxSOq6u_93x2OQP5PaOEj04Sfzcy9K5noaMm3RLNlSs3OPJpdoEQNYotxmwA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDud1mPwpB1U5iQV_8q6MTve9DaS4DZCJQLeenQD3e5R7Jn4kte4Bvw7hzDJEV4x77Q0b2cow5kxTbq0SCwJ0YwISU1iZ4Ya8Tv6VeadjAGqS90NL3dH1lprN0QEbMg2u0bpW39Y5XYd02SpP37wHDFNjfphl2mpNheHzHcS2vmEEp4w4hULnz7ysnXojWKyw9cNOMqn9nLbHWM-Upxf3sw_aEvA-0ZlMtyVS8dpPGrdnwhOJTaWtMclnSyFW13E0IXKRU8xgiUXA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCa_JdGd26TJegH8I9YUYPNQXrS1b_R3GjpcKE_OZlygmDBBtXGz8JIvmZk3Y1F-eDDHlW4D6t_dJomQiKxK538LaVTVt_9otQsJgb8dSPv_zl2x7UhbKGXvDgPls70C1_g39xA5ujpkP8FGuN_ocKVD0ZYqJ6XUBXzfp3JFXKJMeT3-Y2VksmGUiwhAhDkV6xAig-J8bbl8vgNo7B3RGfpv3y4KJeMD_PVTv_Vn5HGM4oDVm0la-zX1hWLn5euI35RmSIJGG5V9Q',
]

function getJourney(stage: JourneyStage, latestEnrollment: EnrollmentRecord | null) {
  return [
    { title: '역량 진단', subtitle: '진단 준비 완료' },
    { title: '학습 추천', subtitle: stage === 'start' ? '대기' : '진행 중' },
    { title: '실무 적용', subtitle: stage === 'course_selected' ? '예정' : stage === 'enrollment_done' ? '진행 중' : '이전' },
    { title: '성과 도출', subtitle: latestEnrollment?.enrollmentStatus === 'enrolled' ? '다음 목표' : '미래 목표' },
  ]
}

function formatHomeDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function getStatusTone(index: number) {
  if (index === 0) return { icon: 'event_note', className: 'home-react-status-icon home-react-status-blue' }
  if (index === 1) return { icon: 'analytics', className: 'home-react-status-icon home-react-status-green' }
  if (index === 2) return { icon: 'auto_awesome', className: 'home-react-status-icon home-react-status-amber' }
  return { icon: 'play_circle', className: 'home-react-status-icon home-react-status-purple' }
}

export function HomeScreen() {
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)
  const [diagnosis, setDiagnosis] = useState<DiagnosisPayload | null>(null)
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisPayload[]>([])
  const [latestEnrollment, setLatestEnrollment] = useState<EnrollmentRecord | null>(null)
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<RecommendedCourse | null>(null)
  const [stage, setStage] = useState<JourneyStage>('start')
  const [notices, setNotices] = useState<NoticeItem[]>(() => getDefaultNoticeItems())
  const [faqs, setFaqs] = useState<FaqItem[]>(() => getDefaultFaqItems())

  const load = useCallback(async () => {
    try {
      const currentSession = await syncAuthSession()
      setSession(currentSession)
      const [diagnosisPayload, diagnosisRecords, enrollments, courses, selected, currentStage] = await Promise.all([
        fetchDiagnosis().catch(() => null),
        fetchDiagnosisHistory().catch(() => []),
        fetchEnrollmentHistory().catch(() => []),
        fetchRecommendedCourses('all').catch(() => []),
        fetchSelectedCourse().catch(() => null),
        fetchJourneyStage().catch(() => 'start' as JourneyStage),
      ])
      setDiagnosis(diagnosisPayload)
      setDiagnosisHistory(diagnosisRecords)
      setLatestEnrollment(enrollments[0] ?? null)
      setRecommendedCourses(courses)
      setSelectedCourse(selected)
      setStage(currentStage)
    } catch {
      // Keep the initial shell rendered and let pages recover on the next action.
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    let active = true

    void Promise.all([
      fetchPublicNotices().catch(() => getDefaultNoticeItems()),
      fetchPublicFaqs().catch(() => getDefaultFaqItems()),
    ]).then(([nextNotices, nextFaqs]) => {
      if (!active) return
      setNotices(nextNotices.length ? nextNotices : getDefaultNoticeItems())
      setFaqs(nextFaqs.length ? nextFaqs : getDefaultFaqItems())
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.home-react-reveal'))
    if (!nodes.length) return

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((node) => node.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 })

    nodes.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index * 70, 280)}ms`
      observer.observe(node)
    })

    return () => observer.disconnect()
  }, [session, diagnosis, recommendedCourses])

  const topCourses = useMemo(
    () =>
      recommendedCourses.slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT).map((course, index) => ({
        ...buildRecommendationCourse(course, index),
        badge: index === 0 ? '핵심 기능' : index === 1 ? '비즈니스' : index === 2 ? '로봇공학' : '추천',
      })),
    [recommendedCourses],
  )

  const user = getDisplayUser(session?.profile)
  const scoreRate = getDiagnosisScoreRate(diagnosis)
  const scoreDeltaText = useMemo(() => {
    if (!diagnosis) return ''
    const previous = diagnosisHistory
      .filter((item) => item.diagnosedAt !== diagnosis.diagnosedAt)
      .sort((left, right) => new Date(right.diagnosedAt).getTime() - new Date(left.diagnosedAt).getTime())[0]

    if (!previous) return '0%'

    const delta = scoreRate - getDiagnosisScoreRate(previous)
    if (delta > 0) return `^+${delta}%`
    if (delta < 0) return `v${delta}%`
    return '0%'
  }, [diagnosis, diagnosisHistory, scoreRate])
  const activeEnrollmentCount = latestEnrollment?.enrollmentStatus === 'enrolled' ? 1 : 0

  const primaryRoute = diagnosis ? (selectedCourse ? '/course-linking' : '/recommendation') : '/diagnosis'
  const secondaryRoute = diagnosis ? '/diagnosis/results' : '/diagnosis/results'
  const primaryLabel = diagnosis ? (selectedCourse ? '추천 과정 이어보기' : '맞춤 추천 보기') : '진단 시작하기'
  const journey = getJourney(stage, latestEnrollment)
  const courses: HomeCourseCard[] = topCourses.length
    ? topCourses
    : [
        { courseId: 'fallback-1', title: '스마트 팩토리의 디지털 제조 및 사이버 보안', durationText: '4.5시간', level: '고급', badge: '핵심 기능', imageUrl: fallbackCourseImages[0] },
        { courseId: 'fallback-2', title: '관리자를 위한 전략적 데이터 기반 의사결정', durationText: '3.2시간', level: '중급', badge: '비즈니스', imageUrl: fallbackCourseImages[1] },
        { courseId: 'fallback-3', title: '자동차 조립의 첨단 모션 제어 시스템', durationText: '5.8시간', level: '전문가', badge: '로봇공학', imageUrl: fallbackCourseImages[2] },
        { courseId: 'fallback-4', title: '제조 현장을 바꾸는 데이터 기반 공정 개선', durationText: '4시간', level: '중급', badge: '추천', imageUrl: fallbackCourseImages[0] },
        { courseId: 'fallback-5', title: '문제를 성과로 연결하는 실전 협업 문제해결', durationText: '2.5시간', level: '입문', badge: '추천', imageUrl: fallbackCourseImages[1] },
      ]
  const resolveIntentRoute = useCallback(
    async (requestedRoute: string) => {
      if (requestedRoute === '/') return '/'

      if (!session?.authenticated) {
        return `/login?next=${encodeURIComponent(requestedRoute)}`
      }

      const [latestDiagnosis, latestSelectedCourse] = await Promise.all([
        fetchDiagnosis().catch(() => null),
        fetchSelectedCourse().catch(() => null),
      ])

      if (requestedRoute === '/diagnosis' || requestedRoute === '/chatbot' || requestedRoute === '/history') return requestedRoute
      if (requestedRoute === '/diagnosis/results') return latestDiagnosis ? requestedRoute : '/diagnosis'
      if (requestedRoute === '/recommendation' || requestedRoute === '/learning-path') return latestDiagnosis ? requestedRoute : '/diagnosis'
      if (requestedRoute === '/course-linking') {
        if (latestSelectedCourse) return '/course-linking'
        if (latestDiagnosis) return '/recommendation'
        return '/diagnosis'
      }
      if (requestedRoute === '/analytics') return latestDiagnosis ? '/analytics' : '/diagnosis'
      return requestedRoute
    },
    [session?.authenticated],
  )

  const goTo = useCallback(
    async (route: string) => {
      router.push(await resolveIntentRoute(route))
    },
    [resolveIntentRoute, router],
  )

  const handleCourseSelect = useCallback(
    async (courseId: string) => {
      if (!session?.authenticated) {
        router.push('/login?next=%2Frecommendation')
        return
      }
      const latestDiagnosis = await fetchDiagnosis().catch(() => null)
      if (!latestDiagnosis) {
        router.push('/diagnosis')
        return
      }
      const course = recommendedCourses.find((item) => item.courseId === courseId)
      if (!course) return
      await selectRecommendedCourse(course)
      await load()
      router.push('/course-linking')
    },
    [load, recommendedCourses, router, session?.authenticated],
  )

  const handleLogout = useCallback(async () => {
    await clearIdentity()
    await load()
    router.push('/')
  }, [load, router])

  return (
    <div className="home-react-page">
      <UserTopNav
        activeRoute="/"
        authenticated={Boolean(session?.authenticated)}
        loginHref="/login"
        onLogout={handleLogout}
        organization={user.organization}
        role={session?.role}
        signupHref="/signup"
        userName={user.name}
      />

      <main className="home-react-main">
        <section className="home-react-hero home-react-reveal is-visible">
          <div className="home-react-hero-gradient" />
          <div className="home-react-hero-media">
            <img
              alt="Group of professionals collaborating in a modern office space"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLzho0Lg_UsNv_5wzIxr1IXF2e9h2ZlXtBV04K1BFDYRy9VjVvvPDOTbe3VPcv1j0Znqb_U739A1n__gGX2kCSDXQL1Lss_aNlbnGP5_gNT46Bt8GrIWtFSxBxQLhKrnSWNVEEPBnRn_RUQsiuUfLQr63jExnBcXbzl76JAzR6ZjwTAZija8tsrW-lkT_io4PYASNkBmk_Bek6aLuLxIT6i1Ci86EGWoanZTZ4Lker6MfL5plAYnLwHGEMzqbjCHbU0wKHU4CrnA"
            />
          </div>
          <div className="home-react-hero-copy">
            <span>On Learning Searcher</span>
            <h1>AI 역량진단 기반의<br />맞춤형 학습설계 플랫폼</h1>
            <p>회사의 개인화된 학습 경로 설계를 통해<br />당신의 잠재력을 깨우고 스마트한 커리어 패스를 설계하세요. 🚀</p>
            <div className="home-react-hero-actions">
              <button className="home-react-primary-btn" onClick={() => void goTo(primaryRoute)} type="button">
                {primaryLabel} <span className="material-symbols-outlined">rocket_launch</span>
              </button>
              <button className="home-react-ghost-btn" onClick={() => void goTo(secondaryRoute)} type="button">
                이전 진단 결과 보기
              </button>
            </div>
          </div>
        </section>

        <section className="home-react-status-grid home-react-reveal">
          {[
            { label: '최근 진단일', value: formatHomeDate(diagnosis?.diagnosedAt) },
            { label: '역량 지수', value: diagnosis ? `${scoreRate}` : '-', suffix: '/ 100', delta: diagnosis ? scoreDeltaText : '' },
            { label: '추천 과정', value: `${diagnosis ? topCourses.length : 0}개 과정` },
            { label: '학습 중', value: `${activeEnrollmentCount}개 과정` },
          ].map((item, index) => {
            const tone = getStatusTone(index)
            return (
              <button className="home-react-status-card" key={item.label} onClick={() => void goTo(index === 2 ? '/learning-path' : '/history')} type="button">
                <div className="home-react-status-card-top">
                  <span className={tone.className}>{tone.icon}</span>
                  {item.delta ? <strong className={item.delta.startsWith('^+') ? 'positive' : item.delta.startsWith('v-') ? 'negative' : ''}>{item.delta}</strong> : null}
                </div>
                <p>{item.label}</p>
                <h2>{item.value} {item.suffix ? <small>{item.suffix}</small> : null}</h2>
              </button>
            )
          })}
        </section>

        <section className="home-react-journey home-react-reveal">
          <h3><span />추천 학습 과정</h3>
          <div className="home-react-journey-track">
            <div className="home-react-line" />
            <div className="home-react-line active-line" />
            {journey.map((item, index) => (
              <article className={index > 1 ? 'muted' : ''} key={item.title}>
                <div>
                  <span className="material-symbols-outlined">{index === 0 ? 'assignment' : index === 1 ? 'recommend' : index === 2 ? 'school' : 'trending_up'}</span>
                </div>
                <p>{item.title}</p>
                <small>{item.subtitle}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="home-react-picks home-react-reveal">
          <div className="home-react-section-head">
            <h3><span />추천 학습 과정</h3>
            <button onClick={() => void goTo('/learning-path')} type="button">전체 보기</button>
          </div>
          <div className="home-react-course-flow">
            <div className="home-react-course-track">
              {[...courses, ...courses].map((course, index) => (
                <CourseCard course={course} imageIndex={index} key={`${course.courseId}-${index}`} onSelect={handleCourseSelect} />
              ))}
            </div>
          </div>
        </section>

        <section className="home-react-board home-react-reveal">
          <div className="home-react-board-grid">
            <div className="home-react-board-panel">
              <div className="home-react-board-head">
                <h3><span />공지사항</h3>
                <small>Notice Board</small>
              </div>
              <div className="home-react-notices">
                {notices.map((notice) => (
                  <article key={notice.id}>
                    <div>
                      <span>{notice.category}</span>
                      <time>{notice.date}</time>
                    </div>
                    <h4>{notice.title}</h4>
                    <p>{notice.summary}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="home-react-board-panel">
              <div className="home-react-board-head">
                <h3><span />FAQ</h3>
                <small>Quick Answers</small>
              </div>
              <div className="home-react-faqs">
                {faqs.map((faq) => (
                  <details key={faq.id}>
                    <summary>
                      <span>{faq.question}</span>
                      <span className="material-symbols-outlined">expand_more</span>
                    </summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function CourseCard({
  course,
  imageIndex,
  onSelect,
}: {
  course: HomeCourseCard
  imageIndex: number
  onSelect: (courseId: string) => void | Promise<void>
}) {
  const imageUrl = course.imageUrl || fallbackCourseImages[imageIndex % fallbackCourseImages.length]
  return (
    <article className="home-react-course-card" onClick={() => void onSelect(course.courseId)}>
      <div className="home-react-course-image">
        <img alt={course.title} src={imageUrl} />
        <span className={course.badge === '비즈니스' ? 'accent' : ''}>{course.badge}</span>
      </div>
      <div className="home-react-course-copy">
        <h4>{course.title}</h4>
        <div>
          <span><span className="material-symbols-outlined">schedule</span>{course.durationText}</span>
          <span><span className="material-symbols-outlined">signal_cellular_alt</span>{course.level}</span>
        </div>
        <button onClick={() => void onSelect(course.courseId)} type="button">
          지금 수강하기 <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </article>
  )
}
