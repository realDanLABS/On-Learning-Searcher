import { AppShell } from '../../../shared/layouts/AppShell'

export function CourseLinkingPage() {
  return (
    <AppShell
      title="교육 신청 연동"
      description="추천 과정에서 신청 페이지로 자연스럽게 연결하는 영역입니다."
    >
      <section className="hero-card">
        <h2>다음 구현 항목</h2>
        <ul>
          <li>외부 신청 링크 연결 및 파라미터 관리</li>
          <li>신청 가능 여부 상태 표시</li>
          <li>신청 후 복귀 플로우</li>
        </ul>
      </section>
    </AppShell>
  )
}
