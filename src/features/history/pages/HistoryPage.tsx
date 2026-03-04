import { AppShell } from '../../../shared/layouts/AppShell'

export function HistoryPage() {
  return (
    <AppShell
      title="진단 결과 및 학습 이력"
      description="구성원의 성장 추적을 위한 대시보드 영역입니다."
    >
      <section className="hero-card">
        <h2>다음 구현 항목</h2>
        <ul>
          <li>진단 결과 타임라인</li>
          <li>수강 이력/완료율 차트</li>
          <li>최근 3개월 성장 포인트</li>
        </ul>
      </section>
    </AppShell>
  )
}
