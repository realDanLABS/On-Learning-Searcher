'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { syncAuthSession } from '@/lib/auth-client'
import { clearIdentity, getDisplayUser } from '@/lib/stitch-ui'
import { UserTopNav } from '@/components/user-top-nav'

export function PlatformIntroScreen() {
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)

  useEffect(() => {
    void syncAuthSession()
      .then(setSession)
      .catch(() => setSession(null))
  }, [])

  const user = getDisplayUser(session?.profile)
  return (
    <div className="home-react-page">
      <UserTopNav
        activeRoute="/platform-intro"
        authenticated={Boolean(session?.authenticated)}
        loginHref="/login?next=%2Fplatform-intro"
        onLogout={async () => {
          await clearIdentity()
          router.push('/')
        }}
        organization={user.organization}
        role={session?.role}
        signupHref="/signup?next=%2Fplatform-intro"
        userName={user.name}
      />

      <main className="platform-react-main">
        <section className="platform-react-hero">
          <small>On Learning Searcher</small>
          <h1>현대위아 구성원의 진단, 추천, 신청, 이력을 한 흐름으로 연결합니다.</h1>
          <p>역량 진단부터 맞춤 추천, 학습 경로, 수강 신청, 이력 확인까지 하나의 서비스 안에서 끊김 없이 이어집니다.</p>
        </section>

        <section className="platform-react-grid">
          {[
            ['역량 진단', '직무 역량을 5개 영역으로 나눠 현재 상태를 빠르게 파악합니다.'],
            ['맞춤 추천', '진단 결과와 역할 기준으로 우선순위가 높은 과정을 추천합니다.'],
            ['학습 경로', '선택한 과정과 다음 학습 단계를 개인 로드맵으로 제공합니다.'],
            ['운영 관리', '관리자 화면에서 과정, 회원, 문항, 공지 데이터를 직접 관리합니다.'],
          ].map(([title, description]) => (
            <article className="platform-react-card" key={title}>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>

        <section className="platform-react-band">
          <div>
            <h2>핵심 운영 원칙</h2>
            <ul>
              <li>실데이터 기반 추천과 관리자 운영</li>
              <li>학습 여정 단계별 상태 관리</li>
              <li>사내 운영에 맞는 간결한 엔터프라이즈 UI</li>
            </ul>
          </div>
          <div className="platform-react-actions">
            <button onClick={() => router.push('/diagnosis')} type="button">역량 진단 시작</button>
            <button onClick={() => router.push('/recommendation')} type="button">추천 과정 보기</button>
          </div>
        </section>
      </main>
    </div>
  )
}
