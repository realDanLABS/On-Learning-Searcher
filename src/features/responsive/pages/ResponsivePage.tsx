import { AppShell } from '../../../shared/layouts/AppShell'

export function ResponsivePage() {
  return (
    <AppShell
      title="반응형 최적화"
      description="데스크톱/태블릿/모바일 기준 화면 적응성 검증 페이지입니다."
    >
      <section className="hero-card">
        <h2>다음 구현 항목</h2>
        <ul>
          <li>Breakpoint별 레이아웃 점검</li>
          <li>터치 영역/가독성 점검</li>
          <li>핵심 플로우 회귀 테스트 시나리오</li>
        </ul>
      </section>
    </AppShell>
  )
}
