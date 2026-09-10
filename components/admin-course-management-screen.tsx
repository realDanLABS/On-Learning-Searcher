'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

import { syncAuthSession } from '@/lib/auth-client'
import { fetchAdminCourseImportHistory, fetchAdminCoursesPayload, importAdminCourses, type AdminCourse, type AdminCourseImportHistoryItem } from '@/lib/admin-client'
import { AdminBottomFooter } from '@/components/admin-bottom-footer'
import { AdminTemplateScreen } from '@/components/admin-template-screen'
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
        const workbook = XLSX.read(reader.result, { type: 'array' })
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

function downloadCoursesCsv(courses: AdminCourse[]) {
  const rows = [
    ['과정명', '영역', '난이도', '학습시간', '상태'],
    ...courses.map((course) => [course.title, course.category, course.level, `${course.durationHours}`, course.status]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'admin_courses_export.csv'
  link.click()
  URL.revokeObjectURL(url)
}

async function downloadTemplateSample() {
  const response = await fetch('/downloads/course_list_sample.xlsx')
  if (!response.ok) {
    throw new Error('template-download-failed')
  }
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

function formatUploadTimestamp(isoString: string) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

export function AdminCourseManagementScreen() {
  const router = useRouter()
  const templateRef = useRef<HTMLDivElement | null>(null)
  const uploadSectionRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof syncAuthSession>>['profile'] | null>(null)
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [selectedFileName, setSelectedFileName] = useState('')
  const [rows, setRows] = useState<TemplateRow[]>([])
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [recentUploads, setRecentUploads] = useState<AdminCourseImportHistoryItem[]>([])

  useEffect(() => {
    void syncAuthSession()
      .then(async (session) => {
        if (!session.authenticated || session.role !== 'admin') {
          router.replace('/login?next=%2Fadmin%2Fcourses')
          return
        }
        setProfile(session.profile)
        const [payload, history] = await Promise.all([
          fetchAdminCoursesPayload(),
          fetchAdminCourseImportHistory().catch(() => []),
        ])
        setCourses(payload.courses)
        setRecentUploads(history)
      })
      .catch(() => {
        setError('관리자 세션을 확인하지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    const host = templateRef.current
    if (!host) return

    const bindTemplateButtons = () => {
      const buttons = Array.from(host.querySelectorAll('button'))
      const uploadButton = buttons.find((button) => (button.textContent || '').includes('과정 데이터 업로드'))
      const exportButton = buttons.find((button) => (button.textContent || '').includes('목록 내보내기'))

      if (uploadButton && uploadButton.dataset.boundUpload !== '1') {
        uploadButton.dataset.boundUpload = '1'
        uploadButton.style.background = '#ec5b13'
        uploadButton.style.borderColor = '#ec5b13'
        uploadButton.style.color = '#ffffff'
        uploadButton.style.boxShadow = '0 10px 24px rgba(236, 91, 19, 0.22)'
        uploadButton.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">upload</span><span>과정 데이터 업로드</span>'
        uploadButton.addEventListener('click', (event) => {
          event.preventDefault()
          uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }

      if (exportButton && exportButton.dataset.boundExport !== '1') {
        exportButton.dataset.boundExport = '1'
        exportButton.addEventListener('click', (event) => {
          event.preventDefault()
          downloadCoursesCsv(courses)
        })
      }

      const footerText = Array.from(host.querySelectorAll('p, span, a')).find((node) =>
        (node.textContent || '').includes('© 2023 Company Corp. All rights reserved.'),
      )
      if (footerText) {
        const footerContainer = footerText.closest('footer, div, section')
        if (footerContainer instanceof HTMLElement) {
          footerContainer.style.display = 'none'
        }
      }

      Array.from(host.querySelectorAll('a, button, span')).forEach((node) => {
        const text = (node.textContent || '').trim()
        if (text === '개인정보처리방침' || text === '시스템 문의') {
          const target = node.closest('a, button, div, li')
          if (target instanceof HTMLElement) {
            target.style.display = 'none'
          }
        }
      })
    }

    const observer = new MutationObserver(() => bindTemplateButtons())
    observer.observe(host, { childList: true, subtree: true })
    bindTemplateButtons()
    return () => observer.disconnect()
  }, [courses])

  const samplePreview = useMemo(() => rows.slice(0, 5), [rows])
  const helperText = useMemo(() => {
    if (error) return error
    if (message) return message
    if (selectedFileName && rows.length) return `${selectedFileName} · ${rows.length}개 과정 행 준비 완료`
    if (selectedFileName) return `${selectedFileName} · 업로드 가능한 과정 행이 없습니다`
    return '샘플 양식과 동일한 구조의 엑셀 파일을 선택해 주세요.'
  }, [error, message, rows.length, selectedFileName])

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
      await importAdminCourses({ rows, replace: replaceExisting, fileName: selectedFileName || 'course_list_sample.xlsx' })
      const [payload, history] = await Promise.all([
        fetchAdminCoursesPayload(),
        fetchAdminCourseImportHistory().catch(() => []),
      ])
      setCourses(payload.courses)
      setRecentUploads(history)
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
        <div ref={templateRef}>
          <AdminTemplateScreen file="14-admin-courses.html" />
        </div>

        <main className="admin-settings-shell" ref={uploadSectionRef} style={{ maxWidth: 1280, paddingTop: 0 }}>
          <section className="panel admin-course-upload-shell">
            <div className="admin-course-upload-header">
              <div>
                <p className="eyebrow admin-course-upload-eyebrow">온라인 과정 데이터 업로드</p>
                <h2 className="admin-course-upload-heading">양식 샘플 다운로드 및 업로드</h2>
                <p className="admin-course-upload-description">과정 엑셀을 선택하고 즉시 검수한 뒤 업로드 이력까지 같은 화면에서 관리할 수 있습니다.</p>
              </div>
            </div>
            <div className="admin-course-upload-grid-pad">
              <section className="admin-course-upload-stage">
                <div className="admin-course-upload-grid">
                  <section className="admin-course-upload-card admin-course-upload-card-accent">
                    <div className="admin-course-upload-card-head">
                      <div className="admin-course-upload-card-head-main">
                        <div className="admin-course-upload-icon">
                          <span className="material-symbols-outlined">upload_file</span>
                        </div>
                        <div>
                          <h3 className="admin-course-upload-card-title">엑셀 업로드</h3>
                          <p className="admin-course-upload-card-copy">좌측 카드에서 파일 선택과 업로드를 바로 처리합니다.</p>
                        </div>
                      </div>
                      <button
                        className="admin-course-upload-btn admin-course-upload-btn-secondary"
                        onClick={() => {
                          void downloadTemplateSample().catch(() => {
                            setError('양식 샘플 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
                          })
                        }}
                        type="button"
                      >
                        <span>양식 샘플</span>
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </div>

                    <input
                      accept=".xlsx,.xls"
                      hidden
                      onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
                      ref={fileInputRef}
                      type="file"
                    />

                    <button
                      className="admin-course-upload-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <span className="material-symbols-outlined admin-course-upload-dropzone-icon">cloud_upload</span>
                      <strong className="admin-course-upload-dropzone-title">엑셀 파일 선택</strong>
                      <span className="admin-course-upload-dropzone-copy">{selectedFileName || '.xlsx / .xls 파일을 선택하세요'}</span>
                    </button>

                    <div className={`admin-course-upload-status ${error ? 'is-error' : message ? 'is-success' : ''}`}>
                      <p>{helperText}</p>
                    </div>

                    <div className="admin-course-upload-check">
                      <input
                        checked={replaceExisting}
                        id="replace-existing-courses-inline"
                        onChange={(event) => setReplaceExisting(event.target.checked)}
                        type="checkbox"
                      />
                      <label htmlFor="replace-existing-courses-inline">기존 과정 데이터를 모두 교체하고 업로드</label>
                    </div>

                    <div className="admin-course-upload-metrics">
                      <div className="admin-course-upload-metric">
                        <p>준비된 행</p>
                        <strong>{rows.length}</strong>
                      </div>
                      <div className="admin-course-upload-metric">
                        <p>현재 파일</p>
                        <strong className="is-file">{selectedFileName || '선택된 파일 없음'}</strong>
                      </div>
                    </div>

                    <div className="admin-course-upload-action">
                      <button
                        className="admin-course-upload-btn admin-course-upload-btn-primary"
                        disabled={uploading || !rows.length}
                        onClick={() => void handleUpload()}
                        type="button"
                      >
                        <span className="material-symbols-outlined">upload</span>
                        <span>{uploading ? '업로드 중...' : '업로드 시작'}</span>
                      </button>
                    </div>
                  </section>

                  <div className="admin-course-upload-side">
                    <section className="admin-course-upload-card">
                      <div className="admin-course-upload-panel-head">
                        <div>
                          <h3 className="admin-course-upload-card-title">업로드 미리보기</h3>
                          <p className="admin-course-upload-card-copy">감지된 행 수: {rows.length}개</p>
                        </div>
                        <span className="admin-course-upload-panel-tag">상위 5개 행 표시</span>
                      </div>

                      <div className="admin-course-upload-table-wrap">
                        <table className="admin-course-upload-table">
                          <thead>
                            <tr>
                              {TEMPLATE_HEADERS.slice(0, 6).map((header) => (
                                <th key={header}>{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {samplePreview.length ? samplePreview.map((row, index) => (
                              <tr key={`${row.courseTitle}-${index}`}>
                                <td>{row.category1}</td>
                                <td>{row.category2}</td>
                                <td className="is-strong">{row.courseTitle}</td>
                                <td>{row.previewUrl}</td>
                                <td>{row.previewLabel}</td>
                                <td>{row.durationText}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td className="is-empty" colSpan={6}>
                                  업로드할 파일을 선택하면 여기에서 양식 적합성을 먼저 확인할 수 있습니다.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="admin-course-upload-card">
                      <div className="admin-course-upload-panel-head">
                        <div>
                          <h3 className="admin-course-upload-card-title">업로드 히스토리</h3>
                          <p className="admin-course-upload-card-copy">최근 업로드 이력을 최대 8건까지 보관합니다.</p>
                        </div>
                        <span className="admin-course-upload-panel-tag is-muted">{recentUploads.length}건</span>
                      </div>

                      <div className="admin-course-upload-history">
                        {recentUploads.length ? recentUploads.map((item) => (
                          <article className="admin-course-upload-history-item" key={`${item.fileName}-${item.uploadedAt}`}>
                            <div className="admin-course-upload-history-copy">
                              <strong>{item.fileName}</strong>
                              <p>{formatUploadTimestamp(item.uploadedAt)} · {item.detail}</p>
                            </div>
                            <div className="admin-course-upload-history-meta">
                              <span className={item.status === 'success' ? 'is-success' : 'is-fail'}>
                                {item.status === 'success' ? '성공' : '실패'}
                              </span>
                              <strong>{item.processedCount.toLocaleString('ko-KR')}건</strong>
                            </div>
                          </article>
                        )) : (
                          <div className="admin-course-upload-history-empty">
                            아직 저장된 업로드 이력이 없습니다.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>
      <AdminBottomFooter />
    </>
  )
}
