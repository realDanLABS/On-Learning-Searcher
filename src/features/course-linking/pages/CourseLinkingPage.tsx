import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  fetchSelectedCourse,
  submitEnrollment,
} from '../../../shared/api/learningApi'
import { AppShell } from '../../../shared/layouts/AppShell'
import type { EnrollmentRecord, RecommendedCourse } from '../../../shared/state/learningFlow'

export function CourseLinkingPage() {
  const [course, setCourse] = useState<RecommendedCourse | null>(null)
  const hasCourse = Boolean(course)

  useEffect(() => {
    const run = async () => {
      setCourse(await fetchSelectedCourse())
    }
    void run()
  }, [])

  const requestEnrollment = async () => {
    if (!course) return

    const record: EnrollmentRecord = {
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      enrollmentRequestedAt: new Date().toISOString(),
      enrollmentStatus: 'enrolled',
    }
    await submitEnrollment(record)
  }

  return (
    <AppShell
      title="교육 신청 연동"
      description="추천 과정을 선택하면 신청 후 이력 페이지에서 상태를 확인할 수 있습니다."
    >
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
            <a className="secondary-btn link-btn" href="https://example.com" rel="noreferrer" target="_blank">
              이캠퍼스 신청 페이지 열기
            </a>
            <button className="primary-btn" onClick={() => void requestEnrollment()} type="button">
              신청 완료 처리
            </button>
            <Link className="primary-btn link-btn" to="/history">
              이력 확인하기
            </Link>
          </div>
          <p className="hint-text">
            신청 완료 처리 버튼을 누르면 이력 페이지에서 등록 상태를 바로 확인할 수 있습니다.
          </p>
        </section>
      )}
    </AppShell>
  )
}
