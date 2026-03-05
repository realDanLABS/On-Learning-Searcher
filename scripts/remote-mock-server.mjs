#!/usr/bin/env node
import http from 'node:http'

const PORT = Number(process.env.REMOTE_MOCK_PORT || 8787)
const ALLOWED_ORIGIN = process.env.REMOTE_MOCK_ORIGIN || 'http://127.0.0.1:4173'

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
    sendJson(req, res, 400, { error: 'Bad request' })
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

    sendJson(req, res, 404, { error: 'Not found' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    sendJson(req, res, 500, { error: message })
  }
})

server.listen(PORT, () => {
  console.log(`[remote-mock] listening on http://localhost:${PORT}`)
  console.log('[remote-mock] endpoints: /health, /auth/session, /diagnosis, /recommendations, /enrollments')
})
