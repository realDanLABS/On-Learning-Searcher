'use client'

import { useEffect, type ReactNode } from 'react'
import { SiteFooter } from '@/components/site-footer'
import { UserTopNav } from '@/components/user-top-nav'

type AuthShellProps = {
  title: string
  description: string
  eyebrow?: string
  hidePageHeader?: boolean
  children: ReactNode
}

export function AuthShell({
  title,
  description,
  eyebrow = 'On Learning Searcher',
  hidePageHeader = false,
  children,
}: AuthShellProps) {
  useEffect(() => {
    document.body.classList.add('body-auth-plain')

    return () => {
      document.body.classList.remove('body-auth-plain')
    }
  }, [])

  return (
    <div className="auth-page-shell">
      <UserTopNav loginHref="/login" signupHref="/signup" />
      <div className="app-shell flat-chrome auth-page-main">
        <div className="shell-frame flat-chrome">
        {hidePageHeader ? null : (
          <section className="shell-page-header compact">
            <div className="shell-page-copy">
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </section>
        )}

          <div className={hidePageHeader ? 'auth-shell-content auth-shell-content-centered' : 'auth-shell-content'}>
            {children}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
