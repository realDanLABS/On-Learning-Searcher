'use client'

import Link from 'next/link'

export function SiteFooter({
  className = 'mt-12',
  portalLabel = '관리자',
  portalHref = '/admin',
}: {
  className?: string
  portalLabel?: string
  portalHref?: string
}) {
  return (
    <footer
      className={className}
      style={{
        marginTop: 48,
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        padding: '28px 24px',
      }}
    >
      <div
        style={{
          width: 'min(1280px, 100%)',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            filter: 'grayscale(1)',
            opacity: 0.58,
            color: '#0f172a',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span>HYUNDAI WIA</span>
        </div>
        <p
          style={{
            margin: 0,
            flex: '1 1 420px',
            minWidth: 280,
            color: '#94a3b8',
            fontSize: 12,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
            © 2026 HYUNDAI WIA Corp. All rights reserved. On Learning Searcher는 현대위아 구성원의 맞춤화된 학습과 성장을 위해 제작되었습니다.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
            <button
              onClick={() => window.alert('개인정보처리방침 문서는 준비 중입니다.')}
              style={{
                border: 0,
                background: 'transparent',
                padding: 0,
                color: '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
              }}
              type="button"
            >
              개인정보처리방침
            </button>
            <button
              onClick={() => window.alert('이용약관 문서는 준비 중입니다.')}
              style={{
                border: 0,
                background: 'transparent',
                padding: 0,
                color: '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
              }}
              type="button"
            >
              이용약관
            </button>
            <Link
              href={portalHref}
              style={{
                color: '#94a3b8',
                fontSize: 12,
              }}
            >
              {portalLabel}
            </Link>
        </div>
      </div>
    </footer>
  )
}
