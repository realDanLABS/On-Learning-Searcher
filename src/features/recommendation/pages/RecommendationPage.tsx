import { AppShell } from '../../../shared/layouts/AppShell'

export function RecommendationPage() {
  return (
    <AppShell
      title="맞춤 교육 추천"
      description="추천 알고리즘 결과를 목록/상세로 보여줄 페이지입니다."
    >
      <section className="hero-card">
        <h2>다음 구현 항목</h2>
        <ul>
          <li>추천 점수/태그 기반 카드 UI</li>
          <li>필터(직무, 난이도, 소요 시간)</li>
          <li>추천 근거(Why this course) 노출</li>
        </ul>
      </section>
    </AppShell>
  )
}
