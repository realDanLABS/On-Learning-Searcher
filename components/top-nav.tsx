import Link from 'next/link'

const navItems = [
  { href: '/', label: '홈' },
  { href: '/diagnosis', label: '역량 진단' },
  { href: '/learning-path', label: '학습 경로' },
  { href: '/recommendation', label: '추천 과정' },
  { href: '/history', label: '나의 학습' },
  { href: '/chatbot', label: '챗봇 상담' },
  { href: '/platform-intro', label: '플랫폼 소개' },
  { href: '/analytics', label: '운영 분석' },
  { href: '/login', label: '로그인' },
  { href: '/signup', label: '회원가입' },
]

export function TopNav() {
  return (
    <header className="top-nav">
      <Link className="brand" href="/">
        <span className="brand-badge">Company</span>
        <span>On Learning Searcher Next</span>
      </Link>
      <nav className="nav-links" aria-label="주요 이동">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
