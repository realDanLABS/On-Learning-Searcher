'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

import { syncAuthSession } from '@/lib/auth-client'
import { importAdminCourses } from '@/lib/admin-client'
import { AdminBottomFooter } from '@/components/admin-bottom-footer'
import { AdminTemplateScreen } from '@/components/admin-template-screen'
import { AdminTopNav } from '@/components/admin-top-nav'

const COURSE_UPLOAD_HISTORY_KEY = 'on_learning_admin_course_upload_history_v1'

type UploadHistoryItem = {
  fileName: string
  uploadedAt: string
  processedCount: number
  status: 'success' | 'fail'
  detail: string
}

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
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

function getDefaultUploadHistory(): UploadHistoryItem[] {
  return []
}

function readUploadHistory() {
  if (typeof window === 'undefined') return getDefaultUploadHistory()
  try {
    const raw = window.localStorage.getItem(COURSE_UPLOAD_HISTORY_KEY)
    if (!raw) return getDefaultUploadHistory()
    const parsed = JSON.parse(raw) as UploadHistoryItem[]
    return Array.isArray(parsed) && parsed.length ? parsed : getDefaultUploadHistory()
  } catch {
    return getDefaultUploadHistory()
  }
}

function writeUploadHistory(history: UploadHistoryItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COURSE_UPLOAD_HISTORY_KEY, JSON.stringify(history))
}

export function AdminQuestionCourseUploadScreen() {
  const router = useRouter()
  const templateRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof syncAuthSession>>['profile'] | null>(null)
  const [rows, setRows] = useState<TemplateRow[]>([])
  const [selectedFileName, setSelectedFileName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploadCompleted, setUploadCompleted] = useState(false)
  const [recentUploads, setRecentUploads] = useState<UploadHistoryItem[]>([])

  useEffect(() => {
    setRecentUploads(readUploadHistory())
  }, [])

  useEffect(() => {
    void syncAuthSession()
      .then(async (session) => {
        if (!session.authenticated || session.role !== 'admin') {
          router.replace('/login?next=%2Fadmin%2Fquestions')
          return
        }
        setProfile(session.profile)
      })
      .catch(() => {
        setError('관리자 세션을 확인하지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [router])

  const helperText = useMemo(() => {
    if (error) return error
    if (message) return message
    if (selectedFileName && rows.length) return `${selectedFileName} · ${rows.length}개 과정 행 준비 완료`
    if (selectedFileName) return `${selectedFileName} · 업로드 가능한 과정 행이 없습니다`
    return '샘플 양식과 같은 구조의 CSV/XLSX 파일을 선택해 주세요.'
  }, [error, message, rows.length, selectedFileName])

  useEffect(() => {
    const hideTemplateSections = () => {
      const root = templateRef.current ?? document.body
      const uploadSection = root.querySelector('[data-course-upload-section="1"]')
      if (uploadSection instanceof HTMLElement) uploadSection.style.display = 'none'
      const historySection = root.querySelector('[data-course-upload-history="1"]')
      if (historySection instanceof HTMLElement) historySection.style.display = 'none'
      const footerText = Array.from(root.querySelectorAll('p, a, span')).find((node) =>
        (node.textContent || '').includes('© 2023 Company Corp. All rights reserved.'),
      )
      if (footerText) {
        const footerContainer = footerText.closest('footer') || footerText.closest('div, section')
        if (footerContainer instanceof HTMLElement) footerContainer.style.display = 'none'
      }
    }

    const timer = window.setTimeout(hideTemplateSections, 250)
    return () => window.clearTimeout(timer)
  }, [])

  async function handleFileChange(file: File | null) {
    if (!file) return
    setError('')
    setMessage('')
    setUploadCompleted(false)
    try {
      const parsed = await parseWorkbook(file)
      setRows(parsed)
      setSelectedFileName(file.name)
      if (!parsed.length) {
        setError('업로드할 과정 데이터가 없습니다. 샘플 양식과 동일한 구조인지 확인해 주세요.')
      }
    } catch {
      setRows([])
      setSelectedFileName(file.name)
      setError('엑셀 파일을 읽지 못했습니다. 샘플 양식과 동일한 구조인지 확인해 주세요.')
    }
  }

  async function handleTemplateDownload() {
    setError('')
    setMessage('')
    try {
      await downloadTemplateSample()
    } catch {
      setError('양식 샘플 다운로드에 실패했습니다.')
    }
  }

  async function handleStartUpload() {
    if (!rows.length) {
      setError('먼저 양식에 맞는 엑셀 파일을 선택해 주세요.')
      return
    }
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const result = await importAdminCourses({ rows, replace: true })
      const importedCount = result.importedCount ?? rows.length
      const nextHistory = [
        {
          fileName: selectedFileName || '업로드_과정목록.xlsx',
          uploadedAt: new Date().toISOString(),
          processedCount: importedCount,
          status: 'success' as const,
          detail: `${importedCount.toLocaleString('ko-KR')}건 처리됨`,
        },
        ...recentUploads,
      ].slice(0, 10)
      setRecentUploads(nextHistory)
      writeUploadHistory(nextHistory)
      setUploadCompleted(true)
      setMessage(`${importedCount}개 과정을 업로드했습니다. 이후 추천 과정 계산에 바로 반영됩니다.`)
    } catch (uploadError) {
      setUploadCompleted(false)
      setError(uploadError instanceof Error ? uploadError.message : '과정 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="app-bootstrap-loading">관리자 화면을 준비하는 중입니다...</div>
  }

  return (
    <>
      <AdminTopNav profile={profile} />
      <div className="admin-content-shell">
        <div ref={templateRef}>
          <AdminTemplateScreen file="13-admin-questions.html" />
        </div>
        <div className="max-w-[1242px] mx-auto w-full px-6 md:px-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">온라인 과정 데이터 업로드</h3>
                <button
                  className="text-sm font-semibold text-[#002C5F] flex items-center gap-1 hover:underline"
                  onClick={() => void handleTemplateDownload()}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  양식 샘플 다운로드 (CSV/Excel)
                </button>
              </div>
              <button
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center group hover:border-[#ec5b13] transition-all cursor-pointer bg-transparent"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#ec5b13]/10 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-[#ec5b13]">upload_file</span>
                </div>
                <p className="text-slate-900 font-bold mb-1">
                  {uploadCompleted ? '파일이 업로드 되었습니다' : '파일을 드래그하여 업로드하세요'}
                </p>
                <p className="text-slate-500 text-sm mb-4">
                  {uploadCompleted ? `${selectedFileName || '업로드 파일'} 업로드가 완료되었습니다` : '또는 컴퓨터에서 파일 선택 (최대 10MB)'}
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-slate-100 rounded text-xs text-slate-500">CSV 지원</span>
                  <span className="px-3 py-1 bg-slate-100 rounded text-xs text-slate-500">XLSX 지원</span>
                </div>
              </button>
              <div className="mt-4 rounded-xl border px-4 py-3 text-sm font-semibold" style={{ color: error ? '#b42318' : '#334155', background: error ? '#fff5f5' : message ? '#f0fdf4' : '#f8fafc', borderColor: error ? '#fecaca' : message ? '#bbf7d0' : '#e2e8f0' }}>
                {helperText}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  className="px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all inline-flex items-center gap-2 text-white"
                  disabled={uploading}
                  onClick={() => void handleStartUpload()}
                  style={{ background: '#ec5b13', opacity: uploading ? 0.7 : 1, cursor: uploading ? 'wait' : 'pointer' }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">{uploading ? 'hourglass_top' : uploadCompleted ? 'check_circle' : 'upload'}</span>
                  <span>{uploading ? '업로드 중' : uploadCompleted ? '업로드 완료' : '업로드 시작'}</span>
                </button>
              </div>
            </section>
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-4">최근 업로드 이력</h3>
              <div className="flex-1 space-y-4">
                {recentUploads.slice(0, 3).map((item) => {
                  const isSuccess = item.status === 'success'
                  return (
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100" key={`${item.fileName}-${item.uploadedAt}`}>
                      <div className="flex items-center gap-3">
                        <div className={`${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} p-2 rounded`}>
                          <span className="material-symbols-outlined">{isSuccess ? 'description' : 'error'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.fileName}</p>
                          <p className="text-xs text-slate-500">{formatUploadTimestamp(item.uploadedAt)} · {item.detail}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded border ${isSuccess ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        {isSuccess ? 'Success' : 'Fail'}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-[#002C5F] transition-colors" type="button">
                  전체 이력 보기
                </button>
              </div>
            </section>
          </div>
        </div>
        <input
          accept=".csv,.xls,.xlsx"
          hidden
          onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
        />
      </div>
      <AdminBottomFooter />
    </>
  )
}
