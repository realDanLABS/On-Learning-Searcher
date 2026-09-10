'use client'

import Link from 'next/link'

export function AdminBottomFooter() {
  return (
    <footer className="admin-bottom-footer">
      <div className="admin-bottom-footer-inner">
        <div className="admin-bottom-footer-brand">Company</div>
        <p className="admin-bottom-footer-text">
          © 2026 Company Corp. All rights reserved. On Learning Searcher는 회사 구성원의 맞춤화된 학습과 성장을 위해 제작되었습니다.
        </p>
        <div className="admin-bottom-footer-links">
          <button
            className="admin-bottom-footer-link"
            onClick={() => window.alert('개인정보처리방침 문서는 준비 중입니다.')}
            type="button"
          >
            개인정보처리방침
          </button>
          <button
            className="admin-bottom-footer-link"
            onClick={() => window.alert('이용약관 문서는 준비 중입니다.')}
            type="button"
          >
            이용약관
          </button>
          <Link className="admin-bottom-footer-link" href="/">
            학습자
          </Link>
        </div>
      </div>
    </footer>
  )
}
