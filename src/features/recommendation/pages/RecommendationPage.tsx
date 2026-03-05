import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppShell } from '../../../shared/layouts/AppShell'
import {
  getDiagnosisPayload,
  saveSelectedCourse,
  type RecommendedCourse,
} from '../../../shared/state/learningFlow'

const mockCourses: RecommendedCourse[] = [
  {
    courseId: 'DIG-101',
    courseTitle: '디지털 생산성 툴 실무',
    level: '입문',
    durationHours: 6,
    reasonTags: ['digital', 'skill-gap'],
    recommendedBy: 'skill-gap',
  },
  {
    courseId: 'LDR-210',
    courseTitle: '현업 리더십 커뮤니케이션',
    level: '중급',
    durationHours: 8,
    reasonTags: ['leadership', 'role-fit'],
    recommendedBy: 'role-fit',
  },
  {
    courseId: 'COL-180',
    courseTitle: '부서간 협업 문제 해결 워크숍',
    level: '중급',
    durationHours: 5,
    reasonTags: ['collaboration', 'skill-gap'],
    recommendedBy: 'skill-gap',
  },
  {
    courseId: 'PS-300',
    courseTitle: '문제해결 사고법 고급 과정',
    level: '심화',
    durationHours: 10,
    reasonTags: ['problemSolving', 'history-based'],
    recommendedBy: 'history-based',
  },
]

export function RecommendationPage() {
  const diagnosis = getDiagnosisPayload()
  const navigate = useNavigate()
  const [levelFilter, setLevelFilter] = useState<'all' | '입문' | '중급' | '심화'>('all')

  const filtered = useMemo(() => {
    const base = mockCourses.filter((course) => {
      if (!diagnosis) return true
      return diagnosis.topGaps.some((gap) => course.reasonTags.includes(gap))
    })

    if (levelFilter === 'all') return base
    return base.filter((course) => course.level === levelFilter)
  }, [diagnosis, levelFilter])

  const moveToEnrollment = (course: RecommendedCourse) => {
    saveSelectedCourse(course)
    navigate('/course-linking')
  }

  return (
    <AppShell
      title="맞춤 교육 추천"
      description="진단 결과 기반으로 추천 이유를 포함한 과정을 제안합니다."
    >
      {!diagnosis && (
        <section className="hero-card">
          <h2>진단 결과가 필요합니다</h2>
          <p>추천 정확도를 위해 먼저 역량 진단을 완료해 주세요.</p>
          <Link className="primary-btn link-btn" to="/diagnosis">
            진단하러 가기
          </Link>
        </section>
      )}

      {diagnosis && (
        <section className="hero-card">
          <h2>추천 기준</h2>
          <p>보완 우선 역량: {diagnosis.topGaps.join(', ')}</p>
          <label>
            난이도 필터
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)}>
              <option value="all">전체</option>
              <option value="입문">입문</option>
              <option value="중급">중급</option>
              <option value="심화">심화</option>
            </select>
          </label>
        </section>
      )}

      <section className="feature-grid">
        {filtered.map((course) => (
          <article className="feature-card" key={course.courseId}>
            <h3>{course.courseTitle}</h3>
            <p>
              난이도 {course.level} | {course.durationHours}시간
            </p>
            <div className="tag-row">
              {course.reasonTags.map((tag) => (
                <span className="reason-tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <button className="primary-btn" onClick={() => moveToEnrollment(course)} type="button">
              신청하기
            </button>
          </article>
        ))}
      </section>
    </AppShell>
  )
}
