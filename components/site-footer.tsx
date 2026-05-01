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
    <footer className={`bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <span className="text-[12px] font-bold">HYUNDAI WIA</span>
          </div>
          <p className="text-[12px] text-slate-400 text-center">
            © 2026 HYUNDAI WIA Corp. All rights reserved. On Learning Searcher는 현대위아 구성원의 맞춤화된 학습과 성장을 위해 제작되었습니다.
          </p>
          <div className="flex gap-6">
            <button
              className="text-[12px] text-slate-400 hover:text-primary"
              onClick={() => window.alert('개인정보처리방침 문서는 준비 중입니다.')}
              type="button"
            >
              개인정보처리방침
            </button>
            <button
              className="text-[12px] text-slate-400 hover:text-primary"
              onClick={() => window.alert('이용약관 문서는 준비 중입니다.')}
              type="button"
            >
              이용약관
            </button>
            <Link className="text-[12px] text-slate-400 hover:text-primary" href={portalHref}>
              {portalLabel}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
