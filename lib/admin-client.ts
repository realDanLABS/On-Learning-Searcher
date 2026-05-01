'use client'

import { runtime } from '@/lib/runtime'

export type AdminDashboardPayload = {
  userName: string
  organization?: string
  kpis: Array<{ label: string; value: string; delta: string; tone: string; unit?: string; progress?: number }>
  funnel: Array<{ label: string; percent: number }>
  insights: Array<{ title: string; body: string }>
  urgentActions: string[]
  departmentComparisons: AdminDepartment[]
  trendComparison?: Array<{ label: string; completion: number; competency: number }>
  summary?: {
    departmentCount: number
    displayedDepartments: number
  }
}

export type AdminDepartment = {
  name: string
  users: number
  participation: number
  completion: number
  avgScore: number
}

export type AdminDepartmentDetail = {
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

export type AdminDepartmentsPayload = {
  userName: string
  focusDivision: string
  filters: string[]
  kpis: Array<{ label: string; value: string; delta: string; tone: string }>
  competencyComparison: Array<{ label: string; departmentScore: number; overallScore: number }>
  topCourses: Array<{ rank: number; title: string; percent: number }>
  departments: AdminDepartmentDetail[]
  summary: {
    departmentCount: number
    displayedDepartments: number
  }
}

export type AdminQuestion = {
  id: string
  order: number
  categoryKey: string
  area: string
  title: string
  date: string
  status: string
}

export type AdminCourse = {
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

export type AdminUser = {
  id: string
  name: string
  employeeId: string
  division: string
  team: string
  email: string
  interestCourse: string
  role: 'employee' | 'manager' | 'admin'
  joinedAt: string
  diagnosisDate: string
  status: string
}

export type AdminNotice = {
  id: string
  category: string
  date: string
  title: string
  summary: string
  status?: string
  created_at?: string
  updated_at?: string
}

export type AdminFaq = {
  id: string
  question: string
  answer: string
  status?: string
  created_at?: string
  updated_at?: string
}

export type AdminCourseImportHistoryItem = {
  id: string
  fileName: string
  uploadedAt: string
  processedCount: number
  replaceMode: boolean
  status: 'success' | 'fail'
  detail: string
  uploadedBy?: string
}

export function fetchAdminDashboardPayload() {
  return requestJson<AdminDashboardPayload>('/admin/dashboard')
}

export function fetchAdminDepartmentsPayload(division?: string) {
  const query = division ? `?division=${encodeURIComponent(division)}` : ''
  return requestJson<AdminDepartmentsPayload>(`/admin/departments${query}`)
}

export function fetchAdminQuestionsPayload() {
  return requestJson<{ userName: string; questions: AdminQuestion[] }>('/admin/questions')
}

export function createAdminQuestion(input: { title: string; category: string; options?: Array<{ label: string; value: number }> }) {
  return requestJson<{ ok: boolean }>('/admin/questions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAdminQuestion(id: string, input: { title: string; category: string }) {
  return requestJson<{ ok: boolean }>(`/admin/questions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAdminQuestion(id: string) {
  return requestJson<{ ok: boolean }>(`/admin/questions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchAdminCoursesPayload() {
  return requestJson<{ userName: string; courses: AdminCourse[] }>('/admin/courses')
}

export function createAdminCourse(input: Record<string, unknown>) {
  return requestJson<{ ok: boolean }>('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function importAdminCourses(input: { rows: Record<string, unknown>[]; replace?: boolean; fileName?: string }) {
  return requestJson<{ ok: boolean; importedCount?: number; replace?: boolean }>('/admin/courses/import', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchAdminCourseImportHistory() {
  return requestJson<AdminCourseImportHistoryItem[]>('/admin/courses/import-history')
}

export function updateAdminCourse(id: string, input: Record<string, unknown>) {
  return requestJson<{ ok: boolean }>(`/admin/courses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAdminCourse(id: string) {
  return requestJson<{ ok: boolean }>(`/admin/courses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchAdminUsersPayload() {
  return requestJson<{ userName: string; users: AdminUser[] }>('/admin/users')
}

export function updateAdminUser(id: string, input: Record<string, unknown>) {
  return requestJson<{ ok: boolean }>(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAdminUser(id: string) {
  return requestJson<{ ok: boolean }>(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchAdminBoardsPayload() {
  return requestJson<{ userName: string; notices: AdminNotice[]; faqs: AdminFaq[] }>('/admin/boards')
}

export function createAdminNotice(input: Record<string, unknown>) {
  return requestJson<{ ok: boolean }>('/admin/notices', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAdminNotice(id: string, input: Record<string, unknown>) {
  return requestJson<{ ok: boolean }>(`/admin/notices/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAdminNotice(id: string) {
  return requestJson<{ ok: boolean }>(`/admin/notices/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function createAdminFaq(input: Record<string, unknown>) {
  return requestJson<{ ok: boolean }>('/admin/faqs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAdminFaq(id: string, input: Record<string, unknown>) {
  return requestJson<{ ok: boolean }>(`/admin/faqs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAdminFaq(id: string) {
  return requestJson<{ ok: boolean }>(`/admin/faqs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${runtime.apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `API request failed: ${response.status}`
    try {
      const payload = (await response.json()) as { error?: { message?: string } }
      message = payload.error?.message || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
