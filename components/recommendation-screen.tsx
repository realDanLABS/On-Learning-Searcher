'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { fetchRecommendedCourses, selectRecommendedCourse, type RecommendedCourse } from '@/lib/learning-client'
import { clearIdentity, buildRecommendationCourse, getDisplayUser } from '@/lib/stitch-ui'
import { syncAuthSession } from '@/lib/auth-client'
import { SiteFooter } from '@/components/site-footer'
import { UserTopNav } from '@/components/user-top-nav'

type RecommendationCourseView = ReturnType<typeof buildRecommendationCourse>

export function RecommendationScreen() {
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)
  const [courses, setCourses] = useState<RecommendedCourse[]>([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selectedLevel, setSelectedLevel] = useState('전체')
  const [sort, setSort] = useState('추천순')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const currentSession = await syncAuthSession()
      setSession(currentSession)

      if (!currentSession.authenticated) {
        return
      }

      setCourses(await fetchRecommendedCourses('all'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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
  }, [loading, courses])

  const user = getDisplayUser(session?.profile)
  const recommendationCourses = useMemo(
    () => courses.map((course, index) => buildRecommendationCourse(course, index)),
    [courses],
  )
  const filteredCourses = useMemo(() => {
    let next = [...recommendationCourses]
    if (selectedCategory !== '전체') {
      next = next.filter((course) => course.category === selectedCategory)
    }
    if (selectedLevel !== '전체') {
      next = next.filter((course) => course.level === selectedLevel)
    }
    if (sort === '최신순') {
      next.sort((left, right) => (right.rank || 0) - (left.rank || 0))
    } else {
      next.sort((left, right) => (right.fitScore || 0) - (left.fitScore || 0))
    }
    return next.slice(0, 5)
  }, [recommendationCourses, selectedCategory, selectedLevel, sort])

  const handleLogout = useCallback(async () => {
    await clearIdentity()
    router.push('/')
  }, [router])

  const selectCourse = useCallback(
    async (courseId: string, route: '/learning-path' | '/course-linking') => {
      const course = courses.find((item) => item.courseId === courseId)
      if (course) {
        await selectRecommendedCourse(course)
      }
      router.push(route)
    },
    [courses, router],
  )

  if (loading) {
    return <div className="app-bootstrap-loading">추천 과정을 불러오는 중입니다...</div>
  }

  if (!session?.authenticated) {
    return <div className="app-bootstrap-loading">추천 화면 접근 권한을 확인하는 중입니다...</div>
  }

  return (
    <div className="home-react-page recommendation-react-page">
      <UserTopNav
        activeRoute="/history"
        authenticated
        onLogout={handleLogout}
        organization={user.organization}
        role={session?.role}
        userName={user.name}
      />

      <main className="recommendation-react-main">
        <div className="recommendation-react-layout home-react-reveal is-visible">
          <aside className="recommendation-react-filters" aria-label="추천 과정 필터">
            <FilterGroup
              label="카테고리"
              options={['전체', '디자인', '개발', '데이터/AI']}
              selected={selectedCategory}
              type="checkbox"
              onSelect={setSelectedCategory}
            />
            <FilterGroup
              label="난이도"
              options={['전체', '입문', '중급', '심화']}
              selected={selectedLevel}
              type="radio"
              onSelect={setSelectedLevel}
            />
          </aside>

          <section className="recommendation-react-content">
            <div className="recommendation-react-head">
              <div>
                <h1>맞춤 교육 추천</h1>
                <p>진단 결과와 최근 학습 흐름을 바탕으로 지금 바로 신청할 과정을 골라보세요.</p>
              </div>
              <select aria-label="정렬" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option>추천순</option>
                <option>최신순</option>
              </select>
            </div>

            <div className="recommendation-react-grid">
              {filteredCourses.length ? (
                filteredCourses.map((course) => (
                  <RecommendationCard course={course} key={course.courseId} onApply={(courseId) => void selectCourse(courseId, '/course-linking')} onView={(courseId) => void selectCourse(courseId, '/learning-path')} />
                ))
              ) : (
                <div className="recommendation-react-empty">조건에 맞는 추천 과정이 없습니다.</div>
              )}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function FilterGroup({
  label,
  options,
  selected,
  type,
  onSelect,
}: {
  label: string
  options: string[]
  selected: string
  type: 'checkbox' | 'radio'
  onSelect: (value: string) => void
}) {
  return (
    <div className="recommendation-react-filter-group">
      <h2>{label}</h2>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input checked={selected === option} name={label} onChange={() => onSelect(option)} type={type} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function RecommendationCard({
  course,
  onView,
  onApply,
}: {
  course: RecommendationCourseView
  onView: (courseId: string) => void
  onApply: (courseId: string) => void
}) {
  return (
    <article className="recommendation-react-card">
      <div className="recommendation-react-card-image">
        <img alt={course.title} src={course.imageUrl || '/brand/logo.png'} />
        <span className={course.badge === '신규' ? 'accent' : ''}>{course.badge}</span>
      </div>
      <div className="recommendation-react-card-copy">
        <div className="recommendation-react-card-meta">
          <span>{course.level}</span>
          <span>{course.durationText}</span>
        </div>
        <h2>{course.title}</h2>
        <div className="recommendation-react-card-actions">
          <button onClick={() => onView(course.courseId)} type="button">상세보기</button>
          <button onClick={() => onApply(course.courseId)} type="button">수강 신청</button>
        </div>
      </div>
    </article>
  )
}
