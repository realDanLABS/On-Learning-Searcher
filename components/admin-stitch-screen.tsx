'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { syncAuthSession } from '@/lib/auth-client'
import { AdminDepartmentsScreen } from '@/components/admin-departments-screen'
import { AdminBottomFooter } from '@/components/admin-bottom-footer'
import { AdminTemplateScreen } from '@/components/admin-template-screen'
import { AdminTopNav } from '@/components/admin-top-nav'

type AdminSection = 'dashboard' | 'departments' | 'questions' | 'courses' | 'users' | 'boards' | 'settings'

const fileMap: Record<Exclude<AdminSection, 'settings'>, string> = {
  dashboard: '11-admin-dashboard.html',
  departments: '12-admin-departments.html',
  questions: '13-admin-questions.html',
  courses: '14-admin-courses.html',
  users: '15-admin-users.html',
  boards: '16-admin-boards.html',
}

export function AdminStitchScreen({ section }: { section: AdminSection }) {
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void syncAuthSession()
      .then(async (currentSession) => {
        setSession(currentSession)
        if (!currentSession.authenticated || currentSession.role !== 'admin') {
          router.replace('/login?next=%2Fadmin')
          return null
        }
        return currentSession
      })
      .finally(() => setLoading(false))
  }, [router, section])

  if (section === 'settings') {
    return (
      <>
        <AdminTopNav profile={session?.profile} />
        <div className="admin-content-shell">
          <section className="panel">
            <p className="eyebrow">관리자 설정</p>
            <h1>시스템 설정</h1>
            <p>관리자 공통 UI를 먼저 원본 기준으로 복원했습니다. 설정 상세 화면도 같은 기준으로 이어서 맞출 수 있습니다.</p>
          </section>
        </div>
        <AdminBottomFooter />
      </>
    )
  }

  if (section === 'departments') {
    return (
      <>
        <AdminTopNav profile={session?.profile} />
        <div className="admin-content-shell">
          <AdminDepartmentsScreen />
        </div>
        <AdminBottomFooter />
      </>
    )
  }

  if (loading) {
    return <div className="app-bootstrap-loading">관리자 화면을 준비하는 중입니다...</div>
  }

  return (
    <>
      <AdminTopNav profile={session?.profile} />
      <div className="admin-content-shell">
        <AdminTemplateScreen file={fileMap[section]} />
      </div>
      <AdminBottomFooter />
    </>
  )
}
