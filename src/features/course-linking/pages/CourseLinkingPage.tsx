import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  fetchSelectedCourse,
  submitEnrollment,
} from '../../../shared/api/learningApi'
import { getErrorMessage } from '../../../shared/api/errorMessage'
import { runtimeConfig } from '../../../shared/config/runtime'
import { AppShell } from '../../../shared/layouts/AppShell'
import type { EnrollmentRecord, RecommendedCourse } from '../../../shared/state/learningFlow'

export function CourseLinkingPage() {
  const navigate = useNavigate()
  const [course, setCourse] = useState<RecommendedCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const hasCourse = Boolean(course)

  const loadCourse = async () => {
    try {
      setLoadError(null)
      setLoading(true)
      setCourse(await fetchSelectedCourse())
    } catch (error) {
      setLoadError(getErrorMessage(error, '선택 과정 정보를 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCourse()
  }, [])

  const requestEnrollment = async () => {
    if (!course) return

    const record: EnrollmentRecord = {
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      enrollmentRequestedAt: new Date().toISOString(),
      enrollmentStatus: 'enrolled',
    }
    try {
      setSubmitting(true)
      await submitEnrollment(record)
      navigate('/history')
    } catch (error) {
      setLoadError(getErrorMessage(error, '신청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell
      title="교육 신청 연동"
      description="추천 과정을 선택하면 신청 후 이력 페이지에서 상태를 확인할 수 있습니다."
    >
      {loadError && (
        <section className="hero-card">
          <h2>오류</h2>
          <p className="error-text">{loadError}</p>
          <button className="secondary-btn" onClick={() => void loadCourse()} type="button">
            다시 시도
          </button>
        </section>
      )}

      {loading && (
        <section className="hero-card">
          <p className="hint-text">과정 정보를 불러오는 중입니다...</p>
        </section>
      )}

      {!hasCourse && (
        <section className="hero-card">
          <h2>선택된 과정이 없습니다</h2>
          <p>추천 페이지에서 과정을 선택하고 다시 들어와 주세요.</p>
          <Link className="primary-btn link-btn" to="/recommendation">
            추천 페이지로 이동
          </Link>
        </section>
      )}

      {hasCourse && course && (
        <section className="hero-card">
          <h2>{course.courseTitle}</h2>
          <p>과정코드: {course.courseId}</p>
          <p>추천근거: {course.reasonTags.join(', ')}</p>

          <div className="journey-actions">
            <a
              className="secondary-btn link-btn"
              href={runtimeConfig.ecampusCourseApplyUrl}
              rel="noreferrer"
              target="_blank"
            >
              이캠퍼스 신청 페이지 열기
            </a>
            <button
              className="primary-btn"
              disabled={submitting}
              onClick={() => void requestEnrollment()}
              type="button"
            >
              {submitting ? '처리 중...' : '신청 완료 처리'}
            </button>
            <Link className="primary-btn link-btn" to="/history">
              이력 확인하기
            </Link>
          </div>
          <p className="hint-text">
            신청 완료 처리 버튼을 누르면 이력 페이지에서 등록 상태를 바로 확인할 수 있습니다.
          </p>
          <p className="hint-text">
            운영 환경에서는 `VITE_ECAMPUS_COURSE_APPLY_URL` 값으로 실제 신청 링크를 연결하세요.
          </p>
        </section>
      )}
    </AppShell>
  )
}
