import { AppShell } from '../../../shared/layouts/AppShell'

const checkpoints = [
  { viewport: '1440px', status: 'OK', note: '데스크톱 카드/테이블 3열 확인' },
  { viewport: '1024px', status: 'OK', note: '네비 래핑 및 카드 간격 유지' },
  { viewport: '768px', status: 'CHECK', note: 'CTA 버튼 줄바꿈/터치영역 확인' },
  { viewport: '390px', status: 'CHECK', note: '표/칩 overflow 및 폰트 가독성 확인' },
]

export function ResponsivePage() {
  return (
    <AppShell
      title="반응형 최적화"
      description="핵심 페이지의 디바이스별 품질 점검 현황입니다."
    >
      <section className="hero-card">
        <h2>체크리스트</h2>
        <p>랜딩, 진단, 추천, 신청, 이력, 챗봇의 6개 화면을 기준으로 점검합니다.</p>
      </section>

      <section className="feature-grid">
        {checkpoints.map((item) => (
          <article className="feature-card" key={item.viewport}>
            <h3>{item.viewport}</h3>
            <p>상태: {item.status}</p>
            <p>{item.note}</p>
          </article>
        ))}
      </section>

      <section className="hero-card">
        <h2>반응형 원칙</h2>
        <ul>
          <li>핵심 CTA는 첫 화면에서 항상 보이도록 유지</li>
          <li>모바일에서 카드/표는 세로 스택 우선</li>
          <li>터치 타겟 최소 44px 유지</li>
        </ul>
      </section>
    </AppShell>
  )
}
