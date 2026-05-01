'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'

import { syncAuthSession } from '@/lib/auth-client'
import { fetchAdminCoursesPayload, importAdminCourses, type AdminCourse } from '@/lib/admin-client'
import { AdminBottomFooter } from '@/components/admin-bottom-footer'
import { AdminTopNav } from '@/components/admin-top-nav'

type TemplateRow = {
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

const TEMPLATE_HEADERS = [
  '카테고리1',
  '카테고리2',
  '과정명',
  '프리뷰URL',
  '미리보기',
  '학습시간',
  '콘텐츠수',
  '강사',
  '평가유무',
  '요약',
  '학습목표',
  '학습대상',
] as const

function normalizeRows(rows: Record<string, unknown>[]) {
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

function parseWorkbook(file: File): Promise<TemplateRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = reader.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          range: 1,
          defval: '',
        })
        resolve(normalizeRows(rows))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export function AdminCourseUploadScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof syncAuthSession>>['profile'] | null>(null)
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [selectedFileName, setSelectedFileName] = useState('')
  const [rows, setRows] = useState<TemplateRow[]>([])
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void syncAuthSession()
      .then(async (session) => {
        if (!session.authenticated || session.role !== 'admin') {
          router.replace('/login?next=%2Fadmin%2Fquestions')
          return
        }
        setProfile(session.profile)
        const payload = await fetchAdminCoursesPayload()
        setCourses(payload.courses)
      })
      .catch(() => {
        setError('관리자 세션을 확인하지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [router])

  const samplePreview = useMemo(() => rows.slice(0, 5), [rows])

  async function handleFileChange(file: File | null) {
    if (!file) return
    setError('')
    setMessage('')
    try {
      const parsed = await parseWorkbook(file)
      setRows(parsed)
      setSelectedFileName(file.name)
      if (!parsed.length) {
        setError('업로드할 과정 행이 없습니다. 양식 헤더와 데이터 행을 확인해 주세요.')
      }
    } catch {
      setRows([])
      setSelectedFileName(file.name)
      setError('엑셀 파일을 읽지 못했습니다. 샘플 양식과 동일한 구조인지 확인해 주세요.')
    }
  }

  async function handleUpload() {
    if (!rows.length) {
      setError('먼저 업로드할 엑셀 파일을 선택해 주세요.')
      return
    }

    setUploading(true)
    setError('')
    setMessage('')
    try {
      await importAdminCourses({ rows, replace: replaceExisting })
      const payload = await fetchAdminCoursesPayload()
      setCourses(payload.courses)
      setMessage(`${rows.length}개 과정을 업로드했습니다. 이후 역량 진단 추천은 이 과정 데이터를 기준으로 계산됩니다.`)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '과정 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="app-bootstrap-loading">과정 관리 화면을 준비하는 중입니다...</div>
  }

  return (
    <>
      <AdminTopNav profile={profile} />
      <div className="admin-content-shell">
        <main className="admin-settings-shell" style={{ maxWidth: 1280 }}>
          <section className="panel">
            <p className="eyebrow">과정 관리</p>
            <h1>온라인 과정 데이터 업로드</h1>
            <p>샘플 양식에 맞춘 엑셀을 업로드하면 과정 데이터가 실 DB에 반영되고, 이후 역량 진단 기반 추천 과정 계산에 사용됩니다.</p>
          </section>

          <section className="panel" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>업로드 양식</h2>
                <p style={{ margin: '8px 0 0', color: '#64748b' }}>샘플 파일과 동일한 헤더 순서로 업로드해 주세요.</p>
              </div>
              <a
                className="auth-shell-btn auth-shell-btn-primary"
                download
                href="/downloads/course_list_sample.xlsx"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                양식 샘플 다운로드
              </a>
            </div>
            <div style={{ marginTop: 20, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {TEMPLATE_HEADERS.map((header) => (
                      <th key={header} style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {TEMPLATE_HEADERS.map((header) => (
                      <td key={header} style={{ padding: '12px 14px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                        {header === '학습목표' || header === '학습대상' ? '여러 줄 가능' : '필드 입력'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>엑셀 업로드</h2>
                <p style={{ margin: '8px 0 0', color: '#64748b' }}>현재 파일: {selectedFileName || '선택된 파일 없음'}</p>
              </div>
              <label className="auth-shell-btn auth-shell-btn-secondary" style={{ cursor: 'pointer' }}>
                파일 선택
                <input
                  accept=".xlsx,.xls"
                  hidden
                  onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                checked={replaceExisting}
                id="replace-existing-courses"
                onChange={(event) => setReplaceExisting(event.target.checked)}
                type="checkbox"
              />
              <label htmlFor="replace-existing-courses">기존 과정 데이터를 모두 교체하고 업로드</label>
            </div>

            {message ? <p style={{ marginTop: 16, color: '#166534', fontWeight: 700 }}>{message}</p> : null}
            {error ? <p style={{ marginTop: 16, color: '#b91c1c', fontWeight: 700 }}>{error}</p> : null}

            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="auth-shell-btn auth-shell-btn-primary" disabled={uploading || !rows.length} onClick={() => void handleUpload()} type="button">
                {uploading ? '업로드 중...' : '업로드 시작'}
              </button>
              <button className="auth-shell-btn auth-shell-btn-secondary" onClick={() => router.push('/admin/users')} type="button">
                다음 메뉴 보기
              </button>
            </div>
          </section>

          <section className="panel" style={{ marginTop: 20 }}>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>업로드 미리보기</h2>
            <p style={{ margin: '8px 0 16px', color: '#64748b' }}>감지된 행 수: {rows.length}개</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>카테고리1</th>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>카테고리2</th>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>과정명</th>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>학습시간</th>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>강사</th>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>평가유무</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePreview.length ? samplePreview.map((row, index) => (
                    <tr key={`${row.courseTitle}-${index}`}>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{row.category1}</td>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{row.category2}</td>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{row.courseTitle}</td>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{row.durationText}</td>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{row.instructor}</td>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{row.hasAssessment}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '20px 14px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                        업로드된 파일을 읽으면 여기에서 미리보기를 확인할 수 있습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" style={{ marginTop: 20 }}>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>현재 과정 DB 현황</h2>
            <p style={{ margin: '8px 0 16px', color: '#64748b' }}>현재 추천 계산에 사용 중인 과정 수: {courses.length}개</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>과정명</th>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>영역</th>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>난이도</th>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>학습시간</th>
                    <th style={{ padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.slice(0, 10).map((course) => (
                    <tr key={course.id}>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{course.title}</td>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{course.category}</td>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{course.level}</td>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{course.durationHours}h</td>
                      <td style={{ padding: '12px 14px', border: '1px solid #e2e8f0' }}>{course.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      <AdminBottomFooter />
    </>
  )
}
