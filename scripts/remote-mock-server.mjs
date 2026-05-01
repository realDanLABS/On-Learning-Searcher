#!/usr/bin/env node
import http from 'node:http'

const PORT = Number(process.env.REMOTE_MOCK_PORT || 8787)
const ALLOWED_ORIGIN = process.env.REMOTE_MOCK_ORIGIN || 'http://127.0.0.1:3000'

/** @type {{authenticated: boolean, profile?: {employeeId: string, name: string, organization: string}, role?: 'employee'|'manager'|'admin'}} */
let session = { authenticated: false }
/** @type {any | null} */
let diagnosis = null
/** @type {any | null} */
let selectedCourse = null
/**** @type {any[]} */
let enrollments = []
/** @type {any[]} */
let journeyEvents = []
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-mini'

const coursePool = [
  {
    courseId: 'DIG-101',
    courseTitle: 'Digital Productivity Tools',
    level: '입문',
    durationHours: 6,
    reasonTags: ['digital', 'skill-gap'],
    recommendedBy: 'skill-gap',
  },
  {
    courseId: 'LDR-210',
    courseTitle: 'Leadership Communication',
    level: '중급',
    durationHours: 8,
    reasonTags: ['leadership', 'role-fit'],
    recommendedBy: 'role-fit',
  },
  {
    courseId: 'COL-180',
    courseTitle: 'Cross-team Collaboration Workshop',
    level: '중급',
    durationHours: 5,
    reasonTags: ['collaboration', 'skill-gap'],
    recommendedBy: 'skill-gap',
  },
  {
    courseId: 'PS-300',
    courseTitle: 'Advanced Problem Solving',
    level: '심화',
    durationHours: 10,
    reasonTags: ['problemSolving', 'history-based'],
    recommendedBy: 'history-based',
  },
]

function createEvent(type, label) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    label,
    at: new Date().toISOString(),
  }
}

function getJourneyStage() {
  const hasDiagnosis = Boolean(diagnosis)
  const hasSelectedCourse = hasDiagnosis && Boolean(selectedCourse)
  const hasSuccessfulEnrollment =
    hasSelectedCourse && enrollments.some((item) => item.enrollmentStatus === 'enrolled')

  if (hasSuccessfulEnrollment) return 'enrollment_done'
  if (hasSelectedCourse) return 'course_selected'
  if (hasDiagnosis) return 'diagnosis_done'
  return 'start'
}

function scoreCourse(course) {
  if (!diagnosis || !Array.isArray(diagnosis.topGaps)) return 50
  const topGaps = diagnosis.topGaps
  let score = 40
  if (course.reasonTags.includes(topGaps[0])) score += 30
  if (course.reasonTags.includes(topGaps[1])) score += 20
  return Math.min(99, score)
}

function buildChatbotFallback(payload) {
  const question = typeof payload?.question === 'string' ? payload.question : ''
  const normalized = question.toLowerCase()
  const diagnosisPayload = payload?.diagnosis || null
  const enrollmentHistory = Array.isArray(payload?.enrollments) ? payload.enrollments : []
  const recommended = Array.isArray(payload?.courses) ? payload.courses : []
  const profile = payload?.profile || session.profile || null
  const name = profile?.name || '구성원'
  const topGapKey = diagnosisPayload?.topGaps?.[0]
  const topGap =
    topGapKey === 'aiAutomation'
      ? 'AI/자동화 활용'
      : topGapKey === 'dataDecision'
        ? '데이터 기반 의사결정'
        : topGapKey === 'dxInnovation'
          ? 'DX 혁신 이해'
          : topGapKey === 'operationsQualitySafety'
            ? '생산/품질/안전 운영'
            : topGapKey === 'problemCollaboration'
              ? '문제해결/협업'
              : 'AI/자동화 활용'
  const topCourse = recommended[0]
  const latest = enrollmentHistory[0]
  const score = diagnosisPayload
    ? Math.round((diagnosisPayload.totalScore / Math.max(1, diagnosisPayload.maxScore)) * 100)
    : null

  if (normalized.includes('부족') || normalized.includes('역량')) {
    return `${name}님의 현재 보완 1순위는 ${topGap}입니다. 지금은 이 역량을 먼저 보완하는 과정 1개를 선택해서 짧게 시작하는 것이 가장 효과적입니다.`
  }

  if (normalized.includes('신청') || normalized.includes('상태')) {
    if (!latest) {
      return `아직 신청 이력이 없습니다. ${topGap} 보완을 위한 추천 과정부터 확인해 보세요.`
    }
    if (latest.enrollmentStatus === 'requested') {
      return `${latest.courseTitle} 과정은 현재 신청 요청 상태입니다. 승인 반영 여부를 기다리면서 학습 목표를 미리 정리해 두는 것이 좋습니다.`
    }
    if (latest.enrollmentStatus === 'failed') {
      return `${latest.courseTitle} 과정 신청이 실패로 기록되어 있습니다. 실패 사유를 먼저 확인하고 비슷한 난이도의 대체 과정을 검토해 보세요.`
    }
    if (latest.enrollmentStatus === 'return-missing') {
      return `${latest.courseTitle} 과정은 복귀 확인이 필요한 상태입니다. 처리 여부를 먼저 확인한 뒤 필요하면 대체 과정을 이어서 선택하는 것이 좋습니다.`
    }
    return `${latest.courseTitle} 과정은 현재 수강 중입니다. 실무에 바로 써볼 포인트 1개를 정해서 적용해 보세요.`
  }

  if (normalized.includes('추천') || normalized.includes('이유') || normalized.includes('왜')) {
    if (!topCourse) {
      return `아직 추천 과정이 생성되지 않았습니다. 진단을 완료하면 ${topGap} 보완을 기준으로 추천 순서를 제안해드릴 수 있습니다.`
    }
    return `${topCourse.courseTitle}이 먼저 추천되는 이유는 현재 ${topGap} 보완이 가장 시급하고, 이 과정이 가장 빠르게 실무 적용 효과를 줄 수 있기 때문입니다.`
  }

  if (normalized.includes('코칭') || normalized.includes('과정')) {
    if (!topCourse) {
      return `먼저 추천 과정에서 한 과정을 선택해 주세요. 선택한 뒤에는 그 과정 기준으로 더 구체적인 학습 코칭을 이어드릴 수 있습니다.`
    }
    return `${topCourse.courseTitle}을 시작한다면 첫 목표는 핵심 개념 1개를 정리하고, 이번 주 안에 업무 적용 장면 1개를 연결하는 것입니다.`
  }

  return `${name}님의 현재 상태를 보면 ${score ? `역량 점수는 ${score}점이고, ` : ''}${topGap} 보완이 가장 중요합니다. 지금 가장 좋은 다음 행동은 추천 과정 1개를 고르고 바로 수강 신청까지 이어가는 것입니다.`
}

async function buildChatbotReply(payload) {
  if (!OPENAI_API_KEY) {
    return buildChatbotFallback(payload)
  }

  const diagnosisSummary = payload?.diagnosis
    ? JSON.stringify({
        topGaps: payload.diagnosis.topGaps,
        totalScore: payload.diagnosis.totalScore,
        maxScore: payload.diagnosis.maxScore,
      })
    : 'null'
  const courseSummary = Array.isArray(payload?.courses)
    ? payload.courses.slice(0, 3).map((course) => ({
        title: course.courseTitle,
        level: course.level,
        durationHours: course.durationHours,
        fitScore: course.fitScore,
      }))
    : []

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                '당신은 현대위아 온러닝서처의 AI 학습 코치다. 진단 결과와 추천 과정, 신청 상태를 바탕으로 한국어로 짧고 실무적인 답변을 제공하라. 절대 준비중이라고 말하지 말고, 바로 상담 답변을 제공하라.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `질문: ${payload?.question || ''}\n프로필: ${JSON.stringify(payload?.profile || {})}\n진단요약: ${diagnosisSummary}\n추천과정: ${JSON.stringify(courseSummary)}\n신청이력: ${JSON.stringify(payload?.enrollments || [])}`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`)
  }

  const data = await response.json()
  const output = Array.isArray(data.output) ? data.output : []
  const texts = output
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text)
  return texts.join('\n').trim() || buildChatbotFallback(payload)
}

function setCors(req, res) {
  const origin = req.headers.origin
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
}

function sendJson(req, res, statusCode, body) {
  setCors(req, res)
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function sendError(req, res, statusCode, code, message) {
  const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  setCors(req, res)
  res.setHeader('x-trace-id', traceId)
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(
    JSON.stringify({
      error: {
        code,
        message,
        traceId,
      },
    }),
  )
}

function sendHtml(req, res, statusCode, body) {
  setCors(req, res)
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(body)
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 1_000_000) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!data) {
        resolve(undefined)
        return
      }
      try {
        resolve(JSON.parse(data))
      } catch {
        reject(new Error('Invalid JSON payload'))
      }
    })
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendError(req, res, 400, 'BAD_REQUEST', 'Bad request')
    return
  }

  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (req.method === 'OPTIONS') {
    setCors(req, res)
    res.statusCode = 204
    res.end()
    return
  }

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(req, res, 200, {
        ok: true,
        service: 'on-learning-remote-mock',
        stage: getJourneyStage(),
        now: new Date().toISOString(),
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/auth/session') {
      sendJson(req, res, 200, {
        authenticated: session.authenticated,
        profile: session.profile,
        role: session.role,
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/auth/callback') {
      const status = url.searchParams.get('status')
      if (status === 'error') {
        session = { authenticated: false }
        sendJson(req, res, 200, { authenticated: false })
        return
      }

      const employeeId = url.searchParams.get('employeeId') || 'E1001'
      const name = url.searchParams.get('name') || 'Demo User'
      const organization = url.searchParams.get('organization') || 'Learning Team'
      const role = url.searchParams.get('role')
      const safeRole = role === 'manager' || role === 'admin' ? role : 'employee'

      session = {
        authenticated: true,
        profile: { employeeId, name, organization },
        role: safeRole,
      }

      sendJson(req, res, 200, {
        authenticated: true,
        profile: session.profile,
        role: session.role,
      })
      return
    }

    if (req.method === 'PUT' && url.pathname === '/profile') {
      const payload = await readJson(req)
      if (!payload || typeof payload !== 'object') {
        sendError(req, res, 400, 'BAD_REQUEST', 'Invalid profile payload')
        return
      }
      const employeeId = typeof payload.employeeId === 'string' ? payload.employeeId : ''
      const name = typeof payload.name === 'string' ? payload.name : ''
      const organization = typeof payload.organization === 'string' ? payload.organization : ''
      if (!employeeId || !name || !organization) {
        sendError(req, res, 400, 'BAD_REQUEST', 'Missing profile fields')
        return
      }

      session = {
        authenticated: true,
        role: session.role || 'employee',
        profile: { employeeId, name, organization },
      }
      sendJson(req, res, 200, session.profile)
      return
    }

    if (req.method === 'GET' && url.pathname === '/diagnosis') {
      sendJson(req, res, 200, diagnosis)
      return
    }

    if (req.method === 'POST' && url.pathname === '/diagnosis') {
      const payload = await readJson(req)
      diagnosis = payload ?? null
      selectedCourse = null
      journeyEvents = [createEvent('diagnosis_submitted', 'Diagnosis submitted'), ...journeyEvents].slice(0, 200)
      sendJson(req, res, 200, { ok: true })
      return
    }

    if (req.method === 'GET' && url.pathname === '/recommendations') {
      const level = url.searchParams.get('level') || 'all'
      const list = coursePool
        .map((course) => ({ ...course, fitScore: scoreCourse(course) }))
        .sort((a, b) => b.fitScore - a.fitScore)
        .filter((course) => (level === 'all' ? true : course.level === level))
      sendJson(req, res, 200, list)
      return
    }

    if (req.method === 'POST' && url.pathname === '/chatbot/reply') {
      const payload = await readJson(req)
      const answer = await buildChatbotReply(payload)
      sendJson(req, res, 200, { answer })
      return
    }

    if (req.method === 'POST' && url.pathname === '/recommendations/select') {
      const payload = await readJson(req)
      selectedCourse = payload ?? null
      journeyEvents = [createEvent('course_selected', `Course selected: ${selectedCourse?.courseId ?? ''}`), ...journeyEvents].slice(0, 200)
      sendJson(req, res, 200, { ok: true })
      return
    }

    if (req.method === 'GET' && url.pathname === '/selected-course') {
      sendJson(req, res, 200, selectedCourse)
      return
    }

    if (req.method === 'GET' && url.pathname === '/enrollments') {
      sendJson(req, res, 200, enrollments)
      return
    }

    if (req.method === 'POST' && url.pathname === '/enrollments') {
      const payload = await readJson(req)
      if (payload) {
        enrollments = [payload, ...enrollments].slice(0, 200)
        const label =
          payload.enrollmentStatus === 'enrolled'
            ? `Enrollment completed: ${payload.courseId}`
            : `Enrollment failed: ${payload.courseId}`
        journeyEvents = [createEvent('enrollment_submitted', label), ...journeyEvents].slice(0, 200)
      }
      sendJson(req, res, 200, { ok: true })
      return
    }

    if (req.method === 'GET' && url.pathname === '/journey/events') {
      sendJson(req, res, 200, journeyEvents)
      return
    }

    if (req.method === 'GET' && url.pathname === '/journey/stage') {
      sendJson(req, res, 200, getJourneyStage())
      return
    }

    if (req.method === 'GET' && url.pathname === '/ecampus/apply') {
      const callbackUrl = url.searchParams.get('callback_url')
      const courseId = url.searchParams.get('courseId') || ''

      if (!callbackUrl) {
        sendHtml(
          req,
          res,
          400,
          '<!doctype html><html><body><h1>Missing callback_url</h1></body></html>',
        )
        return
      }

      const success = new URL(callbackUrl)
      success.searchParams.set('enrollment', 'success')
      if (courseId) success.searchParams.set('courseId', courseId)

      const failed = new URL(callbackUrl)
      failed.searchParams.set('enrollment', 'failed')
      if (courseId) failed.searchParams.set('courseId', courseId)

      sendHtml(
        req,
        res,
        200,
        `<!doctype html>
<html>
  <body style="font-family: sans-serif; max-width: 720px; margin: 40px auto; line-height: 1.5;">
    <h1>E-campus Mock Apply</h1>
    <p>Choose a result to return to the app callback route.</p>
    <p><a href="${success.toString()}">Return success</a></p>
    <p><a href="${failed.toString()}">Return failed</a></p>
  </body>
</html>`,
      )
      return
    }

    sendError(req, res, 404, 'NOT_FOUND', 'Not found')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    sendError(req, res, 500, 'SERVER', message)
  }
})

server.listen(PORT, () => {
  console.log(`[remote-mock] listening on http://localhost:${PORT}`)
  console.log('[remote-mock] endpoints: /health, /auth/session, /diagnosis, /recommendations, /enrollments')
})
