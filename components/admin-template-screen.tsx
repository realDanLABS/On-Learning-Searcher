'use client'

import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'

type AdminTemplateScreenProps = {
  file: string
}

type AdminUserRow = {
  id: string
  name: string
  employeeId: string
  division: string
  team: string
  email: string
  diagnosisDate: string
  status: string
  role?: string
  statusOverride?: string
}

type AdminUsersPayload = {
  users: AdminUserRow[]
  filters?: {
    divisions?: string[]
    statuses?: string[]
  }
}

type AdminDepartmentRow = {
  name: string
  users: number
  participation: number
  completion: number
  avgScore: number
}

type AdminDashboardPayload = {
  userName: string
  organization?: string
  kpis: Array<{ label: string; value: string; delta: string; tone: string; unit?: string; progress?: number }>
  funnel: Array<{ label: string; percent: number }>
  insights: Array<{ title: string; body: string }>
  urgentActions: string[]
  departmentComparisons: AdminDepartmentRow[]
  trendComparison?: Array<{ label: string; completion: number; competency: number }>
  summary?: {
    departmentCount: number
    displayedDepartments: number
  }
}

type AdminDepartmentDetailRow = {
  name: string
  users: number
  participation: number
  completion: number
  avgScore: number
  avgLearningHours: number
  topStrength: string
  statusLabel: string
  statusTone: 'emerald' | 'blue' | 'slate'
  topCourses: Array<{ title: string; count: number }>
}

type AdminDepartmentsPayload = {
  userName: string
  focusDivision: string
  filters: string[]
  kpis: Array<{ label: string; value: string; delta: string; tone: string }>
  competencyComparison: Array<{ label: string; departmentScore: number; overallScore: number }>
  topCourses: Array<{ rank: number; title: string; percent: number }>
  departments: AdminDepartmentDetailRow[]
  summary: {
    departmentCount: number
    displayedDepartments: number
  }
}

type AdminQuestionRow = {
  id: string
  order: number
  categoryKey: string
  area: string
  title: string
  date: string
  status: string
}

type AdminQuestionsPayload = {
  userName: string
  questions: AdminQuestionRow[]
}

type AdminCourseRow = {
  id: string
  title: string
  summary: string
  competencyArea: string
  category: string
  level: '입문' | '중급' | '심화'
  durationHours: number
  users: number
  status: string
}

type AdminCoursesPayload = {
  userName: string
  courses: AdminCourseRow[]
}

type AdminNoticeRow = {
  id: string
  category: string
  date: string
  title: string
  summary: string
  status?: string
  created_at?: string
  updated_at?: string
}

type AdminFaqRow = {
  id: string
  question: string
  answer: string
  status?: string
  created_at?: string
  updated_at?: string
}

type AdminBoardRow = {
  id: string
  type: 'notice' | 'faq'
  category: string
  title: string
  body: string
  date: string
  status: string
}

type AdminBoardsPayload = {
  userName: string
  notices: AdminNoticeRow[]
  faqs: AdminFaqRow[]
}

type AdminUserImportRow = {
  employeeId: string
  name: string
  division: string
  team: string
  email: string
  role: 'employee' | 'manager' | 'admin'
  interestCourse: string
  likelyFormulaArtifact?: boolean
}

declare global {
  interface Window {
    tailwind?: {
      config?: unknown
      refresh?: () => void
    }
  }
}

const ADMIN_TEMPLATE_CONFIG = `
window.tailwind = window.tailwind || {};
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#137fec",
        "navy-wia": "#002c5f",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
      },
      fontFamily: {
        "display": ["Inter"]
      },
      borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
    },
  },
}
`

function ensureHeadAsset(id: string, build: () => HTMLElement) {
  if (document.getElementById(id)) return
  const node = build()
  node.id = id
  document.head.appendChild(node)
}

function ensureAdminTemplateAssets() {
  ensureHeadAsset('admin-template-font-inter', () => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
    return link
  })

  ensureHeadAsset('admin-template-font-material', () => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
    return link
  })

  ensureHeadAsset('admin-template-base-style', () => {
    const style = document.createElement('style')
    style.textContent = `
      .admin-template-host {
        width: 100%;
      }

      .admin-template-host main {
        max-width: 1280px !important;
        width: 100% !important;
        margin: 0 auto !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        box-sizing: border-box !important;
      }

      .admin-template-host * {
        box-sizing: border-box;
      }
    `
    return style
  })

  ensureHeadAsset('admin-template-tailwind-config', () => {
    const script = document.createElement('script')
    script.textContent = ADMIN_TEMPLATE_CONFIG
    return script
  })

  ensureHeadAsset('admin-template-tailwind-play', () => {
    const script = document.createElement('script')
    script.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries'
    return script
  })
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getUserStatusTone(status: string) {
  if (status === '수강완료') {
    return {
      wrap: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      dot: 'bg-green-500',
    }
  }
  if (status === '신청완료') {
    return {
      wrap: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
    }
  }
  if (status === '확인필요') {
    return {
      wrap: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
    }
  }
  if (status === '신청실패') {
    return {
      wrap: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
    }
  }
  if (status === '진단완료') {
    return {
      wrap: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      dot: 'bg-purple-500',
    }
  }
  return {
    wrap: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
  }
}

function getUserRoleTone(role?: string) {
  if (role === 'admin') {
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  }
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

function getDepartmentStatusTone(completion: number) {
  if (completion >= 85) {
    return {
      label: '우수',
      badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      bar: 'bg-green-500',
    }
  }
  if (completion >= 70) {
    return {
      label: '정상',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      bar: 'bg-primary',
    }
  }
  return {
    label: '주의',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    bar: 'bg-amber-500',
  }
}

function getQuestionCategoryTone(categoryKey: string) {
  if (categoryKey === 'aiAutomation') {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  }
  if (categoryKey === 'dataDecision') {
    return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
  }
  if (categoryKey === 'dxInnovation') {
    return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
  }
  if (categoryKey === 'operationsQualitySafety') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  }
  if (categoryKey === 'problemCollaboration') {
    return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

function getCourseCategoryTone(category: string) {
  if (category.includes('AI') || category.includes('자동화')) {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  }
  if (category.includes('데이터')) {
    return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
  }
  if (category.includes('품질') || category.includes('안전') || category.includes('생산')) {
    return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
  }
  if (category.includes('협업') || category.includes('문제')) {
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
}

function getCourseStatusTone(status: string) {
  if (status === '운영중' || status === 'Published') {
    return { dot: 'bg-green-500', text: 'text-slate-700 dark:text-slate-300' }
  }
  if (status === '중지' || status === '비활성') {
    return { dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400' }
  }
  return { dot: 'bg-amber-500', text: 'text-slate-700 dark:text-slate-300' }
}

function toBoardRows(payload: AdminBoardsPayload): AdminBoardRow[] {
  return [
    ...payload.notices.map((notice) => ({
      id: notice.id,
      type: 'notice' as const,
      category: notice.category,
      title: notice.title,
      body: notice.summary,
      date: notice.created_at || notice.date,
      status: notice.status || '게시중',
    })),
    ...payload.faqs.map((faq) => ({
      id: faq.id,
      type: 'faq' as const,
      category: 'FAQ',
      title: faq.question,
      body: faq.answer,
      date: faq.created_at || '',
      status: faq.status || '게시중',
    })),
  ]
}

function formatKoreanDate(value: string) {
  if (!value || value === '-') return '-'
  const dateOnly = value.includes('T') ? value.split('T')[0] : value
  const normalized = dateOnly.includes('.') ? dateOnly.replaceAll('.', '-') : dateOnly
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return normalized
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}년 ${month}월 ${day}일`
}

function normalizeAdminUserImportRows(rows: Record<string, unknown>[]) {
  return rows
    .map((row) => {
      const roleText = String(row['권한'] ?? row['역할'] ?? '').trim()
      const division = String(row['본부'] ?? row['소속1'] ?? row['division'] ?? '').trim()
      const team = String(row['팀'] ?? row['소속2'] ?? row['team'] ?? '').trim()
      const employeeId = String(row['사번'] ?? row['employeeId'] ?? '').trim()
      const name = String(row['이름'] ?? row['회원정보'] ?? row['name'] ?? '').trim()
      const email = String(row['이메일'] ?? row['회사이메일'] ?? row['email'] ?? '').trim()
      const likelyFormulaArtifact = [name, division, team, email].some((value) => /\+[A-Z]+\d+/i.test(value))
      const normalizedRole =
        roleText === '관리자' || roleText === 'admin'
          ? 'admin'
          : roleText === '매니저' || roleText === 'manager'
            ? 'manager'
            : 'employee'
      return {
        employeeId,
        name,
        division,
        team,
        email,
        role: normalizedRole,
        interestCourse: String(row['관심과정'] ?? row['interestCourse'] ?? '').trim(),
        likelyFormulaArtifact,
      } satisfies AdminUserImportRow
    })
    .filter((row) => row.employeeId && row.name && row.division && row.team && row.email && !row.likelyFormulaArtifact)
    .map((row) => ({
      employeeId: row.employeeId,
      name: row.name,
      division: row.division,
      team: row.team,
      email: row.email,
      role: row.role,
      interestCourse: row.interestCourse,
    }))
}

function parseAdminUserWorkbook(file: File): Promise<AdminUserImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 1, defval: '' })
        resolve(normalizeAdminUserImportRows(rows))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

async function downloadAdminUserTemplateSample() {
  const response = await fetch('/downloads/user_list_sample.xlsx')
  if (!response.ok) throw new Error('user-template-download-failed')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'user_list_sample.xlsx'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function applyAdminUsersPayload(main: HTMLElement, payload: AdminUsersPayload) {
  const selects = Array.from(main.querySelectorAll('select'))
  const divisionSelect = selects[0]
  const statusSelect = selects[1]
  if (divisionSelect) {
    const options = ['전체 본부', ...((payload.filters?.divisions || []).filter(Boolean))]
    divisionSelect.innerHTML = options.map((label) => `<option>${escapeHtml(label)}</option>`).join('')
  }
  if (statusSelect) {
    const options = ['전체 상태', ...((payload.filters?.statuses || []).filter(Boolean))]
    statusSelect.innerHTML = options.map((label) => `<option>${escapeHtml(label)}</option>`).join('')
  }
  ;[divisionSelect, statusSelect].forEach((select) => {
    if (!select) return
    select.style.appearance = 'none'
    ;(select.style as CSSStyleDeclaration & { WebkitAppearance?: string }).WebkitAppearance = 'none'
    ;(select.style as CSSStyleDeclaration & { MozAppearance?: string }).MozAppearance = 'none'
    select.style.backgroundImage = 'none'
  })
  main.querySelectorAll('th').forEach((node) => {
    node.classList.remove('text-right')
    node.classList.add('text-center')
  })

  const tbody = main.querySelector('tbody')
  if (!tbody) return
  tbody.innerHTML = payload.users.map((user) => {
    const tone = getUserStatusTone(user.status)
    const roleTone = getUserRoleTone(user.role)
    const roleLabel = user.role === 'admin' ? '관리자' : '학습자'
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">${escapeHtml((user.name || '?').slice(0, 2))}</div>
            <div>
              <div class="flex items-center gap-2">
                <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">${escapeHtml(user.name)}</div>
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleTone}">${roleLabel}</span>
              </div>
              <div class="text-xs text-slate-500">${escapeHtml(user.email)}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-center">${escapeHtml(user.employeeId)}</td>
        <td class="px-6 py-4 text-center">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            ${escapeHtml(user.division)} / ${escapeHtml(user.team)}
          </span>
        </td>
        <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-center">${escapeHtml(formatKoreanDate(user.diagnosisDate))}</td>
        <td class="px-6 py-4 text-center">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.wrap}">
            <span class="w-1.5 h-1.5 rounded-full ${tone.dot}"></span>${escapeHtml(user.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-3">
            <button data-admin-edit-user="${escapeHtml(user.id)}" class="text-primary hover:text-primary/80 font-semibold text-sm">수정</button>
            <button data-admin-role-user="${escapeHtml(user.id)}" class="text-slate-500 hover:text-slate-900 font-semibold text-sm">권한</button>
            <button data-admin-delete-user="${escapeHtml(user.id)}" class="text-red-500 hover:text-red-600 font-semibold text-sm">삭제</button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function applyAdminDashboardPayload(main: HTMLElement, payload: AdminDashboardPayload, departments?: AdminDepartmentRow[]) {
  const activeDepartments = (departments || payload.departmentComparisons).slice(0, 5)
  const chartPalette = ['#137fec', '#00aad2', '#f59e0b', '#10b981', '#7c3aed']
  const chartCards = Array.from(main.querySelectorAll('div.grid.grid-cols-1.lg\\:grid-cols-2.gap-8.mb-8 > div'))
  const participationCard = chartCards[0] as HTMLElement | undefined
  const trendCard = chartCards[1] as HTMLElement | undefined
  main.querySelectorAll('thead th').forEach((node) => {
    node.classList.remove('text-right', 'text-left')
    node.classList.add('text-center')
  })
  const kpiCards = Array.from(main.querySelectorAll('div.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div'))
  payload.kpis.forEach((item, index) => {
    const card = kpiCards[index] as HTMLElement | undefined
    if (!card) return
    const label = card.querySelector('p.text-slate-500')
    const delta = card.querySelector('span.text-green-500, span.text-red-500, span.text-slate-500, span.text-amber-500') as HTMLElement | null
    const value = card.querySelector('p.text-3xl')
    const unit = card.querySelector('p.text-slate-400.text-xs')
    const progress = card.querySelector('div.h-full') as HTMLElement | null
    if (label) label.textContent = item.label
    if (delta) {
      delta.textContent = item.delta
      delta.className =
        item.tone === 'positive'
          ? 'text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-xs font-bold'
          : item.tone === 'danger'
            ? 'text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-xs font-bold'
            : item.tone === 'warning'
              ? 'text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-xs font-bold'
              : 'text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded text-xs font-bold'
    }
    if (value) value.textContent = item.value
    if (unit) unit.textContent = item.unit || ''
    if (progress) progress.style.width = `${Math.max(0, Math.min(100, Number(item.progress || 0)))}%`
  })

  const participationTitle = participationCard?.querySelector('h3')
  if (participationTitle) participationTitle.textContent = '부서별 회원 수'
  const maxUsers = Math.max(1, ...payload.departmentComparisons.map((department) => department.users))
  const participationList = participationCard?.querySelector('div.space-y-4') as HTMLElement | null
  if (participationList) {
    participationList.innerHTML = activeDepartments.map((department, index) => `
      <div class="flex items-center gap-4">
        <span class="text-xs font-semibold w-28 text-slate-500">${escapeHtml(department.name)}</span>
        <div class="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
          <div class="h-full rounded-full" style="width: ${Math.max(10, Math.round((department.users / maxUsers) * 100))}%; background-color: ${chartPalette[index % chartPalette.length]}"></div>
        </div>
        <span class="text-xs font-bold w-12 text-right">${department.users}명</span>
      </div>
    `).join('')
  }

  const trendTitle = trendCard?.querySelector('h3')
  if (trendTitle) trendTitle.textContent = '역량 점수 평균'
  const trendChartWrap = trendCard?.querySelector('div.h-48') as HTMLElement | null
  if (trendChartWrap) {
    const lightBlueBar = '#cfe6ff'
    trendChartWrap.className = 'h-56 flex items-end justify-between px-2 gap-4'
    trendChartWrap.style.display = 'flex'
    trendChartWrap.style.alignItems = 'flex-end'
    trendChartWrap.style.justifyContent = 'space-between'
    trendChartWrap.innerHTML = (payload.trendComparison || []).map((item) => `
      <div class="flex flex-col items-center flex-1 h-full justify-end">
        <div class="text-xs font-bold text-slate-700 mb-2">${item.competency}점</div>
        <div class="w-full flex justify-center h-full items-end">
          <div style="width: 40px; height: ${Math.max(24, Math.round((item.competency / 100) * 192))}px; background-color: ${lightBlueBar};"></div>
        </div>
        <span class="text-[10px] mt-3 text-slate-400 font-bold text-center break-keep leading-tight">${escapeHtml(item.label)}</span>
      </div>
    `).join('')
  }
  const trendLegendWrap = trendCard?.querySelector('div.flex.justify-center.gap-6.mt-6')
  if (trendLegendWrap) {
    trendLegendWrap.remove()
  }

  const tbody = main.querySelector('tbody')
  if (tbody) {
    tbody.innerHTML = activeDepartments.map((department) => {
      const tone = getDepartmentStatusTone(department.completion)
      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
          <td class="px-6 py-4 font-bold text-navy-wia dark:text-slate-200 text-left pl-11">${escapeHtml(department.name)}</td>
          <td class="px-6 py-4 text-center">${department.users}명</td>
          <td class="px-6 py-4 text-center">
            <div class="flex items-center justify-center gap-2">
              <div class="w-16 bg-slate-100 dark:bg-slate-600 h-1.5 rounded-full">
                <div class="bg-primary h-full rounded-full" style="width: ${department.participation}%"></div>
              </div>
              <span>${department.participation}%</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center justify-center gap-2">
              <div class="w-16 bg-slate-100 dark:bg-slate-600 h-1.5 rounded-full">
                <div class="${tone.bar} h-full rounded-full" style="width: ${department.completion}%"></div>
              </div>
              <span>${department.completion}%</span>
            </div>
          </td>
          <td class="px-6 py-4 font-semibold text-center">${department.avgScore}점</td>
          <td class="px-6 py-4 text-center">
            <span class="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${tone.badge}">${tone.label}</span>
          </td>
          <td class="px-6 py-4 text-center">
            <button data-admin-dashboard-detail="${escapeHtml(department.name)}" class="text-primary hover:underline font-bold">상세 보기</button>
          </td>
        </tr>
      `
    }).join('')
  }

  const summary = Array.from(main.querySelectorAll('span')).find((node) => (node.textContent || '').includes('전체'))
  const summaryWrap = summary?.closest('div.p-4') as HTMLElement | null
  if (summaryWrap && payload.summary) {
    const summaryText = summaryWrap.querySelector('span')
    if (summaryText) {
      summaryText.className = 'text-xs text-slate-500 dark:text-slate-400 pl-7 text-left'
      summaryText.textContent = `전체 ${payload.summary.departmentCount}개 본부/사업부 중 ${activeDepartments.length}개 표시`
    }
    let legend = summaryWrap.querySelector('[data-admin-dashboard-status-legend="1"]') as HTMLElement | null
    if (!legend) {
      legend = document.createElement('div')
      legend.setAttribute('data-admin-dashboard-status-legend', '1')
      legend.className = 'flex items-center gap-5 pl-5 text-xs text-slate-500 dark:text-slate-400'
      summaryWrap.insertBefore(legend, summaryWrap.lastElementChild)
    }
    legend.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">우수</span>
        <span>85% 이상</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">정상</span>
        <span>70% 이상</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">주의</span>
        <span>70% 미만</span>
      </div>
    `
  }
}

function applyAdminDepartmentsPayload(main: HTMLElement, payload: AdminDepartmentsPayload, rows?: AdminDepartmentDetailRow[]) {
  main.querySelector('header')?.remove()

  const activeRows = (rows || payload.departments).slice(0, 5)
  const sections = Array.from(main.querySelectorAll('section'))
  const filterSection = sections[0] as HTMLElement | undefined
  const kpiSection = sections[1] as HTMLElement | undefined
  const middleSection = sections[2] as HTMLElement | undefined
  const tableSection = sections[3] as HTMLElement | undefined

  if (filterSection) {
    const select = filterSection.querySelector('select')
    if (select) {
      const current = payload.focusDivision || '전체 부서'
      select.innerHTML = ['전체 부서', ...payload.filters].map((label) => `<option ${label === current ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')
    }
  }

  if (kpiSection) {
    const cards = Array.from(kpiSection.children)
    payload.kpis.forEach((item, index) => {
      const card = cards[index] as HTMLElement | undefined
      if (!card) return
      const label = card.querySelector('p.text-slate-500')
      const value = card.querySelector('h3')
      const delta = card.querySelector('span.text-xs.font-bold')
      if (label) label.textContent = item.label
      if (value) value.innerHTML = escapeHtml(item.value) + (index === 1 ? '<span class="text-lg font-normal text-slate-400 ml-1">/ 100</span>' : '')
      if (delta) {
        delta.textContent = item.delta
        delta.className = `text-xs font-bold ${item.tone === 'positive' ? 'text-emerald-500' : 'text-amber-500'} flex items-center gap-0.5`
      }
    })
  }

  if (middleSection) {
    const cards = Array.from(middleSection.children)
    const comparisonCard = cards[0] as HTMLElement | undefined
    const topCoursesCard = cards[1] as HTMLElement | undefined
    if (comparisonCard) {
      const title = comparisonCard.querySelector('h4')
      const desc = comparisonCard.querySelector('p.text-sm')
      if (title) title.textContent = '부서별 핵심 역량 수준 비교'
      if (desc) desc.textContent = payload.focusDivision ? `${payload.focusDivision} vs 전체 평균` : '전체 평균 기준 핵심 역량 분석'
      const chartWrap = comparisonCard.querySelector('.h-64') as HTMLElement | null
      if (chartWrap) {
        chartWrap.className = 'h-64 rounded-xl bg-slate-50 dark:bg-slate-900/40 p-6'
        chartWrap.innerHTML = `
          <div class="h-full flex items-end justify-between gap-4">
            ${payload.competencyComparison.map((item) => `
              <div class="flex flex-col items-center flex-1 h-full justify-end">
                <div class="text-[10px] font-bold text-slate-500 mb-2">${item.departmentScore}점</div>
                <div class="w-full flex justify-center items-end h-full gap-2">
                  <div class="rounded-t-xl bg-primary" style="width: 22px; height: ${Math.max(24, Math.round((item.departmentScore / 100) * 180))}px;"></div>
                  <div class="rounded-t-xl bg-slate-300 dark:bg-slate-600" style="width: 14px; height: ${Math.max(18, Math.round((item.overallScore / 100) * 180))}px;"></div>
                </div>
                <span class="text-[10px] mt-3 text-slate-400 font-bold text-center break-keep leading-tight">${escapeHtml(item.label)}</span>
              </div>
            `).join('')}
          </div>
          <div class="flex justify-center gap-6 mt-4">
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-primary"></span><span class="text-xs text-slate-500">${escapeHtml(payload.focusDivision || '선택 부서')}</span></div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></span><span class="text-xs text-slate-500">전체 평균</span></div>
          </div>
        `
      }
    }
    if (topCoursesCard) {
      const listWrap = topCoursesCard.querySelector('.space-y-4') as HTMLElement | null
      if (listWrap) {
        const items = payload.topCourses.length ? payload.topCourses : [{ rank: 1, title: '선택/신청 데이터가 아직 없습니다', percent: 0 }]
        listWrap.innerHTML = items.slice(0, 5).map((item) => `
          <div class="flex items-center gap-3">
            <span class="w-6 text-primary font-black italic">${String(item.rank).padStart(2, '0')}</span>
            <div class="flex-1">
              <p class="text-sm font-semibold truncate">${escapeHtml(item.title)}</p>
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-1 mt-1 rounded-full">
                <div class="bg-primary h-full rounded-full" style="width: ${Math.max(0, item.percent)}%"></div>
              </div>
            </div>
            <span class="text-xs text-slate-500">${item.percent}%</span>
          </div>
        `).join('')
      }
    }
  }

  if (tableSection) {
    const tbody = tableSection.querySelector('tbody')
    const headers = tableSection.querySelectorAll('thead th')
    if (headers[3]) headers[3].textContent = '평균 학습필요'
    if (tbody) {
      tbody.innerHTML = activeRows.map((row) => {
        const participationTone = row.participation >= 85 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : row.participation >= 70 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
        const statusTone =
          row.statusTone === 'emerald'
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : row.statusTone === 'blue'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
        return `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td class="px-6 py-4 text-sm font-semibold text-primary">${escapeHtml(row.name)}</td>
            <td class="px-6 py-4 text-sm text-center">${row.users}명</td>
            <td class="px-6 py-4 text-sm text-center">
              <span class="px-2 py-1 rounded text-xs font-bold ${participationTone}">${row.participation}%</span>
            </td>
            <td class="px-6 py-4 text-sm text-center">${row.avgLearningHours}h</td>
            <td class="px-6 py-4 text-sm">
              <div class="flex flex-wrap gap-1">
                <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium text-slate-600 dark:text-slate-400">${escapeHtml(row.topStrength)}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <span class="inline-flex px-2 py-1 rounded text-xs font-bold ${statusTone}">${escapeHtml(row.statusLabel)}</span>
            </td>
          </tr>
        `
      }).join('')
    }
  }
}

function applyAdminQuestionsPayload(main: HTMLElement, payload: AdminQuestionsPayload, rows?: AdminQuestionRow[]) {
  const activeRows = rows || payload.questions.slice(0, 5)
  main.querySelectorAll('thead th').forEach((node) => {
    node.classList.remove('text-left', 'text-right')
    node.classList.add('text-center')
  })
  const tbody = main.querySelector('table tbody')
  if (!tbody) return
  tbody.innerHTML = activeRows.map((question) => {
    const statusActive = question.status === 'active'
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
        <td class="px-6 py-4 text-sm text-slate-500 text-center">${escapeHtml(question.id.toUpperCase())}</td>
        <td class="px-6 py-4 text-center">
          <span class="${getQuestionCategoryTone(question.categoryKey)} inline-flex whitespace-nowrap px-2.5 py-1 rounded text-xs font-bold ml-3">${escapeHtml(question.area)}</span>
        </td>
        <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-medium">${escapeHtml(question.title)}</td>
        <td class="px-6 py-4 text-sm text-slate-500 text-center">${escapeHtml(formatKoreanDate(question.date))}</td>
        <td class="px-6 py-4 text-center">
          <span class="inline-flex items-center gap-1.5 text-xs font-bold ${statusActive ? 'text-green-600' : 'text-slate-400'}">
            <span class="w-1.5 h-1.5 ${statusActive ? 'bg-green-600' : 'bg-slate-400'} rounded-full"></span>
            ${statusActive ? '활성' : '비활성'}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex items-center justify-center gap-3">
            <button data-admin-question-edit="${escapeHtml(question.id)}" class="text-primary dark:text-accent font-bold text-sm hover:underline">수정</button>
            <button data-admin-question-delete="${escapeHtml(question.id)}" class="text-red-500 font-bold text-sm hover:underline">삭제</button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

function applyAdminCoursesPayload(main: HTMLElement, payload: AdminCoursesPayload, rows?: AdminCourseRow[]) {
  const activeRows = rows || payload.courses.slice(0, 5)
  const searchInput = main.querySelector('input[placeholder*="과정명"]') as HTMLInputElement | null
  const selects = Array.from(main.querySelectorAll('select')) as HTMLSelectElement[]
  const categorySelect = selects[0]
  const levelSelect = selects[1]
  const tableCard = main.querySelector('table')?.closest('div.bg-white') as HTMLDivElement | null

  if (searchInput) {
    searchInput.value = searchInput.value || ''
  }
  if (categorySelect) {
    const categories = ['전체 영역', ...Array.from(new Set(payload.courses.map((course) => course.category).filter(Boolean)))]
    categorySelect.innerHTML = categories.map((label) => `<option>${escapeHtml(label)}</option>`).join('')
  }
  if (levelSelect) {
    levelSelect.innerHTML = ['난이도 전체', '입문', '중급', '심화'].map((label) => `<option>${escapeHtml(label)}</option>`).join('')
  }
  main.querySelectorAll('thead th').forEach((node) => {
    node.classList.remove('text-right', 'text-left')
    node.classList.add('text-center')
  })
  if (tableCard) {
    tableCard.classList.remove('mx-4', 'md:mx-16')
  }

  const tbody = main.querySelector('tbody')
  if (!tbody) return
  tbody.innerHTML = activeRows.map((course) => {
    const statusTone = getCourseStatusTone(course.status)
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
        <td class="px-6 py-4">
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">${escapeHtml(course.title)}</span>
            <span class="text-xs text-slate-400">ID: ${escapeHtml(course.id)}</span>
            <span class="text-xs text-slate-400 line-clamp-1">${escapeHtml(course.summary || '')}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getCourseCategoryTone(course.category)}">${escapeHtml(course.category)}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="text-sm text-slate-600 dark:text-slate-300 font-medium">${escapeHtml(course.level)} · ${Number(course.durationHours || 0)}h</span>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="text-sm font-bold text-primary">${Number(course.users || 0).toLocaleString('ko-KR')}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <div class="size-2 rounded-full ${statusTone.dot}"></div>
            <span class="text-sm font-medium ${statusTone.text}">${escapeHtml(course.status)}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-2">
            <button data-admin-course-edit="${escapeHtml(course.id)}" class="p-1.5 text-slate-400 hover:text-primary transition-colors" aria-label="과정 수정">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button data-admin-course-delete="${escapeHtml(course.id)}" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors" aria-label="과정 삭제">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')

  const statsGrid = main.querySelector('[data-admin-courses-stats="1"]')
    || Array.from(main.querySelectorAll('div.grid')).find((node) =>
      (node.textContent || '').includes('Total Online Courses')
        && ((node.textContent || '').includes('Avg. Course Rating') || (node.textContent || '').includes('Scheduled Courses')),
    )
  if (statsGrid instanceof HTMLElement) {
    statsGrid.setAttribute('data-admin-courses-stats', '1')
    statsGrid.classList.remove('mx-4', 'md:mx-16')
  }
  const statCards = statsGrid ? Array.from(statsGrid.children) : []
  const activeCount = payload.courses.filter((course) => course.status === '운영중').length
  const scheduledCount = payload.courses.filter((course) => course.status === '게시예정').length
  const linkedCount = payload.courses.reduce((sum, course) => sum + Number(course.users || 0), 0)
  const avgDuration = payload.courses.length
    ? Math.round(payload.courses.reduce((sum, course) => sum + Number(course.durationHours || 0), 0) / payload.courses.length)
    : 0
  const stats = [
    { label: 'Total Online Courses', value: payload.courses.length.toLocaleString('ko-KR'), detail: `${activeCount.toLocaleString('ko-KR')}개 운영중` },
    { label: 'Connected Requests', value: linkedCount.toLocaleString('ko-KR'), detail: '실제 신청/연결 건수' },
    { label: 'Avg. Learning Hours', value: `${avgDuration}h`, detail: '과정 평균 학습시간' },
    { label: 'Scheduled Courses', value: scheduledCount.toLocaleString('ko-KR'), detail: '게시예정 과정 수' },
  ]
  stats.forEach((item, index) => {
    const card = statCards[index] as HTMLElement | undefined
    if (!card) return
    const value = card.querySelector('h3, p.text-2xl')
    const label = card.querySelector('p.text-xs')
    const detail = card.querySelector('span.text-green-500, span.text-blue-500, span.text-purple-500, span.text-slate-400')
    if (value) value.textContent = item.value
    if (label) label.textContent = item.label
    if (detail) detail.textContent = item.detail
  })
}

function applyAdminBoardsPayload(main: HTMLElement, payload: AdminBoardsPayload, rows?: AdminBoardRow[]) {
  const activeRows = rows || toBoardRows(payload).slice(0, 5)
  main.querySelectorAll('thead th').forEach((node) => {
    node.classList.remove('text-right', 'text-left')
    node.classList.add('text-center')
  })
  const tbody = main.querySelector('tbody')
  if (!tbody) return
  tbody.innerHTML = activeRows.map((item) => {
    const typeLabel = item.type === 'notice' ? '공지' : 'FAQ'
    const typeTone = item.type === 'notice'
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    return `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
        <td class="px-6 py-4 text-sm font-semibold text-slate-400 text-center">${escapeHtml(item.id)}</td>
        <td class="px-6 py-4 text-center">
          <span class="px-2.5 py-1 rounded-full ${typeTone} text-[10px] font-bold uppercase">${typeLabel}</span>
          <span class="ml-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">${escapeHtml(item.category)}</span>
        </td>
        <td class="px-6 py-4">
          <p class="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-md line-clamp-1">${escapeHtml(item.title)}</p>
          <p class="text-xs text-slate-400 max-w-md line-clamp-1">${escapeHtml(item.body)}</p>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
            <span class="size-1.5 rounded-full bg-green-500"></span>${escapeHtml(item.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-2">
            <button data-admin-board-edit="${escapeHtml(item.type)}:${escapeHtml(item.id)}" class="p-1.5 text-slate-400 hover:text-primary transition-colors" aria-label="항목 수정">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button data-admin-board-delete="${escapeHtml(item.type)}:${escapeHtml(item.id)}" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors" aria-label="항목 삭제">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

export function AdminTemplateScreen({ file }: AdminTemplateScreenProps) {
  const [markup, setMarkup] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [usersPayload, setUsersPayload] = useState<AdminUsersPayload | null>(null)
  const [dashboardPayload, setDashboardPayload] = useState<AdminDashboardPayload | null>(null)
  const [departmentsPayload, setDepartmentsPayload] = useState<AdminDepartmentsPayload | null>(null)
  const [questionsPayload, setQuestionsPayload] = useState<AdminQuestionsPayload | null>(null)
  const [coursesPayload, setCoursesPayload] = useState<AdminCoursesPayload | null>(null)
  const [boardsPayload, setBoardsPayload] = useState<AdminBoardsPayload | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const userImportInputRef = useRef<HTMLInputElement | null>(null)
  const [userImporting, setUserImporting] = useState(false)

  useEffect(() => {
    ensureAdminTemplateAssets()

    let cancelled = false

    const divisionQuery =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('division') || ''
        : ''

    void Promise.all([
      fetch(`/stitch-runtime/${file}`, { credentials: 'include' }),
      file === '11-admin-dashboard.html' ? fetch('/api/admin/dashboard', { credentials: 'include' }).catch(() => null) : Promise.resolve(null),
      file === '12-admin-departments.html'
        ? fetch(`/api/admin/departments${divisionQuery ? `?division=${encodeURIComponent(divisionQuery)}` : ''}`, { credentials: 'include' }).catch(() => null)
        : Promise.resolve(null),
      file === '13-admin-questions.html' ? fetch('/api/admin/questions', { credentials: 'include' }).catch(() => null) : Promise.resolve(null),
      file === '14-admin-courses.html' ? fetch('/api/admin/courses', { credentials: 'include' }).catch(() => null) : Promise.resolve(null),
      file === '15-admin-users.html' ? fetch('/api/admin/users', { credentials: 'include' }).catch(() => null) : Promise.resolve(null),
      file === '16-admin-boards.html' ? fetch('/api/admin/boards', { credentials: 'include' }).catch(() => null) : Promise.resolve(null),
    ])
      .then(async ([response, dashboardResponse, departmentsResponse, questionsResponse, coursesResponse, usersResponse, boardsResponse]) => {
        if (!response.ok) {
          throw new Error(`${response.status}`)
        }
        const html = await response.text()
        const parsed = new DOMParser().parseFromString(html, 'text/html')
        const main = parsed.querySelector('main')
        if (!main) {
          throw new Error('main-not-found')
        }
        const requiresApi = [
          '11-admin-dashboard.html',
          '12-admin-departments.html',
          '13-admin-questions.html',
          '14-admin-courses.html',
          '15-admin-users.html',
          '16-admin-boards.html',
        ].includes(file)
        if (file === '11-admin-dashboard.html' && dashboardResponse && 'ok' in dashboardResponse && dashboardResponse.ok) {
          const payload = (await dashboardResponse.json()) as AdminDashboardPayload
          setDashboardPayload(payload)
          applyAdminDashboardPayload(main as HTMLElement, payload)
        } else {
          setDashboardPayload(null)
          if (file === '11-admin-dashboard.html' && requiresApi) throw new Error('admin-dashboard-api-failed')
        }
        if (file === '12-admin-departments.html' && departmentsResponse && 'ok' in departmentsResponse && departmentsResponse.ok) {
          const payload = (await departmentsResponse.json()) as AdminDepartmentsPayload
          setDepartmentsPayload(payload)
          applyAdminDepartmentsPayload(main as HTMLElement, payload)
        } else {
          setDepartmentsPayload(null)
          if (file === '12-admin-departments.html' && requiresApi) throw new Error('admin-departments-api-failed')
        }
        if (file === '13-admin-questions.html' && questionsResponse && 'ok' in questionsResponse && questionsResponse.ok) {
          const payload = (await questionsResponse.json()) as AdminQuestionsPayload
          setQuestionsPayload(payload)
          applyAdminQuestionsPayload(main as HTMLElement, payload)
        } else {
          setQuestionsPayload(null)
          if (file === '13-admin-questions.html' && requiresApi) throw new Error('admin-questions-api-failed')
        }
        if (file === '14-admin-courses.html' && coursesResponse && 'ok' in coursesResponse && coursesResponse.ok) {
          const payload = (await coursesResponse.json()) as AdminCoursesPayload
          setCoursesPayload(payload)
          applyAdminCoursesPayload(main as HTMLElement, payload)
        } else {
          setCoursesPayload(null)
          if (file === '14-admin-courses.html' && requiresApi) throw new Error('admin-courses-api-failed')
        }
        if (file === '15-admin-users.html' && usersResponse && 'ok' in usersResponse && usersResponse.ok) {
          const payload = (await usersResponse.json()) as AdminUsersPayload
          setUsersPayload(payload)
          applyAdminUsersPayload(main as HTMLElement, payload)
        } else {
          setUsersPayload(null)
          if (file === '15-admin-users.html' && requiresApi) throw new Error('admin-users-api-failed')
        }
        if (file === '16-admin-boards.html' && boardsResponse && 'ok' in boardsResponse && boardsResponse.ok) {
          const payload = (await boardsResponse.json()) as AdminBoardsPayload
          setBoardsPayload(payload)
          applyAdminBoardsPayload(main as HTMLElement, payload)
        } else {
          setBoardsPayload(null)
          if (file === '16-admin-boards.html' && requiresApi) throw new Error('admin-boards-api-failed')
        }
        if (cancelled) return
        setMarkup(main.outerHTML)
        setError(null)
        window.setTimeout(() => {
          window.tailwind?.refresh?.()
        }, 0)
      })
      .catch(() => {
        if (cancelled) return
        setError('관리자 실데이터를 불러오지 못했습니다.')
      })

    return () => {
      cancelled = true
    }
  }, [file])

  useEffect(() => {
    if (file !== '11-admin-dashboard.html' || !dashboardPayload || !hostRef.current) return

    const host = hostRef.current
    const chartCards = Array.from(host.querySelectorAll('div.grid.grid-cols-1.lg\\:grid-cols-2.gap-8.mb-8 > div'))
    const tbody = host.querySelector('tbody') as HTMLTableSectionElement | null
    const paginationWrap = tbody?.closest('div.overflow-x-auto')?.nextElementSibling as HTMLDivElement | null
    const filterButton = Array.from(host.querySelectorAll('button')).find((node) => (node.textContent || '').includes('필터')) as HTMLButtonElement | undefined
    const sortButton = Array.from(host.querySelectorAll('button')).find((node) => (node.textContent || '').includes('정렬')) as HTMLButtonElement | undefined
    const exportButton = Array.from(host.querySelectorAll('button')).find((node) => (node.textContent || '').includes('PDF 내보내기')) as HTMLButtonElement | undefined
    const searchInput = host.querySelector('input[placeholder*="부서"]') as HTMLInputElement | null
    const participationCard = (chartCards[0] as HTMLDivElement | undefined) || null
    if (!tbody || !paginationWrap) return

    let currentPage = 1
    let chartPage = 1
    let currentFilter = '전체'
    let currentSort: 'users' | 'participation' | 'completion' | 'avgScore' = 'users'
    const pageSize = 5

    const getRows = () => {
      const keyword = (searchInput?.value || '').trim()
      return dashboardPayload.departmentComparisons
        .filter((item) => currentFilter === '전체' || item.name === currentFilter)
        .filter((item) => !keyword || item.name.includes(keyword))
        .sort((left, right) => right[currentSort] - left[currentSort])
    }

    const renderPagination = (rows: AdminDepartmentRow[], visibleCount: number) => {
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
      currentPage = Math.min(currentPage, totalPages)
      const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
      paginationWrap.innerHTML = `
        <div class="flex items-center gap-7 min-w-0">
          <span class="text-xs text-slate-500 dark:text-slate-400 pl-7 text-left">전체 ${dashboardPayload.summary?.departmentCount || rows.length}개 본부/사업부 중 ${visibleCount}개 표시</span>
          <div class="flex items-center gap-5 pl-5 text-xs text-slate-500 dark:text-slate-400">
            <div class="flex items-center gap-2">
              <span class="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">우수</span>
              <span>85% 이상</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">정상</span>
              <span>70% 이상</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">주의</span>
              <span>70% 미만</span>
            </div>
          </div>
        </div>
        <div class="flex gap-1">
          <button data-admin-dashboard-page="prev" class="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold ${currentPage === 1 ? 'opacity-50' : ''}">이전</button>
          ${pageNumbers.map((page) => `<button data-admin-dashboard-page="${page}" class="px-3 py-1 ${page === currentPage ? 'bg-primary text-white border border-primary' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200'} rounded text-xs font-bold">${page}</button>`).join('')}
          <button data-admin-dashboard-page="next" class="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold ${currentPage === totalPages ? 'opacity-50' : ''}">다음</button>
        </div>
      `
      paginationWrap.querySelectorAll('[data-admin-dashboard-page]').forEach((button) => {
        button.addEventListener('click', () => {
          const value = (button as HTMLElement).getAttribute('data-admin-dashboard-page')
          if (value === 'prev' && currentPage > 1) currentPage -= 1
          else if (value === 'next' && currentPage < totalPages) currentPage += 1
          else if (value && !Number.isNaN(Number(value))) currentPage = Number(value)
          rerender()
        })
      })
    }

    const renderParticipationPagination = (rows: AdminDepartmentRow[]) => {
      if (!participationCard) return
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
      chartPage = Math.min(chartPage, totalPages)
      let wrap = participationCard.querySelector('[data-admin-dashboard-chart-pagination="1"]') as HTMLDivElement | null
      if (!wrap) {
        wrap = document.createElement('div')
        wrap.setAttribute('data-admin-dashboard-chart-pagination', '1')
        wrap.className = 'flex justify-center gap-1 mt-5'
        participationCard.appendChild(wrap)
      }
      wrap.innerHTML = Array.from({ length: totalPages }, (_, index) => index + 1)
        .map((page) => `<button data-admin-dashboard-chart-page="${page}" class="px-3 py-1 ${page === chartPage ? 'bg-primary text-white border border-primary' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200'} rounded text-xs font-bold">${page}</button>`)
        .join('')
      wrap.querySelectorAll('[data-admin-dashboard-chart-page]').forEach((button) => {
        button.addEventListener('click', () => {
          const page = Number((button as HTMLElement).getAttribute('data-admin-dashboard-chart-page') || '1')
          chartPage = page
          rerender()
        })
      })
    }

    const rerender = () => {
      const rows = getRows()
      const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      const visibleForChart = rows.slice((chartPage - 1) * pageSize, chartPage * pageSize)
      applyAdminDashboardPayload(host as HTMLElement, dashboardPayload, visibleForChart)
      renderPagination(rows, visible.length)
      renderParticipationPagination(rows)
      const dashboardTableBody = host.querySelector('tbody')
      if (dashboardTableBody) {
        const toneRows = visible.map((department) => {
          const tone = getDepartmentStatusTone(department.completion)
          return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <td class="px-6 py-4 font-bold text-navy-wia dark:text-slate-200 text-left pl-11">${escapeHtml(department.name)}</td>
              <td class="px-6 py-4 text-center">${department.users}명</td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-16 bg-slate-100 dark:bg-slate-600 h-1.5 rounded-full">
                    <div class="bg-primary h-full rounded-full" style="width: ${department.participation}%"></div>
                  </div>
                  <span>${department.participation}%</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-16 bg-slate-100 dark:bg-slate-600 h-1.5 rounded-full">
                    <div class="${tone.bar} h-full rounded-full" style="width: ${department.completion}%"></div>
                  </div>
                  <span>${department.completion}%</span>
                </div>
              </td>
              <td class="px-6 py-4 font-semibold text-center">${department.avgScore}점</td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${tone.badge}">${tone.label}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <button data-admin-dashboard-detail="${escapeHtml(department.name)}" class="text-primary hover:underline font-bold">상세 보기</button>
              </td>
            </tr>
          `
        }).join('')
        dashboardTableBody.innerHTML = toneRows
      }
      host.querySelectorAll('[data-admin-dashboard-detail]').forEach((button) => {
        button.addEventListener('click', () => {
          const division = (button as HTMLElement).getAttribute('data-admin-dashboard-detail') || ''
          window.location.href = `/admin/departments?division=${encodeURIComponent(division)}`
        })
      })
    }

    if (searchInput) {
      searchInput.oninput = () => {
        currentPage = 1
        chartPage = 1
        rerender()
      }
    }
    if (filterButton) {
      filterButton.onclick = () => {
        const options = ['전체', ...dashboardPayload.departmentComparisons.map((item) => item.name)]
        const next = window.prompt(`본부/사업부명을 입력하세요.\n${options.join(' / ')}`, currentFilter)
        if (!next) return
        currentFilter = options.includes(next) ? next : '전체'
        currentPage = 1
        chartPage = 1
        rerender()
      }
    }
    if (sortButton) {
      sortButton.onclick = () => {
        const order: Array<typeof currentSort> = ['users', 'participation', 'completion', 'avgScore']
        currentSort = order[(order.indexOf(currentSort) + 1) % order.length]
        currentPage = 1
        chartPage = 1
        rerender()
      }
    }
    if (exportButton) {
      exportButton.onclick = () => {
        downloadCsv('on-learning-admin-dashboard.csv', [
          ['본부/사업부', '인원수', '참여율', '완료율', '평균점수'],
          ...getRows().map((item) => [item.name, item.users, `${item.participation}%`, `${item.completion}%`, `${item.avgScore}점`]),
        ])
      }
    }

    rerender()
  }, [dashboardPayload, file])

  useEffect(() => {
    if (file !== '12-admin-departments.html' || !departmentsPayload || !hostRef.current) return
    applyAdminDepartmentsPayload(hostRef.current, departmentsPayload)
  }, [departmentsPayload, file, markup])

  useEffect(() => {
    if (file !== '13-admin-questions.html' || !questionsPayload || !hostRef.current) return

    const host = hostRef.current
    const section = host.querySelector('section')
    const tbody = host.querySelector('table tbody') as HTMLTableSectionElement | null
    const tableScroller = tbody?.closest('div.overflow-x-auto') as HTMLDivElement | null
    if (!tbody || !tableScroller) return

    if (section instanceof HTMLElement) {
      section.style.overflow = 'hidden'
    }
    const main = host.querySelector('main') as HTMLElement | null
    if (main) {
      main.style.maxWidth = '1440px'
    }
    tableScroller.style.margin = '0'
    tableScroller.style.width = '100%'

    let paginationWrap = tableScroller.nextElementSibling as HTMLDivElement | null
    if (!paginationWrap || !paginationWrap.hasAttribute('data-admin-questions-pagination')) {
      paginationWrap = document.createElement('div')
      paginationWrap.setAttribute('data-admin-questions-pagination', '1')
      paginationWrap.className = 'px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4'
      tableScroller.insertAdjacentElement('afterend', paginationWrap)
    }
    paginationWrap.style.margin = '0'
    paginationWrap.style.padding = '16px 24px 24px'
    paginationWrap.style.width = '100%'

    const pageSize = 5
    let currentPage = 1
    const addButton = Array.from(host.querySelectorAll('button')).find((button) => (button.textContent || '').includes('새 문항 추가')) as HTMLButtonElement | undefined

    const refreshQuestionsPayload = async () => {
      const response = await fetch('/api/admin/questions', { credentials: 'include' })
      if (!response.ok) return
      const nextPayload = (await response.json()) as AdminQuestionsPayload
      setQuestionsPayload(nextPayload)
    }

    const render = () => {
      const totalRows = questionsPayload.questions
      const totalPages = Math.max(1, Math.ceil(totalRows.length / pageSize))
      currentPage = Math.min(currentPage, totalPages)
      const visible = totalRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      applyAdminQuestionsPayload(host, questionsPayload, visible)
      paginationWrap!.innerHTML = `
        <div class="text-xs text-slate-500 dark:text-slate-400">
          전체 ${totalRows.length}개 문항 중 ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalRows.length)} 표시
        </div>
        <div class="flex items-center gap-1">
          <button data-admin-questions-page="prev" class="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-200 ${currentPage === 1 ? 'opacity-50' : ''}">이전</button>
          ${Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => `
            <button data-admin-questions-page="${page}" class="px-3 py-1 rounded text-xs font-bold ${page === currentPage ? 'bg-primary text-white border border-primary' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200'}">${page}</button>
          `).join('')}
          <button data-admin-questions-page="next" class="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-200 ${currentPage === totalPages ? 'opacity-50' : ''}">다음</button>
        </div>
      `

      paginationWrap!.querySelectorAll('[data-admin-questions-page]').forEach((button) => {
        button.addEventListener('click', () => {
          const value = (button as HTMLElement).getAttribute('data-admin-questions-page')
          if (value === 'prev' && currentPage > 1) currentPage -= 1
          else if (value === 'next' && currentPage < totalPages) currentPage += 1
          else if (value && !Number.isNaN(Number(value))) currentPage = Number(value)
          render()
        })
      })

      host.querySelectorAll('[data-admin-question-edit]').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = (button as HTMLElement).getAttribute('data-admin-question-edit')
          const current = questionsPayload.questions.find((item) => item.id === id)
          if (!id || !current) return

          const nextTitle = window.prompt('문항 내용을 수정하세요.', current.title)
          if (!nextTitle || nextTitle.trim() === current.title) return

          const categoryGuide = [
            'aiAutomation',
            'dataDecision',
            'dxInnovation',
            'operationsQualitySafety',
            'problemCollaboration',
          ]
          const nextCategory = window.prompt(
            `역량 구분 키를 입력하세요.\n${categoryGuide.join(' / ')}`,
            current.categoryKey,
          )
          if (!nextCategory) return

          const response = await fetch(`/api/admin/questions/${encodeURIComponent(id)}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: nextTitle.trim(),
              category: nextCategory.trim(),
            }),
          })

          if (!response.ok) {
            window.alert('문항 수정에 실패했습니다.')
            return
          }

          await refreshQuestionsPayload()
        })
      })
      host.querySelectorAll('[data-admin-question-delete]').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = (button as HTMLElement).getAttribute('data-admin-question-delete')
          const current = questionsPayload.questions.find((item) => item.id === id)
          if (!id || !current) return
          if (!window.confirm(`${current.title} 문항을 삭제하시겠습니까?`)) return
          const response = await fetch(`/api/admin/questions/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          if (!response.ok) {
            window.alert('문항 삭제에 실패했습니다.')
            return
          }
          await refreshQuestionsPayload()
        })
      })
    }

    if (addButton) {
      addButton.onclick = async () => {
        const title = window.prompt('문항 내용을 입력하세요.')
        if (!title) return
        const categoryGuide = [
          'aiAutomation',
          'dataDecision',
          'dxInnovation',
          'operationsQualitySafety',
          'problemCollaboration',
        ]
        const category = window.prompt(`역량 구분 키를 입력하세요.\n${categoryGuide.join(' / ')}`, 'aiAutomation')
        if (!category) return
        const response = await fetch('/api/admin/questions', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), category: category.trim() }),
        })
        if (!response.ok) {
          window.alert('문항 추가에 실패했습니다.')
          return
        }
        await refreshQuestionsPayload()
      }
    }

    render()
  }, [questionsPayload, file, markup])

  useEffect(() => {
    if (file !== '14-admin-courses.html' || !coursesPayload || !hostRef.current) return

    const host = hostRef.current
    const main = host.querySelector('main') as HTMLElement | null
    const tbody = host.querySelector('table tbody') as HTMLTableSectionElement | null
    const tableScroller = tbody?.closest('div.overflow-x-auto') as HTMLDivElement | null
    const searchInput = host.querySelector('input[placeholder*="과정명"]') as HTMLInputElement | null
    const selects = Array.from(host.querySelectorAll('select')) as HTMLSelectElement[]
    const categorySelect = selects[0] || null
    const levelSelect = selects[1] || null
    if (!main || !tbody || !tableScroller) return

    const pageSize = 5
    let currentPage = 1

    const refreshCoursesPayload = async () => {
      const response = await fetch('/api/admin/courses', { credentials: 'include' })
      if (!response.ok) return
      const nextPayload = (await response.json()) as AdminCoursesPayload
      setCoursesPayload(nextPayload)
    }

    const getRows = () => {
      const keyword = (searchInput?.value || '').trim().toLowerCase()
      const category = categorySelect?.value || '전체 영역'
      const level = levelSelect?.value || '난이도 전체'
      return coursesPayload.courses.filter((course) => {
        const matchesKeyword = !keyword || [course.title, course.category, course.summary, course.id].some((value) => String(value || '').toLowerCase().includes(keyword))
        const matchesCategory = category === '전체 영역' || course.category === category
        const matchesLevel = level === '난이도 전체' || course.level === level
        return matchesKeyword && matchesCategory && matchesLevel
      })
    }

    let paginationWrap = tableScroller.parentElement?.querySelector('[data-admin-courses-pagination="1"]') as HTMLDivElement | null
    if (!paginationWrap) {
      const existingPagination = tableScroller.nextElementSibling as HTMLDivElement | null
      paginationWrap = existingPagination || document.createElement('div')
      paginationWrap.setAttribute('data-admin-courses-pagination', '1')
      paginationWrap.className = 'px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4'
      if (!existingPagination) {
        tableScroller.insertAdjacentElement('afterend', paginationWrap)
      }
    }

    const render = () => {
      const rows = getRows()
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
      currentPage = Math.min(currentPage, totalPages)
      const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      applyAdminCoursesPayload(main, coursesPayload, visible)
      paginationWrap!.innerHTML = `
        <div class="text-xs text-slate-500 dark:text-slate-400">
          전체 ${rows.length}개 과정 중 ${rows.length ? (currentPage - 1) * pageSize + 1 : 0}-${Math.min(currentPage * pageSize, rows.length)} 표시
        </div>
        <div class="flex items-center gap-1">
          <button data-admin-courses-page="prev" class="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-200 ${currentPage === 1 ? 'opacity-50' : ''}">이전</button>
          ${Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => `
            <button data-admin-courses-page="${page}" class="px-3 py-1 rounded text-xs font-bold ${page === currentPage ? 'bg-primary text-white border border-primary' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200'}">${page}</button>
          `).join('')}
          <button data-admin-courses-page="next" class="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-200 ${currentPage === totalPages ? 'opacity-50' : ''}">다음</button>
        </div>
      `
      paginationWrap!.querySelectorAll('[data-admin-courses-page]').forEach((button) => {
        button.addEventListener('click', () => {
          const value = (button as HTMLElement).getAttribute('data-admin-courses-page')
          if (value === 'prev' && currentPage > 1) currentPage -= 1
          else if (value === 'next' && currentPage < totalPages) currentPage += 1
          else if (value && !Number.isNaN(Number(value))) currentPage = Number(value)
          render()
        })
      })
      host.querySelectorAll('[data-admin-course-edit]').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = (button as HTMLElement).getAttribute('data-admin-course-edit') || ''
          const current = coursesPayload.courses.find((course) => course.id === id)
          if (!current) return
          const courseTitle = window.prompt('과정명을 수정하세요.', current.title)
          if (courseTitle == null) return
          const competencyArea = window.prompt('역량 구분 키를 입력하세요.', current.competencyArea)
          if (competencyArea == null) return
          const level = window.prompt('난이도를 입력하세요. (입문 / 중급 / 심화)', current.level)
          if (level == null) return
          const durationHoursText = window.prompt('학습시간을 숫자로 입력하세요.', String(current.durationHours))
          if (durationHoursText == null) return
          const summary = window.prompt('요약을 입력하세요.', current.summary)
          if (summary == null) return
          const response = await fetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseTitle,
              competencyArea,
              level,
              durationHours: Number(durationHoursText) || current.durationHours,
              summary,
            }),
          })
          if (!response.ok) {
            window.alert('과정 수정에 실패했습니다.')
            return
          }
          await refreshCoursesPayload()
        })
      })
      host.querySelectorAll('[data-admin-course-delete]').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = (button as HTMLElement).getAttribute('data-admin-course-delete') || ''
          const current = coursesPayload.courses.find((course) => course.id === id)
          if (!current) return
          if (!window.confirm(`${current.title} 과정을 삭제하시겠습니까?`)) return
          const response = await fetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          if (!response.ok) {
            window.alert('과정 삭제에 실패했습니다.')
            return
          }
          await refreshCoursesPayload()
        })
      })
    }

    const handleFilterChange = () => {
      currentPage = 1
      render()
    }
    if (searchInput) searchInput.oninput = handleFilterChange
    if (categorySelect) categorySelect.onchange = handleFilterChange
    if (levelSelect) levelSelect.onchange = handleFilterChange
    render()
  }, [coursesPayload, file, markup])

  useEffect(() => {
    if (file !== '16-admin-boards.html' || !boardsPayload || !hostRef.current) return

    const host = hostRef.current
    const main = host.querySelector('main') as HTMLElement | null
    const tbody = host.querySelector('table tbody') as HTMLTableSectionElement | null
    const tableScroller = tbody?.closest('div.overflow-x-auto') as HTMLDivElement | null
    const searchInputs = Array.from(host.querySelectorAll('input[placeholder*="검색"]')) as HTMLInputElement[]
    const searchInput = searchInputs[searchInputs.length - 1] || null
    const addButton = Array.from(host.querySelectorAll('button')).find((button) => (button.textContent || '').includes('새 항목 추가')) as HTMLButtonElement | undefined
    const exportButton = Array.from(host.querySelectorAll('button')).find((button) => (button.textContent || '').includes('내보내기')) as HTMLButtonElement | undefined
    if (!main || !tbody || !tableScroller) return

    const pageSize = 5
    let currentPage = 1
    let currentFilter: 'all' | 'notice' | 'faq' = 'all'

    const refreshBoardsPayload = async () => {
      const response = await fetch('/api/admin/boards', { credentials: 'include' })
      if (!response.ok) return
      const nextPayload = (await response.json()) as AdminBoardsPayload
      setBoardsPayload(nextPayload)
    }

    const getRows = () => {
      const keyword = (searchInput?.value || '').trim().toLowerCase()
      return toBoardRows(boardsPayload)
        .filter((item) => currentFilter === 'all' || item.type === currentFilter)
        .filter((item) => !keyword || [item.title, item.body, item.category, item.id].some((value) => String(value || '').toLowerCase().includes(keyword)))
    }

    let paginationWrap = tableScroller.parentElement?.querySelector('[data-admin-boards-pagination="1"]') as HTMLDivElement | null
    if (!paginationWrap) {
      paginationWrap = document.createElement('div')
      paginationWrap.setAttribute('data-admin-boards-pagination', '1')
      paginationWrap.className = 'px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4'
      tableScroller.insertAdjacentElement('afterend', paginationWrap)
    }

    const render = () => {
      const rows = getRows()
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
      currentPage = Math.min(currentPage, totalPages)
      const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      applyAdminBoardsPayload(main, boardsPayload, visible)
      paginationWrap!.innerHTML = `
        <div class="text-xs text-slate-500 dark:text-slate-400">
          전체 ${rows.length}개 항목 중 ${rows.length ? (currentPage - 1) * pageSize + 1 : 0}-${Math.min(currentPage * pageSize, rows.length)} 표시
        </div>
        <div class="flex items-center gap-1">
          <button data-admin-boards-page="prev" class="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-200 ${currentPage === 1 ? 'opacity-50' : ''}">이전</button>
          ${Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => `
            <button data-admin-boards-page="${page}" class="px-3 py-1 rounded text-xs font-bold ${page === currentPage ? 'bg-primary text-white border border-primary' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200'}">${page}</button>
          `).join('')}
          <button data-admin-boards-page="next" class="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-200 ${currentPage === totalPages ? 'opacity-50' : ''}">다음</button>
        </div>
      `
      paginationWrap!.querySelectorAll('[data-admin-boards-page]').forEach((button) => {
        button.addEventListener('click', () => {
          const value = (button as HTMLElement).getAttribute('data-admin-boards-page')
          if (value === 'prev' && currentPage > 1) currentPage -= 1
          else if (value === 'next' && currentPage < totalPages) currentPage += 1
          else if (value && !Number.isNaN(Number(value))) currentPage = Number(value)
          render()
        })
      })
      host.querySelectorAll('[data-admin-board-edit]').forEach((button) => {
        button.addEventListener('click', async () => {
          const [type, id] = String((button as HTMLElement).getAttribute('data-admin-board-edit') || '').split(':')
          const current = getRows().find((item) => item.type === type && item.id === id)
          if (!current) return
          const title = window.prompt(type === 'notice' ? '공지 제목을 수정하세요.' : 'FAQ 질문을 수정하세요.', current.title)
          if (title == null) return
          const body = window.prompt(type === 'notice' ? '공지 요약을 수정하세요.' : 'FAQ 답변을 수정하세요.', current.body)
          if (body == null) return
          const category = type === 'notice'
            ? window.prompt('공지 카테고리를 수정하세요.', current.category)
            : current.category
          if (category == null) return
          const response = await fetch(`/api/admin/${type === 'notice' ? 'notices' : 'faqs'}/${encodeURIComponent(id)}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(type === 'notice'
              ? { title, summary: body, category }
              : { question: title, answer: body }),
          })
          if (!response.ok) {
            window.alert('항목 수정에 실패했습니다.')
            return
          }
          await refreshBoardsPayload()
        })
      })
      host.querySelectorAll('[data-admin-board-delete]').forEach((button) => {
        button.addEventListener('click', async () => {
          const [type, id] = String((button as HTMLElement).getAttribute('data-admin-board-delete') || '').split(':')
          const current = getRows().find((item) => item.type === type && item.id === id)
          if (!current) return
          if (!window.confirm(`${current.title} 항목을 삭제하시겠습니까?`)) return
          const response = await fetch(`/api/admin/${type === 'notice' ? 'notices' : 'faqs'}/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          if (!response.ok) {
            window.alert('항목 삭제에 실패했습니다.')
            return
          }
          await refreshBoardsPayload()
        })
      })
    }

    if (searchInput) {
      searchInput.oninput = () => {
        currentPage = 1
        render()
      }
    }
    const filterButton = Array.from(host.querySelectorAll('button')).find((button) => (button.textContent || '').includes('필터')) as HTMLButtonElement | undefined
    if (filterButton) {
      filterButton.onclick = () => {
        currentFilter = currentFilter === 'all' ? 'notice' : currentFilter === 'notice' ? 'faq' : 'all'
        currentPage = 1
        render()
      }
    }
    if (exportButton) {
      exportButton.onclick = () => {
        downloadCsv('on-learning-admin-boards.csv', [
          ['구분', '카테고리', '제목', '내용', '일자'],
          ...getRows().map((item) => [item.type === 'notice' ? '공지' : 'FAQ', item.category, item.title, item.body, item.date]),
        ])
      }
    }
    if (addButton) {
      addButton.onclick = async () => {
        const typeLabel = window.prompt('추가할 항목 유형을 입력하세요. (공지 / FAQ)', '공지')
        if (!typeLabel) return
        const isFaq = typeLabel.toUpperCase() === 'FAQ'
        const title = window.prompt(isFaq ? 'FAQ 질문을 입력하세요.' : '공지 제목을 입력하세요.')
        if (!title) return
        const body = window.prompt(isFaq ? 'FAQ 답변을 입력하세요.' : '공지 요약을 입력하세요.')
        if (!body) return
        const category = isFaq ? '' : (window.prompt('공지 카테고리를 입력하세요.', '공지') || '공지')
        const response = await fetch(`/api/admin/${isFaq ? 'faqs' : 'notices'}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isFaq
            ? { question: title, answer: body }
            : { title, summary: body, category }),
        })
        if (!response.ok) {
          window.alert('항목 추가에 실패했습니다.')
          return
        }
        await refreshBoardsPayload()
      }
    }

    render()
  }, [boardsPayload, file, markup])

  useEffect(() => {
    if (file !== '15-admin-users.html' || !usersPayload || !hostRef.current) return

    const host = hostRef.current
    const tbody = host.querySelector('table tbody') as HTMLTableSectionElement | null
    const tableScroller = tbody?.closest('div.overflow-x-auto') as HTMLDivElement | null
    const paginationWrap = tableScroller?.nextElementSibling as HTMLDivElement | null
    const searchInput = host.querySelector('input[placeholder*="이름, 사번, 이메일"]') as HTMLInputElement | null
    const selects = Array.from(host.querySelectorAll('select')) as HTMLSelectElement[]
    const divisionSelect = selects[0] || null
    const statusSelect = selects[1] || null
    const createButton = host.querySelector('[data-admin-user-create="1"]') as HTMLButtonElement | null
    const importButton = host.querySelector('[data-admin-user-import="1"]') as HTMLButtonElement | null
    const downloadTemplateButton = host.querySelector('[data-admin-user-template-download="1"]') as HTMLButtonElement | null
    if (!tbody || !tableScroller || !paginationWrap) return

    const pageSize = 5
    let currentPage = 1

    const refreshUsersPayload = async () => {
      const response = await fetch('/api/admin/users', { credentials: 'include' })
      if (!response.ok) return
      const nextPayload = (await response.json()) as AdminUsersPayload
      setUsersPayload(nextPayload)
    }

    const syncFilterControlStyle = () => {
      if (searchInput) {
        searchInput.classList.add('h-11')
        searchInput.style.height = '44px'
      }
      ;[divisionSelect, statusSelect].forEach((select) => {
        if (!select) return
        select.classList.add('h-11')
        select.style.height = '44px'
        select.style.appearance = 'none'
        ;(select.style as CSSStyleDeclaration & { WebkitAppearance?: string }).WebkitAppearance = 'none'
        ;(select.style as CSSStyleDeclaration & { MozAppearance?: string }).MozAppearance = 'none'
        select.style.backgroundImage = 'none'
      })
    }

    const getFilteredUsers = () => {
      const keyword = (searchInput?.value || '').trim().toLowerCase()
      const division = divisionSelect?.value || '전체 본부'
      const status = statusSelect?.value || '전체 상태'
      return usersPayload.users.filter((user) => {
        const matchesKeyword = !keyword || [
          user.name,
          user.employeeId,
          user.email,
          user.division,
          user.team,
        ].some((value) => String(value || '').toLowerCase().includes(keyword))
        const matchesDivision = division === '전체 본부' || user.division === division
        const matchesStatus = status === '전체 상태' || user.status === status
        return matchesKeyword && matchesDivision && matchesStatus
      })
    }

    const renderRows = (users: AdminUserRow[]) => {
      tbody.innerHTML = users.map((user) => {
        const tone = getUserStatusTone(user.status)
        const roleTone = getUserRoleTone(user.role)
        const avatarLabel = Array.from(String(user.name || '?').trim())[0] || '?'
        const roleLabel = user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '학습자'
        return `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">${escapeHtml(avatarLabel)}</div>
                <div>
                  <div class="flex items-center gap-2">
                    <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">${escapeHtml(user.name)}</div>
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleTone}">${roleLabel}</span>
                  </div>
                  <div class="text-xs text-slate-500">${escapeHtml(user.email)}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-center">${escapeHtml(user.employeeId)}</td>
            <td class="px-6 py-4 text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                ${escapeHtml(user.division)} / ${escapeHtml(user.team)}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-center">${escapeHtml(formatKoreanDate(user.diagnosisDate))}</td>
            <td class="px-6 py-4 text-center">
              ${
                user.status === '진단완료'
                  ? `<button data-admin-view-diagnosis="${escapeHtml(user.id)}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.wrap}">
                      <span class="w-1.5 h-1.5 rounded-full ${tone.dot}"></span>${escapeHtml(user.status)}
                    </button>`
                  : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.wrap}">
                      <span class="w-1.5 h-1.5 rounded-full ${tone.dot}"></span>${escapeHtml(user.status)}
                    </span>`
              }
            </td>
            <td class="px-6 py-4 text-center">
              <div class="flex justify-center gap-3">
                <button data-admin-edit-user="${escapeHtml(user.id)}" class="text-primary hover:text-primary/80 font-semibold text-sm">수정</button>
                <button data-admin-role-user="${escapeHtml(user.id)}" class="text-slate-500 hover:text-slate-900 font-semibold text-sm">권한</button>
                <button data-admin-delete-user="${escapeHtml(user.id)}" class="text-red-500 hover:text-red-600 font-semibold text-sm">삭제</button>
              </div>
            </td>
          </tr>
        `
      }).join('')

      tbody.querySelectorAll('[data-admin-view-diagnosis]').forEach((button) => {
        button.addEventListener('click', () => {
          const id = (button as HTMLElement).getAttribute('data-admin-view-diagnosis') || ''
          if (!id) return
          window.location.href = `/diagnosis/results?userId=${encodeURIComponent(id)}&returnTo=${encodeURIComponent('/admin/users')}`
        })
      })

      tbody.querySelectorAll('[data-admin-edit-user]').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = (button as HTMLElement).getAttribute('data-admin-edit-user') || ''
          const current = usersPayload.users.find((user) => user.id === id)
          if (!current) return
          const name = window.prompt('회원명을 수정하세요.', current.name)
          if (name == null) return
          const employeeId = window.prompt('사번을 수정하세요.', current.employeeId)
          if (employeeId == null) return
          const division = window.prompt('본부명을 수정하세요.', current.division)
          if (division == null) return
          const team = window.prompt('팀명을 수정하세요.', current.team)
          if (team == null) return
          const statusOverride = window.prompt(
            '상태를 수정하세요. (가입완료 / 진단완료 / 신청완료 / 수강완료 / 확인필요 / 신청실패, 비우면 자동상태)',
            current.statusOverride || current.status,
          )
          if (statusOverride == null) return
          await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              employeeId,
              division,
              team,
              statusOverride,
            }),
          })
          await refreshUsersPayload()
        })
      })
      tbody.querySelectorAll('[data-admin-role-user]').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = (button as HTMLElement).getAttribute('data-admin-role-user') || ''
          const current = usersPayload.users.find((user) => user.id === id)
          if (!current) return
          const currentRoleLabel = current.role === 'admin' ? '관리자' : current.role === 'manager' ? '매니저' : '학습자'
          const nextRoleLabel = window.prompt('권한을 입력하세요. (학습자 / 매니저 / 관리자)', currentRoleLabel)
          if (!nextRoleLabel) return
          const nextRole = nextRoleLabel === '관리자' ? 'admin' : nextRoleLabel === '매니저' ? 'manager' : 'employee'
          await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: nextRole,
            }),
          })
          await refreshUsersPayload()
        })
      })
      tbody.querySelectorAll('[data-admin-delete-user]').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = (button as HTMLElement).getAttribute('data-admin-delete-user') || ''
          const current = usersPayload.users.find((user) => user.id === id)
          if (!current) return
          if (!window.confirm(`${current.name} 회원을 삭제하시겠습니까?`)) return
          const confirmationEmployeeId = window.prompt(`삭제를 계속하려면 사번 ${current.employeeId} 를 입력하세요.`, '')
          if (!confirmationEmployeeId) return
          await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              confirmationEmployeeId: confirmationEmployeeId.trim(),
            }),
          })
          await refreshUsersPayload()
        })
      })
    }

    const renderPagination = (filteredUsers: AdminUserRow[]) => {
      const total = filteredUsers.length
      const totalPages = Math.max(1, Math.ceil(total / pageSize))
      currentPage = Math.min(currentPage, totalPages)
      const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
      const endIndex = Math.min(currentPage * pageSize, total)
      const pages = new Set<number>([1, 2, totalPages - 1, totalPages, currentPage - 1, currentPage, currentPage + 1])
      const visiblePages = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
      const pageTokens: Array<number | 'ellipsis'> = []
      visiblePages.forEach((page, index) => {
        if (index > 0 && page - visiblePages[index - 1] > 1) {
          pageTokens.push('ellipsis')
        }
        pageTokens.push(page)
      })

      paginationWrap.innerHTML = `
        <div class="text-sm text-slate-500 dark:text-slate-400">
          전체 <span class="font-medium text-slate-900 dark:text-slate-100">${total}</span>명 중 <span class="font-medium text-slate-900 dark:text-slate-100">${startIndex}</span>-${endIndex}명 표시
        </div>
        <div class="flex items-center gap-2">
          <button data-admin-page-nav="prev" class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50" ${currentPage === 1 ? 'disabled' : ''}>
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          ${pageTokens.map((token) => token === 'ellipsis'
            ? `<span class="text-slate-400 px-1">...</span>`
            : token === currentPage
              ? `<button data-admin-page="${token}" class="px-3.5 py-1.5 rounded-lg bg-primary text-white text-sm font-bold shadow-sm">${token}</button>`
              : `<button data-admin-page="${token}" class="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium">${token}</button>`).join('')}
          <button data-admin-page-nav="next" class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" ${currentPage === totalPages ? 'disabled' : ''}>
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      `

      paginationWrap.querySelectorAll('[data-admin-page]').forEach((button) => {
        button.addEventListener('click', () => {
          currentPage = Number((button as HTMLElement).getAttribute('data-admin-page') || '1')
          rerender()
        })
      })
      paginationWrap.querySelector('[data-admin-page-nav="prev"]')?.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage -= 1
          rerender()
        }
      })
      paginationWrap.querySelector('[data-admin-page-nav="next"]')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage += 1
          rerender()
        }
      })
    }

    const rerender = () => {
      const filteredUsers = getFilteredUsers()
      const start = (currentPage - 1) * pageSize
      const pageItems = filteredUsers.slice(start, start + pageSize)
      renderRows(pageItems)
      renderPagination(filteredUsers)
    }

    const handleFilterChange = () => {
      currentPage = 1
      rerender()
    }

    if (searchInput) {
      searchInput.oninput = handleFilterChange
    }
    if (divisionSelect) {
      divisionSelect.onchange = handleFilterChange
    }
    if (statusSelect) {
      statusSelect.onchange = handleFilterChange
    }

    syncFilterControlStyle()

    if (createButton) {
      createButton.onclick = async () => {
        const name = window.prompt('회원명을 입력하세요.')
        if (!name) return
        const employeeId = window.prompt('사번을 입력하세요.')
        if (!employeeId) return
        const division = window.prompt('본부명을 입력하세요.')
        if (!division) return
        const team = window.prompt('팀명을 입력하세요.')
        if (!team) return
        const email = window.prompt('회사 이메일을 입력하세요.')
        if (!email) return
        const roleLabel = window.prompt('권한을 입력하세요. (학습자 / 매니저 / 관리자)', '학습자') || '학습자'
        const interestCourse = window.prompt('관심 과정을 입력하세요.', '') || ''
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId,
            name,
            division,
            team,
            email,
            interestCourse,
            role: roleLabel === '관리자' ? 'admin' : roleLabel === '매니저' ? 'manager' : 'employee',
          }),
        })
        if (!response.ok) {
          window.alert('회원 추가에 실패했습니다.')
          return
        }
        window.alert('회원이 등록되었습니다.')
        await refreshUsersPayload()
      }
    }

    if (importButton) {
      importButton.onclick = () => {
        if (userImporting) return
        userImportInputRef.current?.click()
      }
    }

    if (downloadTemplateButton) {
      downloadTemplateButton.onclick = async () => {
        try {
          await downloadAdminUserTemplateSample()
        } catch {
          window.alert('업로드 양식 다운로드에 실패했습니다.')
        }
      }
    }

    rerender()
  }, [file, markup, userImporting, usersPayload])

  if (error) {
    return <div className="panel">{error}</div>
  }

  if (!markup) {
    return <div className="app-bootstrap-loading">관리자 템플릿을 불러오는 중입니다...</div>
  }

  return (
    <>
      <div ref={hostRef} className="admin-template-host" dangerouslySetInnerHTML={{ __html: markup }} />
      <input
        ref={userImportInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          try {
            setUserImporting(true)
            const rows = await parseAdminUserWorkbook(file)
            if (!rows.length) {
              window.alert('업로드 가능한 회원 행이 없습니다.')
              return
            }
            const response = await fetch('/api/admin/users/import', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ users: rows }),
            })
            if (!response.ok) {
              throw new Error('user-import-failed')
            }
            const result = await response.json() as { importedCount?: number; updatedCount?: number }
            window.alert(`회원 일괄 등록이 완료되었습니다. 신규 ${result.importedCount || 0}명, 업데이트 ${result.updatedCount || 0}명`)
            const refreshResponse = await fetch('/api/admin/users', { credentials: 'include' })
            if (refreshResponse.ok) {
              const nextPayload = (await refreshResponse.json()) as AdminUsersPayload
              setUsersPayload(nextPayload)
            }
          } catch {
            window.alert('회원 일괄 등록에 실패했습니다.')
          } finally {
            setUserImporting(false)
            event.target.value = ''
          }
        }}
      />
    </>
  )
}
