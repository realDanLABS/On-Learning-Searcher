import { Link } from 'react-router-dom'

import { AppShell } from '../shared/layouts/AppShell'
import { featureRoutes } from './routeConfig'

export function HomePage() {
  return (
    <AppShell
      title="온러닝서처 Foundation"
      description="PRD 핵심 기능을 병렬 개발할 수 있도록 기본 골격을 준비한 상태입니다."
    >
      <section className="hero-card">
        <h2>프로젝트 시작 상태</h2>
        <p>
          현재 화면은 Foundation 브랜치에서 만든 공통 셸입니다. 각 기능 브랜치에서
          이 레이아웃을 재사용해 UI/기능을 확장하면 됩니다.
        </p>
      </section>

      <section className="feature-grid">
        {featureRoutes.map((route) => (
          <article className="feature-card" key={route.path}>
            <h3>{route.label}</h3>
            <p>{route.description}</p>
            <Link to={route.path}>기능 페이지 열기</Link>
          </article>
        ))}
      </section>
    </AppShell>
  )
}
