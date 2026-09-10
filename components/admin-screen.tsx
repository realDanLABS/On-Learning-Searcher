'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'

import { competencyAreaLabels } from '@/lib/diagnosis'
import { logoutSession, syncAuthSession, type UserProfile } from '@/lib/auth-client'
import {
  createAdminCourse,
  createAdminFaq,
  createAdminNotice,
  createAdminQuestion,
  deleteAdminCourse,
  deleteAdminFaq,
  deleteAdminNotice,
  deleteAdminQuestion,
  deleteAdminUser,
  fetchAdminBoardsPayload,
  fetchAdminCoursesPayload,
  fetchAdminDashboardPayload,
  fetchAdminDepartmentsPayload,
  fetchAdminQuestionsPayload,
  fetchAdminUsersPayload,
  importAdminCourses,
  updateAdminCourse,
  updateAdminFaq,
  updateAdminNotice,
  updateAdminQuestion,
  updateAdminUser,
  type AdminCourse,
  type AdminDashboardPayload,
  type AdminDepartment,
  type AdminFaq,
  type AdminNotice,
  type AdminQuestion,
  type AdminUser,
} from '@/lib/admin-client'

type AdminSection = 'dashboard' | 'departments' | 'questions' | 'courses' | 'users' | 'boards' | 'settings'

type NoticeFormState = { title: string; summary: string; category: string }
type FaqFormState = { question: string; answer: string }
type QuestionFormState = { title: string; category: string }
type CourseFormState = {
  courseTitle: string
  competencyArea: string
  level: '입문' | '중급' | '심화'
  durationHours: number
  summary: string
}
type CourseImportRow = {
  category1: string
  category2: string
  courseTitle: string
  previewUrl: string
  previewLabel: string
  durationText: string
  contentCount: number | string
  instructor: string
  hasAssessment: string
  summary: string
  objectives: string
  targetAudience: string
}
type UserFormState = {
  name: string
  division: string
  team: string
  interestCourse: string
  role: 'employee' | 'manager' | 'admin'
}

const adminNavItems: Array<{ href: string; label: string; section: AdminSection }> = [
  { href: '/admin', label: '대시보드', section: 'dashboard' },
  { href: '/admin/departments', label: '부서 분석', section: 'departments' },
  { href: '/admin/questions', label: '문항 관리', section: 'questions' },
  { href: '/admin/courses', label: '과정 관리', section: 'courses' },
  { href: '/admin/users', label: '회원 관리', section: 'users' },
  { href: '/admin/boards', label: '공지 / FAQ', section: 'boards' },
  { href: '/admin/settings', label: '시스템 설정', section: 'settings' },
]

const defaultNoticeForm: NoticeFormState = { title: '', summary: '', category: '운영 공지' }
const defaultFaqForm: FaqFormState = { question: '', answer: '' }
const defaultQuestionForm: QuestionFormState = { title: '', category: 'aiAutomation' }
const defaultCourseForm: CourseFormState = { courseTitle: '', competencyArea: 'aiAutomation', level: '입문', durationHours: 4, summary: '' }
const defaultUserForm: UserFormState = { name: '', division: '', team: '', interestCourse: '', role: 'employee' }

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  downloadText(filename, `\uFEFF${csv}`, 'text/csv;charset=utf-8;')
}

async function downloadCourseTemplateSample() {
  const response = await fetch('/downloads/course_list_sample.xlsx')
  if (!response.ok) throw new Error('template-download-failed')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'course_list_sample.xlsx'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function normalizeCourseImportRowsFromSheet(rows: Record<string, unknown>[]) {
  return rows
    .map((row) => {
      const contentCountValue = row['콘텐츠수']
      return {
        category1: String(row['카테고리1'] ?? '').trim(),
        category2: String(row['카테고리2'] ?? '').trim(),
        courseTitle: String(row['과정명'] ?? '').trim(),
        previewUrl: String(row['프리뷰URL'] ?? '').trim(),
        previewLabel: String(row['미리보기'] ?? '').trim(),
        durationText: String(row['학습시간'] ?? '').trim(),
        contentCount: typeof contentCountValue === 'number' ? contentCountValue : String(contentCountValue ?? '').trim(),
        instructor: String(row['강사'] ?? '').trim(),
        hasAssessment: String(row['평가유무'] ?? '').trim(),
        summary: String(row['요약'] ?? '').trim(),
        objectives: String(row['학습목표'] ?? '').trim(),
        targetAudience: String(row['학습대상'] ?? '').trim(),
      }
    })
    .filter((row) => row.courseTitle)
}

function parseCourseImportWorkbook(file: File): Promise<CourseImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 1, defval: '' })
        resolve(normalizeCourseImportRowsFromSheet(rows))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

function labelForSection(section: AdminSection) {
  return adminNavItems.find((item) => item.section === section)?.label ?? '관리'
}

export function AdminScreen({ section }: { section: AdminSection }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState<AdminDashboardPayload | null>(null)
  const [departments, setDepartments] = useState<AdminDepartment[]>([])
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [notices, setNotices] = useState<AdminNotice[]>([])
  const [faqs, setFaqs] = useState<AdminFaq[]>([])
  const [noticeForm, setNoticeForm] = useState<NoticeFormState>(defaultNoticeForm)
  const [faqForm, setFaqForm] = useState<FaqFormState>(defaultFaqForm)
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(defaultQuestionForm)
  const [courseForm, setCourseForm] = useState<CourseFormState>(defaultCourseForm)
  const [userForm, setUserForm] = useState<UserFormState>(defaultUserForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorKind, setEditorKind] = useState<'notice' | 'faq' | 'question' | 'course' | 'user' | null>(null)
  const [courseImportRows, setCourseImportRows] = useState<CourseImportRow[]>([])
  const [courseImportFileName, setCourseImportFileName] = useState('')
  const [replaceExistingCourses, setReplaceExistingCourses] = useState(false)
  const [courseImportMessage, setCourseImportMessage] = useState('')
  const [courseImporting, setCourseImporting] = useState(false)

  const loadCurrentSection = useCallback(async () => {
    setError('')
    try {
      if (section === 'dashboard') {
        setDashboard(await fetchAdminDashboardPayload())
      } else if (section === 'departments') {
        setDepartments((await fetchAdminDepartmentsPayload()).departments)
      } else if (section === 'questions') {
        setQuestions((await fetchAdminQuestionsPayload()).questions)
      } else if (section === 'courses') {
        setCourses((await fetchAdminCoursesPayload()).courses)
      } else if (section === 'users') {
        setUsers((await fetchAdminUsersPayload()).users)
      } else if (section === 'boards') {
        const payload = await fetchAdminBoardsPayload()
        setNotices(payload.notices)
        setFaqs(payload.faqs)
      } else if (section === 'settings') {
        const [dashboardPayload, departmentPayload, questionPayload, coursePayload, userPayload, boardPayload] = await Promise.all([
          fetchAdminDashboardPayload(),
          fetchAdminDepartmentsPayload(),
          fetchAdminQuestionsPayload(),
          fetchAdminCoursesPayload(),
          fetchAdminUsersPayload(),
          fetchAdminBoardsPayload(),
        ])
        setDashboard(dashboardPayload)
        setDepartments(departmentPayload.departments)
        setQuestions(questionPayload.questions)
        setCourses(coursePayload.courses)
        setUsers(userPayload.users)
        setNotices(boardPayload.notices)
        setFaqs(boardPayload.faqs)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '관리 데이터를 불러오지 못했습니다.')
    }
  }, [section])

  const handleCourseImportFile = useCallback(async (file: File | null) => {
    if (!file) return
    setError('')
    setCourseImportMessage('')
    try {
      const parsed = await parseCourseImportWorkbook(file)
      setCourseImportRows(parsed)
      setCourseImportFileName(file.name)
      if (!parsed.length) {
        setError('업로드할 과정 데이터가 없습니다. 샘플 양식과 동일한 구조인지 확인해 주세요.')
      }
    } catch {
      setCourseImportRows([])
      setCourseImportFileName(file.name)
      setError('엑셀 파일을 읽지 못했습니다. 샘플 양식과 동일한 구조인지 확인해 주세요.')
    }
  }, [])

  const submitCourseImport = useCallback(async () => {
    if (!courseImportRows.length) {
      setError('먼저 업로드할 엑셀 파일을 선택해 주세요.')
      return
    }
    setCourseImporting(true)
    setError('')
    setCourseImportMessage('')
    try {
      await importAdminCourses({ rows: courseImportRows, replace: replaceExistingCourses })
      await loadCurrentSection()
      setCourseImportMessage(`${courseImportRows.length}개 과정 업로드가 완료되었습니다.`)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : '과정 업로드에 실패했습니다.')
    } finally {
      setCourseImporting(false)
    }
  }, [courseImportRows, loadCurrentSection, replaceExistingCourses])

  useEffect(() => {
    void syncAuthSession()
      .then((session) => {
        if (!session.authenticated || !session.profile) {
          router.replace(`/login?next=${encodeURIComponent(pathname || '/admin')}`)
          return
        }
        if (session.role !== 'admin') {
          setError('현재 관리자 API는 admin 권한으로만 접근할 수 있습니다.')
        }
        setProfile(session.profile)
        return loadCurrentSection()
      })
      .finally(() => setReady(true))
  }, [loadCurrentSection, pathname, router, section])

  async function handleLogout() {
    await logoutSession()
    router.push('/')
  }

  function closeEditor() {
    setEditingId(null)
    setEditorKind(null)
    setNoticeForm(defaultNoticeForm)
    setFaqForm(defaultFaqForm)
    setQuestionForm(defaultQuestionForm)
    setCourseForm(defaultCourseForm)
    setUserForm(defaultUserForm)
  }

  async function submitNotice() {
    if (editingId) {
      await updateAdminNotice(editingId, noticeForm)
    } else {
      await createAdminNotice(noticeForm)
    }
    closeEditor()
    await loadCurrentSection()
  }

  async function submitFaq() {
    if (editingId) {
      await updateAdminFaq(editingId, faqForm)
    } else {
      await createAdminFaq(faqForm)
    }
    closeEditor()
    await loadCurrentSection()
  }

  async function submitQuestion() {
    const payload = {
      title: questionForm.title,
      category: questionForm.category,
      options: [
        { label: '전혀 그렇지 않다', value: 1 },
        { label: '가끔 그렇다', value: 2 },
        { label: '대체로 그렇다', value: 3 },
        { label: '항상 그렇다', value: 4 },
      ],
    }
    if (editingId) {
      await updateAdminQuestion(editingId, payload)
    } else {
      await createAdminQuestion(payload)
    }
    closeEditor()
    await loadCurrentSection()
  }

  async function submitCourse() {
    const payload = {
      ...courseForm,
      objectives: ['핵심 개념 정리', '현업 적용 포인트 확보'],
      targetAudience: ['회사 구성원'],
      expectedOutcomes: ['추천 과정 확대'],
      reasonTags: ['관리자추가'],
      recommendedBy: 'role-fit',
    }
    if (editingId) {
      await updateAdminCourse(editingId, payload)
    } else {
      await createAdminCourse(payload)
    }
    closeEditor()
    await loadCurrentSection()
  }

  async function submitUser() {
    if (!editingId) return
    await updateAdminUser(editingId, userForm)
    closeEditor()
    await loadCurrentSection()
  }

  const settingsSnapshot = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      dashboard,
      departments,
      questions,
      courses,
      users,
      notices,
      faqs,
    }),
    [courses, dashboard, departments, faqs, notices, questions, users],
  )

  if (!ready) {
    return <div className="panel">관리자 화면을 준비하는 중입니다...</div>
  }

  return (
    <section className="admin-shell">
      <header className="admin-header panel">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1>{labelForSection(section)}</h1>
          <p>{profile ? `${profile.name} · ${profile.organization}` : '관리자 세션을 확인하고 있습니다.'}</p>
        </div>
        <div className="action-row">
          <Link className="secondary-link" href="/">
            학습자 페이지
          </Link>
          <button className="primary-link button-reset" type="button" onClick={() => void handleLogout()}>
            로그아웃
          </button>
        </div>
      </header>

      <nav className="admin-nav panel" aria-label="관리자 메뉴">
        {adminNavItems.map((item) => (
          <Link key={item.href} className={pathname === item.href ? 'admin-tab active' : 'admin-tab'} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      {error ? <div className="panel"><p className="error-text">{error}</p></div> : null}

      {section === 'dashboard' && dashboard ? (
        <div className="results-grid">
          <div className="panel results-span-2">
            <h2>운영 핵심 지표</h2>
            <div className="results-kpis">
              {dashboard.kpis.map((item) => (
                <article key={item.label} className="preview-card">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <span>{item.delta}</span>
                </article>
              ))}
            </div>
            <div className="course-list">
              <article className="course-card">
                <p className="course-badge">퍼널</p>
                <div className="analytics-bars">
                  {dashboard.funnel.map((item) => (
                    <div key={item.label} className="analytics-row">
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.percent}%</span>
                      </div>
                      <div className="diag-progress">
                        <div className="diag-progress-bar" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
              <article className="course-card">
                <p className="course-badge">운영 인사이트</p>
                {dashboard.insights.map((item) => (
                  <div key={item.title} className="compact-stack">
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </article>
            </div>
          </div>
          <div className="panel">
            <h2>빠른 액션</h2>
            <div className="admin-list">
              {dashboard.urgentActions.map((item) => <p key={item}>{item}</p>)}
            </div>
            <div className="action-row">
              <button
                className="secondary-link button-reset"
                type="button"
                onClick={() =>
                  downloadCsv('on-learning-admin-dashboard.csv', [
                    ['구분', '항목', '값'],
                    ...dashboard.kpis.map((item) => ['KPI', item.label, item.value]),
                    ...dashboard.funnel.map((item) => ['퍼널', item.label, `${item.percent}%`]),
                  ])
                }
              >
                CSV 내보내기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {section === 'departments' ? (
        <div className="panel">
          <div className="section-head">
            <h2>부서 참여 현황</h2>
            <button
              className="secondary-link button-reset"
              type="button"
              onClick={() =>
                downloadCsv('on-learning-admin-departments.csv', [
                  ['부서', '인원', '참여율', '완료율', '평균 점수'],
                  ...departments.map((item) => [item.name, String(item.users), `${item.participation}%`, `${item.completion}%`, `${item.avgScore}점`]),
                ])
              }
            >
              CSV 내보내기
            </button>
          </div>
          <div className="table-shell">
            <table className="data-table">
              <thead><tr><th>부서</th><th>인원</th><th>참여율</th><th>완료율</th><th>평균 점수</th></tr></thead>
              <tbody>
                {departments.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.users}</td>
                    <td>{item.participation}%</td>
                    <td>{item.completion}%</td>
                    <td>{item.avgScore}점</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {section === 'questions' ? (
        <div className="panel">
          <div className="section-head">
            <h2>진단 문항 관리</h2>
            <button className="primary-link button-reset" type="button" onClick={() => setEditorKind('question')}>
              문항 추가
            </button>
          </div>
          <div className="table-shell">
            <table className="data-table">
              <thead><tr><th>순번</th><th>영역</th><th>문항</th><th>상태</th><th>작업</th></tr></thead>
              <tbody>
                {questions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.order}</td>
                    <td>{item.area}</td>
                    <td>{item.title}</td>
                    <td>{item.status}</td>
                    <td className="table-actions">
                      <button className="secondary-link button-reset" type="button" onClick={() => {
                        setEditingId(item.id)
                        setEditorKind('question')
                        setQuestionForm({ title: item.title, category: item.categoryKey })
                      }}>수정</button>
                      <button className="secondary-link button-reset" type="button" onClick={() => void deleteAdminQuestion(item.id).then(loadCurrentSection)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {section === 'courses' ? (
        <div className="panel">
          <div className="section-head">
            <h2>추천 과정 관리</h2>
            <div className="action-row compact">
              <button
                className="secondary-link button-reset"
                type="button"
                onClick={() => {
                  void downloadCourseTemplateSample().catch(() => {
                    setError('양식 샘플 다운로드에 실패했습니다.')
                  })
                }}
              >
                양식 샘플 다운로드
              </button>
              <button className="primary-link button-reset" type="button" onClick={() => setEditorKind('course')}>
                과정 추가
              </button>
            </div>
          </div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="section-head">
              <div>
                <h2>온라인 과정 데이터 업로드</h2>
                <p>{courseImportFileName ? `현재 파일: ${courseImportFileName}` : '샘플 양식에 맞는 XLSX 파일을 업로드하세요.'}</p>
              </div>
            </div>
            <div className="action-row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="secondary-link button-reset" style={{ cursor: 'pointer' }}>
                엑셀 파일 선택
                <input
                  hidden
                  accept=".xlsx,.xls"
                  type="file"
                  onChange={(event) => void handleCourseImportFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <label className="secondary-link button-reset" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={replaceExistingCourses}
                  onChange={(event) => setReplaceExistingCourses(event.target.checked)}
                />
                기존 과정 데이터 교체
              </label>
              <button
                className="button-reset"
                type="button"
                onClick={() => void submitCourseImport()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #2563eb',
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  opacity: courseImporting || !courseImportRows.length ? 0.55 : 1,
                }}
                disabled={courseImporting || !courseImportRows.length}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload</span>
                <span>{courseImporting ? '업로드 중...' : '업로드 시작'}</span>
              </button>
            </div>
            {courseImportMessage ? <p className="success-text">{courseImportMessage}</p> : null}
            {courseImportRows.length ? (
              <div className="table-shell" style={{ marginTop: 16 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>카테고리1</th>
                      <th>카테고리2</th>
                      <th>과정명</th>
                      <th>학습시간</th>
                      <th>강사</th>
                      <th>평가유무</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseImportRows.slice(0, 5).map((row, index) => (
                      <tr key={`${row.courseTitle}-${index}`}>
                        <td>{row.category1}</td>
                        <td>{row.category2}</td>
                        <td>{row.courseTitle}</td>
                        <td>{row.durationText}</td>
                        <td>{row.instructor}</td>
                        <td>{row.hasAssessment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
          <div className="table-shell">
            <table className="data-table">
              <thead><tr><th>과정명</th><th>영역</th><th>레벨</th><th>시간</th><th>이용자</th><th>작업</th></tr></thead>
              <tbody>
                {courses.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.category}</td>
                    <td>{item.level}</td>
                    <td>{item.durationHours}h</td>
                    <td>{item.users}</td>
                    <td className="table-actions">
                      <button className="secondary-link button-reset" type="button" onClick={() => {
                        setEditingId(item.id)
                        setEditorKind('course')
                        setCourseForm({
                          courseTitle: item.title,
                          competencyArea: item.competencyArea,
                          level: item.level,
                          durationHours: item.durationHours,
                          summary: item.summary,
                        })
                      }}>수정</button>
                      <button className="secondary-link button-reset" type="button" onClick={() => void deleteAdminCourse(item.id).then(loadCurrentSection)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {section === 'users' ? (
        <div className="panel">
          <div className="section-head">
            <h2>회원 관리</h2>
          </div>
          <div className="table-shell">
            <table className="data-table">
              <thead><tr><th>이름</th><th>사번</th><th>조직</th><th>권한</th><th>상태</th><th>작업</th></tr></thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.employeeId}</td>
                    <td>{item.division} / {item.team}</td>
                    <td>{item.role}</td>
                    <td>{item.status}</td>
                    <td className="table-actions">
                      <button className="secondary-link button-reset" type="button" onClick={() => {
                        setEditingId(item.id)
                        setEditorKind('user')
                        setUserForm({
                          name: item.name,
                          division: item.division,
                          team: item.team,
                          interestCourse: item.interestCourse,
                          role: item.role,
                        })
                      }}>수정</button>
                      <button className="secondary-link button-reset" type="button" onClick={() => void deleteAdminUser(item.id).then(loadCurrentSection)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {section === 'boards' ? (
        <div className="results-grid">
          <div className="panel">
            <div className="section-head">
              <h2>공지 관리</h2>
              <button className="primary-link button-reset" type="button" onClick={() => setEditorKind('notice')}>
                공지 추가
              </button>
            </div>
            <div className="admin-stack">
              {notices.map((item) => (
                <article key={item.id} className="course-card">
                  <p className="course-badge">{item.category}</p>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <span>{item.date}</span>
                  <div className="action-row compact">
                    <button className="secondary-link button-reset" type="button" onClick={() => {
                      setEditingId(item.id)
                      setEditorKind('notice')
                      setNoticeForm({ title: item.title, summary: item.summary, category: item.category })
                    }}>수정</button>
                    <button className="secondary-link button-reset" type="button" onClick={() => void deleteAdminNotice(item.id).then(loadCurrentSection)}>삭제</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="section-head">
              <h2>FAQ 관리</h2>
              <button className="primary-link button-reset" type="button" onClick={() => setEditorKind('faq')}>
                FAQ 추가
              </button>
            </div>
            <div className="admin-stack">
              {faqs.map((item) => (
                <article key={item.id} className="course-card">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                  <div className="action-row compact">
                    <button className="secondary-link button-reset" type="button" onClick={() => {
                      setEditingId(item.id)
                      setEditorKind('faq')
                      setFaqForm({ question: item.question, answer: item.answer })
                    }}>수정</button>
                    <button className="secondary-link button-reset" type="button" onClick={() => void deleteAdminFaq(item.id).then(loadCurrentSection)}>삭제</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {section === 'settings' ? (
        <div className="results-grid">
          <div className="panel results-span-2">
            <h2>운영 스냅샷</h2>
            <div className="results-kpis">
              <article className="preview-card"><span>부서 수</span><strong>{departments.length}</strong><span>분석 가능</span></article>
              <article className="preview-card"><span>문항 수</span><strong>{questions.length}</strong><span>진단 운영 중</span></article>
              <article className="preview-card"><span>과정 수</span><strong>{courses.length}</strong><span>추천 카탈로그</span></article>
            </div>
            <div className="action-row">
              <button className="secondary-link button-reset" type="button" onClick={() => downloadText('on-learning-admin-snapshot.json', JSON.stringify(settingsSnapshot, null, 2), 'application/json;charset=utf-8;')}>
                스냅샷 내보내기
              </button>
              <button className="secondary-link button-reset" type="button" onClick={() => void loadCurrentSection()}>
                상태 새로고침
              </button>
            </div>
          </div>
          <div className="panel">
            <h2>운영 바로가기</h2>
            <div className="admin-list">
              <Link href="/admin/users">회원 관리 열기</Link>
              <Link href="/admin/questions">문항 관리 열기</Link>
              <Link href="/admin/courses">과정 관리 열기</Link>
              <Link href="/admin/boards">공지 / FAQ 열기</Link>
            </div>
          </div>
        </div>
      ) : null}

      {editorKind ? (
        <div className="modal-backdrop" onClick={closeEditor}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <h2>{editorKind === 'notice' ? '공지 편집' : editorKind === 'faq' ? 'FAQ 편집' : editorKind === 'question' ? '문항 편집' : editorKind === 'course' ? '과정 편집' : '회원 편집'}</h2>
              <button className="secondary-link button-reset" type="button" onClick={closeEditor}>닫기</button>
            </div>

            {editorKind === 'notice' ? (
              <div className="form-grid">
                <label className="field"><span>카테고리</span><input value={noticeForm.category} onChange={(event) => setNoticeForm((current) => ({ ...current, category: event.target.value }))} /></label>
                <label className="field"><span>제목</span><input value={noticeForm.title} onChange={(event) => setNoticeForm((current) => ({ ...current, title: event.target.value }))} /></label>
                <label className="field field-full"><span>요약</span><textarea value={noticeForm.summary} onChange={(event) => setNoticeForm((current) => ({ ...current, summary: event.target.value }))} /></label>
                <button className="primary-link button-reset" type="button" onClick={() => void submitNotice()}>저장</button>
              </div>
            ) : null}

            {editorKind === 'faq' ? (
              <div className="form-grid">
                <label className="field field-full"><span>질문</span><input value={faqForm.question} onChange={(event) => setFaqForm((current) => ({ ...current, question: event.target.value }))} /></label>
                <label className="field field-full"><span>답변</span><textarea value={faqForm.answer} onChange={(event) => setFaqForm((current) => ({ ...current, answer: event.target.value }))} /></label>
                <button className="primary-link button-reset" type="button" onClick={() => void submitFaq()}>저장</button>
              </div>
            ) : null}

            {editorKind === 'question' ? (
              <div className="form-grid">
                <label className="field">
                  <span>진단 영역</span>
                  <select value={questionForm.category} onChange={(event) => setQuestionForm((current) => ({ ...current, category: event.target.value }))}>
                    {Object.entries(competencyAreaLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="field field-full"><span>문항 내용</span><input value={questionForm.title} onChange={(event) => setQuestionForm((current) => ({ ...current, title: event.target.value }))} /></label>
                <button className="primary-link button-reset" type="button" onClick={() => void submitQuestion()}>저장</button>
              </div>
            ) : null}

            {editorKind === 'course' ? (
              <div className="form-grid">
                <label className="field field-full"><span>과정명</span><input value={courseForm.courseTitle} onChange={(event) => setCourseForm((current) => ({ ...current, courseTitle: event.target.value }))} /></label>
                <label className="field">
                  <span>역량 영역</span>
                  <select value={courseForm.competencyArea} onChange={(event) => setCourseForm((current) => ({ ...current, competencyArea: event.target.value }))}>
                    {Object.entries(competencyAreaLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>레벨</span>
                  <select value={courseForm.level} onChange={(event) => setCourseForm((current) => ({ ...current, level: event.target.value as CourseFormState['level'] }))}>
                    <option value="입문">입문</option>
                    <option value="중급">중급</option>
                    <option value="심화">심화</option>
                  </select>
                </label>
                <label className="field">
                  <span>시간</span>
                  <input type="number" value={courseForm.durationHours} onChange={(event) => setCourseForm((current) => ({ ...current, durationHours: Number(event.target.value || 0) }))} />
                </label>
                <label className="field field-full"><span>요약</span><textarea value={courseForm.summary} onChange={(event) => setCourseForm((current) => ({ ...current, summary: event.target.value }))} /></label>
                <button className="primary-link button-reset" type="button" onClick={() => void submitCourse()}>저장</button>
              </div>
            ) : null}

            {editorKind === 'user' ? (
              <div className="form-grid">
                <label className="field"><span>이름</span><input value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <label className="field"><span>본부</span><input value={userForm.division} onChange={(event) => setUserForm((current) => ({ ...current, division: event.target.value }))} /></label>
                <label className="field"><span>팀</span><input value={userForm.team} onChange={(event) => setUserForm((current) => ({ ...current, team: event.target.value }))} /></label>
                <label className="field"><span>관심 과정</span><input value={userForm.interestCourse} onChange={(event) => setUserForm((current) => ({ ...current, interestCourse: event.target.value }))} /></label>
                <label className="field">
                  <span>권한</span>
                  <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as UserFormState['role'] }))}>
                    <option value="employee">employee</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <button className="primary-link button-reset" type="button" onClick={() => void submitUser()}>저장</button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
