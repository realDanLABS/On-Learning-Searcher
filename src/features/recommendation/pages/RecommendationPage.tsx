import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  fetchDiagnosis,
  fetchRecommendedCourses,
  selectRecommendedCourse,
} from '../../../shared/api/learningApi'
import { AppShell } from '../../../shared/layouts/AppShell'
import type { DiagnosisPayload, RecommendedCourse } from '../../../shared/state/learningFlow'

export function RecommendationPage() {
  const [diagnosis, setDiagnosis] = useState<DiagnosisPayload | null>(null)
  const [courses, setCourses] = useState<RecommendedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [levelFilter, setLevelFilter] = useState<'all' | '입문' | '중급' | '심화'>('all')

  const loadData = useCallback(async () => {
    try {
      setLoadError(null)
      setLoading(true)
      setDiagnosis(await fetchDiagnosis())
      setCourses(await fetchRecommendedCourses(levelFilter))
    } catch {
      setLoadError('추천 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }, [levelFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const moveToEnrollment = async (course: RecommendedCourse) => {
    try {
      setActionError(null)
      await selectRecommendedCourse(course)
      navigate('/course-linking')
    } catch {
      setActionError('과정 선택 처리 중 오류가 발생했습니다. 다시 시도해 주세요.')
    }
  }

  return (
    <AppShell
      title="맞춤 교육 추천"
      description="진단 결과 기반으로 추천 이유를 포함한 과정을 제안합니다."
    >
      {loadError && (
        <section className="hero-card">
          <h2>추천 데이터 오류</h2>
          <p className="error-text">{loadError}</p>
          <button className="primary-btn" onClick={() => void loadData()} type="button">
            다시 시도
          </button>
        </section>
      )}

      {actionError && (
        <section className="hero-card">
          <p className="error-text">{actionError}</p>
        </section>
      )}

      {loading && (
        <section className="hero-card">
          <p className="hint-text">추천 데이터를 불러오는 중입니다...</p>
        </section>
      )}

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
        {courses.length > 0 ? (
          courses.map((course) => (
            <article className="feature-card" key={course.courseId}>
              <h3>{course.courseTitle}</h3>
              <p>
                난이도 {course.level} | {course.durationHours}시간
              </p>
              {typeof course.fitScore === 'number' && <p>적합도 {course.fitScore}%</p>}
              <div className="tag-row">
                {course.reasonTags.map((tag) => (
                  <span className="reason-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <button className="primary-btn" onClick={() => void moveToEnrollment(course)} type="button">
                신청하기
              </button>
            </article>
          ))
        ) : (
          <article className="feature-card">
            <h3>필터 조건에 맞는 과정이 없습니다</h3>
            <p>필터를 초기화하거나 진단을 다시 수행해 추천 범위를 넓혀주세요.</p>
            <button className="secondary-btn" onClick={() => setLevelFilter('all')} type="button">
              필터 초기화
            </button>
          </article>
        )}
      </section>

      <section className="hero-card">
        <h2>다음 단계 안내</h2>
        <p>과정 선택 후 신청 연동에서 등록을 완료하면 이력 대시보드와 챗봇 상담으로 이어집니다.</p>
        <div className="journey-actions">
          <Link className="secondary-btn link-btn" to="/course-linking">
            신청 연동 바로가기
          </Link>
          <Link className="secondary-btn link-btn" to="/chatbot">
            AI 상담 먼저 보기
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
