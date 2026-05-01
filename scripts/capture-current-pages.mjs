import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.APP_BASE_URL || 'http://127.0.0.1:3000'
const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
const outDir = path.resolve(`output/playwright/stitch-redesign-${stamp}`)

const diagnosisPayload = {
  userId: 'HWIA-2026-0001',
  diagnosedAt: new Date('2026-03-07T09:00:00+09:00').toISOString(),
  totalScore: 56,
  maxScore: 80,
  categoryScores: {
    aiAutomation: 9,
    dataDecision: 11,
    dxInnovation: 10,
    operationsQualitySafety: 12,
    problemCollaboration: 14,
  },
  topGaps: ['aiAutomation', 'dxInnovation', 'dataDecision'],
}

const recommended = {
  courseId: 'AI-101',
  courseTitle: 'AI가 말했다 그건 네가 안 해도 돼 - 반복 업무 대신 AI가 일하는 업무 자동화 입문',
  level: '입문',
  durationHours: 8,
  competencyArea: 'aiAutomation',
  summary: '반복 보고와 자료 정리 업무를 AI와 자동화 도구로 줄이는 실무 입문 과정입니다.',
  objectives: ['반복 업무 자동화 기회 찾기', '생성형 AI 활용 기본 흐름 익히기', '현업 적용 아이디어 정리하기'],
  targetAudience: ['사무/생산지원 담당자'],
  expectedOutcomes: ['반복 업무 시간 단축', '업무 자동화 후보 도출'],
  reasonTags: ['AI자동화', '업무혁신'],
  recommendedBy: 'skill-gap',
  fitScore: 92,
}

const favoriteIds = ['AI-101', 'DAT-201']
const enrollmentRecords = [
  {
    courseId: 'AI-101',
    courseTitle: recommended.courseTitle,
    enrollmentRequestedAt: new Date('2026-03-06T14:00:00+09:00').toISOString(),
    enrollmentStatus: 'requested',
  },
  {
    courseId: 'DAT-201',
    courseTitle: '[All that MBA] 데이터 사이언스, 어떻게 인사이트를 얻을 것인가?',
    enrollmentRequestedAt: new Date('2026-02-24T14:00:00+09:00').toISOString(),
    enrollmentStatus: 'enrolled',
  },
]

const profile = {
  employeeId: 'HWIA-2026-0001',
  name: '데모 사용자',
  organization: '생산운영',
}

const pages = [
  ['01-home.png', '/'],
  ['02-diagnosis.png', '/diagnosis'],
  ['03-diagnosis-results.png', '/diagnosis/results'],
  ['04-learning-path.png', '/learning-path'],
  ['05-recommendation.png', '/recommendation'],
  ['06-course-linking.png', '/course-linking'],
  ['07-history.png', '/history'],
  ['08-analytics.png', '/analytics'],
  ['09-chatbot.png', '/chatbot'],
  ['10-platform-intro.png', '/platform-intro'],
  ['11-admin-dashboard.png', '/admin'],
  ['12-admin-departments.png', '/admin/departments'],
  ['13-admin-questions.png', '/admin/questions'],
  ['14-admin-courses.png', '/admin/courses'],
  ['15-admin-users.png', '/admin/users'],
  ['16-admin-boards.png', '/admin/boards'],
  ['17-admin-settings.png', '/admin/settings'],
]

await fs.mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } })

await page.addInitScript(({ diagnosisPayload, recommended, favoriteIds, enrollmentRecords, profile }) => {
  localStorage.setItem('on_learning_authenticated_v1', '1')
  localStorage.setItem('on_learning_user_profile_v1', JSON.stringify(profile))
  localStorage.setItem('on_learning_user_role_v1', 'admin')
  localStorage.setItem('on_learning_diagnosis_payload_v1', JSON.stringify(diagnosisPayload))
  localStorage.setItem('on_learning_diagnosis_history_v1', JSON.stringify([diagnosisPayload]))
  localStorage.setItem('on_learning_selected_course_v1', JSON.stringify(recommended))
  localStorage.setItem('on_learning_favorite_courses_v1', JSON.stringify(favoriteIds))
  localStorage.setItem('on_learning_enrollment_records_v1', JSON.stringify(enrollmentRecords))
  localStorage.setItem('on_learning_journey_events_v1', JSON.stringify([]))
}, { diagnosisPayload, recommended, favoriteIds, enrollmentRecords, profile })

for (const [file, route] of pages) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  })
  await page.screenshot({ path: path.join(outDir, file), fullPage: true })
}

await browser.close()
console.log(outDir)
