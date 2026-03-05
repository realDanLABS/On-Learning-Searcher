import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

import { featureRoutes } from '../../router/routeConfig'

type AppShellProps = {
  title: string
  description: string
  children: ReactNode
}

export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">HYUNDAI WIA</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Link className="home-link" to="/">
          홈으로
        </Link>
      </header>

      <nav className="feature-nav" aria-label="주요 기능 이동">
        {featureRoutes.map((route) => (
          <NavLink
            className={({ isActive }) =>
              isActive ? 'feature-link active' : 'feature-link'
            }
            key={route.path}
            to={route.path}
          >
            {route.label}
          </NavLink>
        ))}
      </nav>

      <main className="content">{children}</main>
    </div>
  )
}
