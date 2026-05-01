import crypto from 'node:crypto'
import { buildRecommendationSignals, normalizeCourseImportRows } from './_lib/courseCatalog.js'
import { ensureSchema, getPool, verifyPassword } from './_lib/db.js'

const COOKIE_NAME = 'on_learning_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

export default async function handler(req, res) {
  await ensureSchema()
  const pool = getPool()
  const pathname = normalizePath(req.url || '/')

  try {
    if (req.method === 'GET' && pathname === '/health') {
      return sendJson(res, 200, { ok: true, service: 'on-learning-vercel-api', now: new Date().toISOString() })
    }

    if (req.method === 'POST' && pathname === '/auth/login') {
      const body = await readJson(req)
      const employeeId = String(body?.employeeId || '').trim()
      const password = String(body?.password || '')
      const user = (await pool.query(`select * from app.users where employee_id = $1`, [employeeId])).rows[0]
      if (!user || !verifyPassword(password, user.password_hash)) {
        return sendJson(res, 401, { error: { code: 'UNAUTHORIZED', message: '로그인 정보가 일치하지 않습니다.' } })
      }
      const session = await createSession(pool, user.id)
      res.setHeader('Set-Cookie', buildSessionCookie(session.token, session.expiresAt))
      return sendJson(res, 200, { authenticated: true, profile: sanitizeUser(user), role: user.role })
    }

    if (req.method === 'POST' && pathname === '/auth/signup') {
      const body = await readJson(req)
      const employeeId = String(body?.employeeId || '').trim()
      const companyEmail = String(body?.companyEmail || '').trim().toLowerCase()
      const password = String(body?.password || '')
      const division = String(body?.division || '').trim()
      const office = String(body?.office || '').trim()
      const team = String(body?.team || '').trim()
      const name = String(body?.name || '').trim()
      const interestCourse = String(body?.interestCourse || '').trim()
      const organization = [division, office, team].filter(Boolean).join(' / ') || '현대위아'

      if (!employeeId || !companyEmail || !password || !name || !division || !team) {
        return sendJson(res, 400, { error: { code: 'BAD_REQUEST', message: '회원가입 필수 항목이 누락되었습니다.' } })
      }

      const duplicated = await pool.query(
        `select 1 from app.users where employee_id = $1 or company_email = $2 limit 1`,
        [employeeId, companyEmail],
      )
      if (duplicated.rowCount) {
        return sendJson(res, 409, { error: { code: 'CONFLICT', message: '이미 가입된 사원번호 또는 이메일입니다.' } })
      }

      const userId = crypto.randomUUID()
      const role = 'employee'
      const now = new Date().toISOString()
      const passwordHash = hashPassword(password)
      await pool.query(
        `insert into app.users (
          id, employee_id, password_hash, role, name, organization, division, office, team, company_email, interest_course, created_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [userId, employeeId, passwordHash, role, name, organization, division, office, team, companyEmail, interestCourse, now],
      )
      const user = (await pool.query(`select * from app.users where id = $1`, [userId])).rows[0]
      const session = await createSession(pool, userId)
      res.setHeader('Set-Cookie', buildSessionCookie(session.token, session.expiresAt))
      return sendJson(res, 200, { authenticated: true, profile: sanitizeUser(user), role })
    }

    if (req.method === 'POST' && pathname === '/auth/logout') {
      const token = getCookie(req, COOKIE_NAME)
      if (token) {
        await pool.query(`delete from app.sessions where token = $1`, [token])
      }
      res.setHeader('Set-Cookie', buildSessionCookie('', new Date(0).toISOString(), true))
      return sendJson(res, 200, { ok: true })
    }

    if (req.method === 'GET' && pathname === '/auth/session') {
      const session = await getSession(pool, req)
      if (!session) return sendJson(res, 200, { authenticated: false })
      return sendJson(res, 200, { authenticated: true, profile: session.profile, role: session.role })
    }

    if (req.method === 'GET' && pathname === '/auth/callback') {
      const status = String(req.query?.status || 'success')
      if (status === 'error') {
        return sendJson(res, 200, { authenticated: false })
      }

      const employeeId = String(req.query?.employeeId || '').trim()
      const name = String(req.query?.name || '').trim()
      const organization = String(req.query?.organization || '').trim()
      if (!employeeId || !name || !organization) {
        return sendJson(res, 400, { error: { code: 'BAD_REQUEST', message: 'SSO 콜백 필수 정보가 누락되었습니다.' } })
      }

      let user = (await pool.query(`select * from app.users where employee_id = $1`, [employeeId])).rows[0]
      if (!user) {
        const userId = crypto.randomUUID()
        const now = new Date().toISOString()
        const fallbackEmail = `${employeeId}@hyundai-wia.local`
        const [division = organization, office = '', team = ''] = organization.split('/').map((part) => part.trim())
        await pool.query(
          `insert into app.users (
            id, employee_id, password_hash, role, name, organization, division, office, team, company_email, interest_course, created_at
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [userId, employeeId, hashPassword(crypto.randomUUID()), 'employee', name, organization, division, office, team, fallbackEmail, '', now],
        )
        user = (await pool.query(`select * from app.users where id = $1`, [userId])).rows[0]
      } else {
        await pool.query(
          `update app.users
           set name = $1, organization = $2
           where id = $3`,
          [name, organization, user.id],
        )
        user = (await pool.query(`select * from app.users where id = $1`, [user.id])).rows[0]
      }

      const session = await createSession(pool, user.id)
      res.setHeader('Set-Cookie', buildSessionCookie(session.token, session.expiresAt))
      return sendJson(res, 200, { authenticated: true, profile: sanitizeUser(user), role: user.role })
    }

    const session = await getSession(pool, req)

    if (req.method === 'PUT' && pathname === '/profile') {
      if (!session) return unauthorized(res)
      const body = await readJson(req)
      const division = String(body?.division || '').trim()
      const office = String(body?.office || '').trim()
      const team = String(body?.team || '').trim()
      const organization = String(body?.organization || [division, office, team].filter(Boolean).join(' / ') || '현대위아')
      await pool.query(
        `update app.users
         set name = $1, organization = $2, division = $3, office = $4, team = $5, company_email = $6, interest_course = $7
         where id = $8`,
        [
          String(body?.name || '').trim(),
          organization,
          division,
          office,
          team,
          String(body?.companyEmail || '').trim(),
          String(body?.interestCourse || '').trim(),
          session.userId,
        ],
      )
      const user = (await pool.query(`select * from app.users where id = $1`, [session.userId])).rows[0]
      return sendJson(res, 200, sanitizeUser(user))
    }

    if (req.method === 'GET' && pathname === '/diagnosis') {
      if (!session) return unauthorized(res)
      const targetUserId = await resolveRequestedUserId(pool, session, req)
      const row = (await pool.query(
        `select d.*, u.employee_id, u.name
           from app.diagnoses d
           join app.users u on u.id = d.user_id
          where d.user_id = $1
          order by d.diagnosed_at desc
          limit 1`,
        [targetUserId],
      )).rows[0]
      return sendJson(res, 200, parseDiagnosis(row))
    }

    if (req.method === 'POST' && pathname === '/diagnosis') {
      if (!session) return unauthorized(res)
      const body = await readJson(req)
      await pool.query(
        `insert into app.diagnoses (id, user_id, diagnosed_at, total_score, max_score, category_scores_json, top_gaps_json)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [
          crypto.randomUUID(),
          session.userId,
          body.diagnosedAt,
          body.totalScore,
          body.maxScore,
          JSON.stringify(body.categoryScores),
          JSON.stringify(body.topGaps),
        ],
      )
      await pool.query(`delete from app.selected_courses where user_id = $1`, [session.userId])
      await appendJourneyEvent(pool, session.userId, 'diagnosis_completed', `진단 완료 (${body.totalScore}/${body.maxScore})`, body.diagnosedAt)
      return sendJson(res, 200, { ok: true })
    }

    if (req.method === 'GET' && pathname === '/diagnosis/history') {
      if (!session) return unauthorized(res)
      const targetUserId = await resolveRequestedUserId(pool, session, req)
      const rows = (await pool.query(
        `select d.*, u.employee_id, u.name
           from app.diagnoses d
           join app.users u on u.id = d.user_id
          where d.user_id = $1
          order by d.diagnosed_at desc`,
        [targetUserId],
      )).rows
      return sendJson(res, 200, rows.map(parseDiagnosis))
    }

    if (req.method === 'GET' && pathname === '/recommendations') {
      if (!session) return unauthorized(res)
      const level = String(req.query?.level || 'all')
      const targetUserId = await resolveRequestedUserId(pool, session, req)
      const targetRole = targetUserId === session.userId
        ? session.role
        : ((await pool.query(`select role from app.users where id = $1`, [targetUserId])).rows[0]?.role || session.role)
      const recommendations = await buildRecommendations(pool, targetUserId, targetRole, level)
      return sendJson(res, 200, recommendations)
    }

    if (req.method === 'POST' && pathname === '/recommendations/select') {
      if (!session) return unauthorized(res)
      const body = await readJson(req)
      await pool.query(
        `insert into app.selected_courses (user_id, course_json, updated_at)
         values ($1,$2,$3)
         on conflict (user_id) do update set course_json = excluded.course_json, updated_at = excluded.updated_at`,
        [session.userId, JSON.stringify(body), new Date().toISOString()],
      )
      await appendJourneyEvent(pool, session.userId, 'course_selected', `추천 과정 선택: ${body.courseTitle}`)
      return sendJson(res, 200, { ok: true })
    }

    if (req.method === 'GET' && pathname === '/selected-course') {
      if (!session) return unauthorized(res)
      const row = (await pool.query(`select * from app.selected_courses where user_id = $1`, [session.userId])).rows[0]
      return sendJson(res, 200, row ? row.course_json : null)
    }

    if (req.method === 'GET' && pathname === '/enrollments') {
      if (!session) return unauthorized(res)
      const rows = (await pool.query(`select * from app.enrollments where user_id = $1 order by enrollment_requested_at desc`, [session.userId])).rows
      return sendJson(res, 200, rows.map((row) => ({
        userId: session.profile.employeeId,
        courseId: row.course_id,
        courseTitle: row.course_title,
        enrollmentRequestedAt: row.enrollment_requested_at,
        enrollmentStatus: row.enrollment_status,
        failureReason: row.failure_reason || undefined,
      })))
    }

    if (req.method === 'POST' && pathname === '/enrollments') {
      if (!session) return unauthorized(res)
      const body = await readJson(req)
      await pool.query(
        `insert into app.enrollments (id, user_id, course_id, course_title, enrollment_requested_at, enrollment_status, failure_reason)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [crypto.randomUUID(), session.userId, body.courseId, body.courseTitle, body.enrollmentRequestedAt, body.enrollmentStatus, body.failureReason || null],
      )
      await appendJourneyEvent(pool, session.userId, 'enrollment_completed', `신청 처리: ${body.courseTitle} (${body.enrollmentStatus})`, body.enrollmentRequestedAt)
      return sendJson(res, 200, { ok: true })
    }

    if (req.method === 'GET' && pathname === '/journey/events') {
      if (!session) return unauthorized(res)
      const rows = (await pool.query(`select id, type, at, label from app.journey_events where user_id = $1 order by at desc limit 200`, [session.userId])).rows
      return sendJson(res, 200, rows)
    }

    if (req.method === 'GET' && pathname === '/journey/stage') {
      if (!session) return unauthorized(res)
      const stage = await getJourneyStage(pool, session.userId)
      return sendJson(res, 200, stage)
    }

    if (req.method === 'POST' && pathname === '/chatbot/reply') {
      if (!session) return unauthorized(res)
      const body = await readJson(req)
      const question = String(body?.question || '').trim()
      const normalizedQuestion = question.toLowerCase()
      const topGap = body?.diagnosis?.topGaps?.[0] || 'AI/자동화 활용'
      const topGapList = Array.isArray(body?.diagnosis?.topGaps) && body.diagnosis.topGaps.length
        ? body.diagnosis.topGaps.join(', ')
        : topGap
      const diagnosisScore = Number(body?.diagnosis?.totalScore || 0)
      const courses = Array.isArray(body?.courses) ? body.courses : []
      const enrollments = Array.isArray(body?.enrollments) ? body.enrollments : []
      const selectedCourse = courses[0] || null
      const latestEnrollment = enrollments[0] || null
      const completedCourses = enrollments.filter((item) => item?.enrollmentStatus === 'enrolled')

      const answer = (() => {
        if (!question) {
          return `${session.profile.name}님, 현재 기준으로는 ${topGap} 보완이 우선입니다. 추천 과정 상단부터 순서대로 확인해 보시면 가장 빠르게 다음 학습을 정할 수 있습니다.`
        }

        if (normalizedQuestion.includes('부족') || normalizedQuestion.includes('역량') || normalizedQuestion.includes('약한')) {
          return `${session.profile.name}님의 현재 보완 우선 역량은 ${topGapList}입니다. 현재 진단 점수는 ${diagnosisScore || '미확인'}점이고, 가장 먼저 추천 과정 1단계부터 시작하는 것이 좋습니다.`
        }

        if (normalizedQuestion.includes('신청') || normalizedQuestion.includes('수강') || normalizedQuestion.includes('이수') || normalizedQuestion.includes('완료')) {
          if (latestEnrollment?.enrollmentStatus === 'enrolled') {
            return `최근 완료한 추천 과정은 ${latestEnrollment.courseTitle}입니다. 현재 추천 과정 이수 현황은 ${completedCourses.length}개 완료 상태입니다.`
          }
          if (latestEnrollment?.enrollmentStatus === 'requested') {
            return `가장 최근 신청한 과정은 ${latestEnrollment.courseTitle}이고 현재 상태는 신청 완료입니다. 수강 완료 처리 후 나의 학습과 학습 경로 상태도 함께 갱신됩니다.`
          }
          if (latestEnrollment?.enrollmentStatus === 'return-missing') {
            return `최근 신청 과정인 ${latestEnrollment.courseTitle}은 복귀 확인이 필요한 상태입니다. 먼저 신청 상태를 정리한 뒤 다음 추천 과정을 이어가는 것이 좋습니다.`
          }
          if (latestEnrollment?.enrollmentStatus === 'failed') {
            return `최근 신청 과정인 ${latestEnrollment.courseTitle}은 신청 실패로 기록되어 있습니다. 다른 추천 과정을 먼저 확인하거나 다시 신청해 보세요.`
          }
          return '아직 신청하거나 수강 완료한 추천 과정이 없습니다. 추천 과정 상단의 1개 과정을 먼저 선택해 시작해 보세요.'
        }

        if (normalizedQuestion.includes('추천 이유') || normalizedQuestion.includes('왜') || normalizedQuestion.includes('추천')) {
          if (selectedCourse) {
            return `${selectedCourse.courseTitle}은(는) ${topGap} 보완 우선순위와 현재 진단 결과를 바탕으로 가장 먼저 추천된 과정입니다. 학습시간은 ${selectedCourse.durationHours}시간이며, 지금 시작하기에 가장 적합한 과정입니다.`
          }
          return `${session.profile.name}님에게는 ${topGap} 보완 우선순위를 기준으로 추천 과정이 정렬됩니다. 추천 과정 페이지에서 상단 과정부터 확인해 보세요.`
        }

        if (normalizedQuestion.includes('다음') || normalizedQuestion.includes('뭐부터') || normalizedQuestion.includes('어떻게') || normalizedQuestion.includes('학습')) {
          if (selectedCourse) {
            return `다음 학습으로는 ${selectedCourse.courseTitle}부터 시작하는 것을 권장합니다. 그다음에는 학습 경로에 보이는 다음 추천 과정을 순서대로 이어가면 됩니다.`
          }
          return `${session.profile.name}님은 먼저 진단 결과 기준 1순위 추천 과정을 선택하고, 수강 완료 후 다음 추천 과정을 이어가는 방식이 가장 좋습니다.`
        }

        return `${session.profile.name}님의 현재 상태 기준으로는 ${topGap} 보완이 가장 중요합니다. 최근 추천 과정과 학습 이력을 함께 보면 다음 행동을 더 정확하게 정할 수 있습니다.`
      })()
      return sendJson(res, 200, {
        answer,
      })
    }

    if (pathname.startsWith('/admin')) {
      if (!session) return unauthorized(res)
      if (session.role !== 'admin') return sendJson(res, 403, { error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } })

      if (req.method === 'GET' && pathname === '/admin/dashboard') {
        return sendJson(res, 200, await buildAdminDashboardPayload(pool, session))
      }
      if (req.method === 'GET' && pathname === '/admin/departments') {
        return sendJson(res, 200, await buildAdminDepartmentsPayload(pool, session, String(req.query?.division || '').trim()))
      }
      if (req.method === 'GET' && pathname === '/admin/questions') {
        return sendJson(res, 200, await buildAdminQuestionsPayload(pool, session))
      }
      if (req.method === 'POST' && pathname === '/admin/questions') {
        const body = await readJson(req)
        await pool.query(
          `insert into app.questions (id, title, category, type, options_json, status, created_at)
           values ($1,$2,$3,'choice',$4,'활성',$5)`,
          [`q${Date.now()}`, body.title, body.category, JSON.stringify(body.options || defaultChoiceOptions), new Date().toISOString()],
        )
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'PUT' && pathname.startsWith('/admin/questions/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        const body = await readJson(req)
        await pool.query(`update app.questions set title = $1, category = $2 where id = $3`, [body.title, body.category, id])
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'DELETE' && pathname.startsWith('/admin/questions/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        await pool.query(`delete from app.questions where id = $1`, [id])
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'GET' && pathname === '/admin/courses') {
        return sendJson(res, 200, await buildAdminCoursesPayload(pool, session))
      }
      if (req.method === 'GET' && pathname === '/admin/courses/import-history') {
        const rows = (
          await pool.query(
            `select h.*, u.name as uploaded_by_name
               from app.course_import_history h
               left join app.users u on u.id = h.uploaded_by
              order by h.uploaded_at desc
              limit 20`,
          )
        ).rows
        return sendJson(res, 200, rows.map((row) => ({
          id: row.id,
          fileName: row.file_name,
          uploadedAt: row.uploaded_at,
          processedCount: row.processed_count,
          replaceMode: row.replace_mode,
          status: row.status,
          detail: row.detail,
          uploadedBy: row.uploaded_by_name || '',
        })))
      }
      if (req.method === 'GET' && pathname === '/admin/courses/catalog') {
        const rows = (await pool.query(`select * from app.courses order by competency_area asc, rank_in_area asc, created_at asc`)).rows
        return sendJson(res, 200, rows.map(parseCourse))
      }
      if (req.method === 'POST' && pathname === '/admin/courses') {
        const body = await readJson(req)
        const rankResult = await pool.query(`select count(*)::int as count from app.courses where competency_area = $1`, [body.competencyArea])
        const rank = Number(rankResult.rows[0]?.count || 0) + 1
        await pool.query(
          `insert into app.courses (
            id, course_title, level, duration_hours, competency_area, summary, objectives_json,
            target_audience_json, expected_outcomes_json, reason_tags_json, recommended_by, rank_in_area, status, created_at
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'운영중',$13)`,
          [
            `ADM-${Date.now()}`,
            body.courseTitle,
            body.level,
            body.durationHours,
            body.competencyArea,
            body.summary,
            JSON.stringify(body.objectives || ['핵심 개념 정리', '현업 적용 포인트 확보']),
            JSON.stringify(body.targetAudience || ['현대위아 구성원']),
            JSON.stringify(body.expectedOutcomes || ['추천 과정 확대']),
            JSON.stringify(body.reasonTags || ['관리자추가']),
            body.recommendedBy || 'role-fit',
            rank,
            new Date().toISOString(),
          ],
        )
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'POST' && pathname === '/admin/courses/import') {
        const body = await readJson(req)
        const rows = Array.isArray(body?.rows) ? body.rows : []
        const replace = Boolean(body?.replace)
        const fileName = String(body?.fileName || '').trim() || 'course_list_upload.xlsx'
        if (!rows.length) {
          return sendJson(res, 400, { error: { code: 'BAD_REQUEST', message: '업로드할 과정 데이터가 없습니다.' } })
        }
        const client = await pool.connect()
        let normalizedCourses = []
        try {
          await client.query('begin')
          if (replace) {
            await client.query(`delete from app.courses`)
          }
          const rankRows = (await client.query(`select competency_area, count(*)::int as count from app.courses group by competency_area`)).rows
          const rankCounts = Object.fromEntries(rankRows.map((row) => [row.competency_area, row.count]))
          normalizedCourses = normalizeCourseImportRows(rows, rankCounts)
          const chunkSize = 200
          for (let offset = 0; offset < normalizedCourses.length; offset += chunkSize) {
            const chunk = normalizedCourses.slice(offset, offset + chunkSize)
            const values = []
            const placeholders = chunk.map((course, rowIndex) => {
              const base = rowIndex * 22
              values.push(
                course.id,
                course.courseTitle,
                course.level,
                course.durationHours,
                course.competencyArea,
                course.summary,
                JSON.stringify(course.objectives),
                JSON.stringify(course.targetAudience),
                JSON.stringify(course.expectedOutcomes),
                JSON.stringify(course.reasonTags),
                course.recommendedBy,
                course.rankInArea,
                course.status,
                new Date().toISOString(),
                course.previewUrl,
                course.previewLabel,
                course.category1,
                course.category2,
                course.contentCount,
                course.instructor,
                course.hasAssessment,
                course.durationText,
              )
              return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12},$${base + 13},$${base + 14},$${base + 15},$${base + 16},$${base + 17},$${base + 18},$${base + 19},$${base + 20},$${base + 21},$${base + 22})`
            })
            await client.query(
              `insert into app.courses (
                id, course_title, level, duration_hours, competency_area, summary, objectives_json,
                target_audience_json, expected_outcomes_json, reason_tags_json, recommended_by, rank_in_area,
                status, created_at, preview_url, preview_label, source_category_1, source_category_2,
                content_count, instructor, has_assessment, source_duration_text
              ) values ${placeholders.join(',')}`,
              values,
            )
          }
          await client.query('commit')
        } catch (error) {
          await client.query('rollback')
          await pool.query(
            `insert into app.course_import_history (
              id, uploaded_by, file_name, uploaded_at, processed_count, replace_mode, status, detail
            ) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              crypto.randomUUID(),
              session.userId,
              fileName,
              new Date().toISOString(),
              rows.length,
              replace,
              'fail',
              error instanceof Error ? error.message : '과정 업로드 실패',
            ],
          )
          throw error
        } finally {
          client.release()
        }
        await pool.query(
          `insert into app.course_import_history (
            id, uploaded_by, file_name, uploaded_at, processed_count, replace_mode, status, detail
          ) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            crypto.randomUUID(),
            session.userId,
            fileName,
            new Date().toISOString(),
            normalizedCourses.length,
            replace,
            'success',
            replace ? '기존 데이터를 교체하고 업로드 완료' : '기존 데이터 유지 후 업로드 완료',
          ],
        )
        return sendJson(res, 200, {
          ok: true,
          importedCount: normalizedCourses.length,
          replace,
        })
      }
      if (req.method === 'PUT' && pathname.startsWith('/admin/courses/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        const body = await readJson(req)
        await pool.query(
          `update app.courses set course_title = $1, competency_area = $2, level = $3, duration_hours = $4, summary = $5 where id = $6`,
          [body.courseTitle, body.competencyArea, body.level, body.durationHours, body.summary, id],
        )
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'DELETE' && pathname.startsWith('/admin/courses/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        await pool.query(`delete from app.courses where id = $1`, [id])
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'GET' && pathname === '/admin/users') {
        return sendJson(res, 200, await buildAdminUsersPayload(pool, session))
      }
      if (req.method === 'POST' && pathname === '/admin/users') {
        const body = await readJson(req)
        const employeeId = String(body.employeeId || '').trim()
        const name = String(body.name || '').trim()
        const division = String(body.division || '').trim()
        const team = String(body.team || '').trim()
        const email = String(body.email || '').trim().toLowerCase()
        const interestCourse = String(body.interestCourse || '').trim()
        const role = normalizeRole(body.role)
        if (!employeeId || !name || !division || !team || !email) {
          return sendJson(res, 400, { error: { code: 'INVALID_INPUT', message: '회원 정보를 모두 입력해주세요.' } })
        }
        const existing = (await pool.query(`select id from app.users where employee_id = $1 or company_email = $2 limit 1`, [employeeId, email])).rows[0]
        if (existing) {
          return sendJson(res, 409, { error: { code: 'DUPLICATE_USER', message: '이미 등록된 회원입니다.' } })
        }
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        await pool.query(
          `insert into app.users (
            id, employee_id, password_hash, role, name, organization, division, office, team, company_email, interest_course, created_at
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [id, employeeId, hashPassword(crypto.randomUUID()), role, name, `${division} / ${team}`, division, '', team, email, interestCourse, now],
        )
        return sendJson(res, 200, { ok: true, id })
      }
      if (req.method === 'POST' && pathname === '/admin/users/import') {
        const body = await readJson(req)
        const users = Array.isArray(body.users) ? body.users : []
        let importedCount = 0
        let updatedCount = 0
        const seenKeys = new Set()
        for (const rawUser of users) {
          const employeeId = String(rawUser.employeeId || '').trim()
          const name = String(rawUser.name || '').trim()
          const division = String(rawUser.division || '').trim()
          const team = String(rawUser.team || '').trim()
          const email = String(rawUser.email || '').trim().toLowerCase()
          const interestCourse = String(rawUser.interestCourse || '').trim()
          const role = normalizeRole(rawUser.role)
          if (!employeeId || !name || !division || !team || !email) continue
          const dedupeKey = `${employeeId}::${email}`
          if (seenKeys.has(dedupeKey)) continue
          seenKeys.add(dedupeKey)
          const organization = `${division} / ${team}`
          const existing = (await pool.query(`select id from app.users where employee_id = $1 or company_email = $2 order by created_at desc limit 1`, [employeeId, email])).rows[0]
          if (existing) {
            await pool.query(
              `update app.users
               set name = $1, organization = $2, division = $3, team = $4, company_email = $5, interest_course = $6, role = $7
               where id = $8`,
              [name, organization, division, team, email, interestCourse, role, existing.id],
            )
            updatedCount += 1
            continue
          }
          await pool.query(
            `insert into app.users (
              id, employee_id, password_hash, role, name, organization, division, office, team, company_email, interest_course, created_at
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [crypto.randomUUID(), employeeId, hashPassword(crypto.randomUUID()), role, name, organization, division, '', team, email, interestCourse, new Date().toISOString()],
          )
          importedCount += 1
        }
        return sendJson(res, 200, { ok: true, importedCount, updatedCount })
      }
      if (req.method === 'PUT' && pathname.startsWith('/admin/users/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        const current = (await pool.query(`select * from app.users where id = $1`, [id])).rows[0]
        const body = await readJson(req)
        const organization = [String(body.division || current.division), String(body.team || current.team)].filter(Boolean).join(' / ') || current.organization
        await pool.query(
          `update app.users set name=$1, organization=$2, division=$3, team=$4, interest_course=$5, role=$6, employee_id=$7, admin_status_override=$8 where id=$9`,
          [
            String(body.name || current.name),
            organization,
            String(body.division || current.division),
            String(body.team || current.team),
            String(body.interestCourse || current.interest_course),
            String(body.role || current.role),
            String(body.employeeId || current.employee_id),
            body.statusOverride == null ? (current.admin_status_override || null) : (String(body.statusOverride || '') || null),
            id,
          ],
        )
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'DELETE' && pathname.startsWith('/admin/users/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        if (id === session.userId) {
          return sendJson(res, 400, { error: { code: 'BAD_REQUEST', message: '현재 로그인한 관리자 계정은 삭제할 수 없습니다.' } })
        }
        const body = await readJson(req)
        const target = (await pool.query(`select id, employee_id, role, name from app.users where id = $1`, [id])).rows[0]
        if (!target) {
          return sendJson(res, 404, { error: { code: 'NOT_FOUND', message: '삭제할 회원을 찾을 수 없습니다.' } })
        }
        const confirmationEmployeeId = String(body?.confirmationEmployeeId || '').trim()
        if (!confirmationEmployeeId || confirmationEmployeeId !== target.employee_id) {
          return sendJson(res, 400, { error: { code: 'BAD_REQUEST', message: '삭제 확인용 사번이 일치하지 않습니다.' } })
        }
        if (target.role === 'admin') {
          const adminCount = Number((await pool.query(`select count(*)::int as count from app.users where role = 'admin'`)).rows[0]?.count || 0)
          if (adminCount <= 1) {
            return sendJson(res, 400, { error: { code: 'BAD_REQUEST', message: '마지막 관리자 계정은 삭제할 수 없습니다.' } })
          }
        }
        await pool.query(`delete from app.users where id = $1`, [id])
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'GET' && pathname === '/admin/boards') {
        return sendJson(res, 200, {
          userName: session.profile.name,
          notices: (await pool.query(`select * from app.notices order by created_at desc, id desc`)).rows,
          faqs: (await pool.query(`select * from app.faqs order by created_at desc, id desc`)).rows,
        })
      }
      if (req.method === 'POST' && pathname === '/admin/notices') {
        const body = await readJson(req)
        const now = new Date().toISOString()
        await pool.query(
          `insert into app.notices (id, category, date, title, summary, status, created_at, updated_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [`notice-${Date.now()}`, body.category, now.slice(0, 10).replaceAll('-', '.'), body.title, body.summary, '게시중', now, now],
        )
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'PUT' && pathname.startsWith('/admin/notices/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        const body = await readJson(req)
        await pool.query(
          `update app.notices set category=$1, title=$2, summary=$3, updated_at=$4 where id=$5`,
          [body.category, body.title, body.summary, new Date().toISOString(), id],
        )
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'DELETE' && pathname.startsWith('/admin/notices/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        await pool.query(`delete from app.notices where id = $1`, [id])
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'POST' && pathname === '/admin/faqs') {
        const body = await readJson(req)
        const now = new Date().toISOString()
        await pool.query(
          `insert into app.faqs (id, question, answer, status, created_at, updated_at) values ($1,$2,$3,$4,$5,$6)`,
          [`faq-${Date.now()}`, body.question, body.answer, '게시중', now, now],
        )
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'PUT' && pathname.startsWith('/admin/faqs/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        const body = await readJson(req)
        await pool.query(
          `update app.faqs set question=$1, answer=$2, updated_at=$3 where id=$4`,
          [body.question, body.answer, new Date().toISOString(), id],
        )
        return sendJson(res, 200, { ok: true })
      }
      if (req.method === 'DELETE' && pathname.startsWith('/admin/faqs/')) {
        const id = decodeURIComponent(pathname.split('/').pop())
        await pool.query(`delete from app.faqs where id = $1`, [id])
        return sendJson(res, 200, { ok: true })
      }
    }

    return sendJson(res, 404, { error: { code: 'NOT_FOUND', message: '요청한 경로를 찾을 수 없습니다.' } })
  } catch (error) {
    return sendJson(res, 500, { error: { code: 'SERVER', message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' } })
  }
}

function normalizePath(url) {
  const parsed = new URL(url, 'https://vercel.local')
  const path = parsed.pathname.startsWith('/api') ? parsed.pathname.slice(4) || '/' : parsed.pathname
  return path
}

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload)
}

function getCookie(req, key) {
  const header = req.headers.cookie || ''
  const cookies = Object.fromEntries(
    header
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const index = item.indexOf('=')
        return index === -1 ? [item, ''] : [item.slice(0, index), decodeURIComponent(item.slice(index + 1))]
      }),
  )
  return cookies[key]
}

function buildSessionCookie(token, expiresAt, remove = false) {
  const parts = [
    `${COOKIE_NAME}=${remove ? '' : encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${new Date(expiresAt).toUTCString()}`,
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string' && req.body.length) return JSON.parse(req.body)
  return {}
}

function sanitizeUser(row) {
  return {
    employeeId: row.employee_id,
    name: row.name,
    organization: row.organization,
    division: row.division || undefined,
    office: row.office || undefined,
    team: row.team || undefined,
    companyEmail: row.company_email || undefined,
    interestCourse: row.interest_course || undefined,
  }
}

async function getSession(pool, req) {
  await pool.query(`delete from app.sessions where expires_at < now()`)
  const token = getCookie(req, COOKIE_NAME)
  if (!token) return null
  const row = (await pool.query(
    `select s.token, s.user_id, s.expires_at, u.* from app.sessions s join app.users u on u.id = s.user_id where s.token = $1`,
    [token],
  )).rows[0]
  if (!row) return null
  return {
    token,
    userId: row.user_id,
    role: row.role,
    profile: sanitizeUser(row),
  }
}

async function createSession(pool, userId) {
  const token = crypto.randomBytes(24).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString()
  await pool.query(`insert into app.sessions (token, user_id, created_at, expires_at) values ($1,$2,$3,$4)`, [
    token,
    userId,
    now.toISOString(),
    expiresAt,
  ])
  return { token, expiresAt }
}

async function appendJourneyEvent(pool, userId, type, label, at = new Date().toISOString()) {
  await pool.query(`insert into app.journey_events (id, user_id, type, at, label) values ($1,$2,$3,$4,$5)`, [
    crypto.randomUUID(),
    userId,
    type,
    at,
    label,
  ])
}

async function resolveRequestedUserId(pool, session, req) {
  const requestedUserId = String(req.query?.userId || '').trim()
  if (!requestedUserId || requestedUserId === session.userId) return session.userId
  if (session.role !== 'admin') return session.userId
  const row = (await pool.query(`select id from app.users where id = $1`, [requestedUserId])).rows[0]
  return row?.id || session.userId
}

function parseDiagnosis(row) {
  if (!row) return null
  return {
    userId: row.user_id,
    employeeId: row.employee_id || undefined,
    userName: row.name || undefined,
    diagnosedAt: row.diagnosed_at,
    totalScore: row.total_score,
    maxScore: row.max_score,
    categoryScores: row.category_scores_json,
    topGaps: row.top_gaps_json,
  }
}

function parseCourse(row) {
  return {
    courseId: row.id,
    courseTitle: row.course_title,
    level: row.level,
    durationHours: row.duration_hours,
    competencyArea: row.competency_area,
    summary: row.summary,
    objectives: row.objectives_json,
    targetAudience: row.target_audience_json,
    expectedOutcomes: row.expected_outcomes_json,
    reasonTags: row.reason_tags_json,
    recommendedBy: row.recommended_by,
    previewUrl: row.preview_url,
    previewLabel: row.preview_label,
    sourceCategory1: row.source_category_1,
    sourceCategory2: row.source_category_2,
    contentCount: row.content_count,
    instructor: row.instructor,
    hasAssessment: row.has_assessment,
    sourceDurationText: row.source_duration_text,
  }
}

async function buildRecommendations(pool, userId, role, level) {
  const diagnosisRow = (await pool.query(`select * from app.diagnoses where user_id = $1 order by diagnosed_at desc limit 1`, [userId])).rows[0]
  const diagnosis = parseDiagnosis(diagnosisRow)
  const rows = (await pool.query(`select * from app.courses order by competency_area asc, rank_in_area asc, created_at asc`)).rows
  const scored = rows
    .map((row) => {
      const course = parseCourse(row)
      return { ...course, fitScore: scoreCourse(course, diagnosis, role) }
    })
    .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))
  const filtered = level === 'all' ? scored : scored.filter((course) => course.level === level)
  return diversifyRecommendations(filtered, diagnosis)
}

function diversifyRecommendations(courses, diagnosis) {
  if (!courses.length || !diagnosis?.topGaps?.length) return courses

  const taken = new Set()
  const diversified = []
  const areaQuota = new Map()
  const topWindowLimit = 5
  const perAreaLimitInTopWindow = 2

  for (const area of diagnosis.topGaps) {
    const found = courses.find((course) => {
      if (course.competencyArea !== area) return false
      if (taken.has(course.courseId)) return false
      if (diversified.length < topWindowLimit) {
        const currentAreaCount = areaQuota.get(course.competencyArea) || 0
        if (currentAreaCount >= perAreaLimitInTopWindow) return false
      }
      return true
    })
    if (!found) continue
    diversified.push(found)
    taken.add(found.courseId)
    areaQuota.set(found.competencyArea, (areaQuota.get(found.competencyArea) || 0) + 1)
  }

  for (const course of courses) {
    if (taken.has(course.courseId)) continue
    const currentAreaCount = areaQuota.get(course.competencyArea) || 0
    if (diversified.length < topWindowLimit && currentAreaCount >= perAreaLimitInTopWindow) continue
    diversified.push(course)
    taken.add(course.courseId)
    areaQuota.set(course.competencyArea, currentAreaCount + 1)
  }

  return diversified
}

function scoreCourse(course, diagnosis, role) {
  if (!diagnosis) return 50
  let score = 18
  const topGaps = diagnosis.topGaps || []
  if (course.competencyArea === topGaps[0]) score += 42
  if (course.competencyArea === topGaps[1]) score += 24
  if (course.competencyArea === topGaps[2]) score += 12
  const rate = diagnosis.totalScore / Math.max(1, diagnosis.maxScore)
  const preferredLevel = rate >= 0.75 ? '심화' : rate >= 0.45 ? '중급' : '입문'
  const levelOrder = { 입문: 0, 중급: 1, 심화: 2 }
  const distance = Math.abs(levelOrder[course.level] - levelOrder[preferredLevel])
  score += distance === 0 ? 16 : distance === 1 ? 7 : -4
  const categoryScore = diagnosis.categoryScores?.[course.competencyArea] ?? 10
  const deficitRate = 1 - categoryScore / 20
  score += Math.max(0, Math.round(deficitRate * 18))
  if (course.recommendedBy === 'skill-gap') score += 8
  if (role === 'manager' && course.competencyArea === 'problemCollaboration') score += 8
  if (role === 'admin' && course.competencyArea === 'operationsQualitySafety') score += 8
  const signals = buildRecommendationSignals(course)
  if (signals.hasAssessment) score += 3
  if (signals.isTechnicalTrack) score += 4
  if (signals.isLanguageTrack && course.competencyArea !== topGaps[0]) score -= 12
  if (signals.isBookTrack && course.competencyArea !== topGaps[0]) score -= 8
  return Math.min(99, score)
}

async function getJourneyStage(pool, userId) {
  const diagnosis = (await pool.query(`select id from app.diagnoses where user_id = $1 order by diagnosed_at desc limit 1`, [userId])).rows[0]
  const selected = (await pool.query(`select user_id from app.selected_courses where user_id = $1`, [userId])).rows[0]
  const enrolled = (await pool.query(
    `select 1 from app.enrollments where user_id = $1 and enrollment_status = 'enrolled' limit 1`,
    [userId],
  )).rows[0]
  if (enrolled && selected && diagnosis) return 'enrollment_done'
  if (selected && diagnosis) return 'course_selected'
  if (diagnosis) return 'diagnosis_done'
  return 'start'
}

async function buildAdminDashboardPayload(pool, session) {
  const users = (await pool.query(`select * from app.users`)).rows
  const latestDiagnoses = (await pool.query(`
    select distinct on (user_id) *
    from app.diagnoses
    order by user_id, diagnosed_at desc
  `)).rows
  const latestEnrollments = (await pool.query(`
    select distinct on (user_id) *
    from app.enrollments
    order by user_id, enrollment_requested_at desc
  `)).rows
  const departmentComparisons = await buildDepartmentStats(pool)
  const trends = await buildDashboardTrends(pool, latestDiagnoses, users.length)
  const activeLearners = new Set([
    ...latestDiagnoses.map((item) => item.user_id),
    ...latestEnrollments.map((item) => item.user_id),
  ]).size
  const diagnosed = latestDiagnoses.length
  const completed = latestEnrollments.filter((item) => item.enrollment_status === 'enrolled').length
  const applied = latestEnrollments.length
  const failed = latestEnrollments.filter((item) => item.enrollment_status === 'failed').length
  const review = latestEnrollments.filter((item) => item.enrollment_status === 'return-missing').length
  const avgParticipation = departmentComparisons.length
    ? Math.round(departmentComparisons.reduce((sum, item) => sum + item.participation, 0) / departmentComparisons.length)
    : 0
  const avgCompletion = departmentComparisons.length
    ? Math.round(departmentComparisons.reduce((sum, item) => sum + item.completion, 0) / departmentComparisons.length)
    : 0
  const avgScore = departmentComparisons.length
    ? Number((departmentComparisons.reduce((sum, item) => sum + item.avgScore, 0) / departmentComparisons.length).toFixed(1))
    : 0
  const latestDiagnosis = [...latestDiagnoses].sort((a, b) => String(b.diagnosed_at).localeCompare(String(a.diagnosed_at)))[0]
  const topGap = latestDiagnosis?.top_gaps_json?.[0]
  const lowPerformingDepartment = [...departmentComparisons].sort((left, right) => left.completion - right.completion)[0]
  const topPerformingDepartment = [...departmentComparisons].sort((left, right) => right.participation - left.participation)[0]
  return {
    userName: session.profile.name,
    organization: session.profile.organization,
    kpis: [
      {
        label: '평균 참여율',
        value: String(avgParticipation),
        delta: `${diagnosed}명 진단 완료`,
        tone: avgParticipation >= 80 ? 'positive' : 'warning',
        unit: '%',
        progress: avgParticipation,
      },
      {
        label: '평균 완료율',
        value: String(avgCompletion),
        delta: `${completed}명 수강완료`,
        tone: avgCompletion >= 70 ? 'positive' : 'warning',
        unit: '%',
        progress: avgCompletion,
      },
      {
        label: '평균 역량 점수',
        value: String(avgScore),
        delta: `${topGap ? `${competencyAreaText[topGap] || topGap} 보완 필요` : '진단 데이터 기준'}`,
        tone: avgScore >= 70 ? 'positive' : 'neutral',
        unit: '/100',
        progress: Math.round(avgScore),
      },
      {
        label: '활성 학습자',
        value: String(activeLearners),
        delta: `${users.filter((user) => user.role === 'admin').length}명 관리자 포함`,
        tone: 'neutral',
        unit: '명',
        progress: users.length ? Math.round((activeLearners / users.length) * 100) : 0,
      },
    ],
    funnel: [
      { label: `진단 완료 (${diagnosed}명)`, percent: diagnosed ? 100 : 0 },
      { label: `추천 교육 확인 (${Math.max(0, diagnosed - failed)}명)`, percent: diagnosed ? Math.round((Math.max(0, diagnosed - failed) / diagnosed) * 100) : 0 },
      { label: `신청 폼 진입 (${applied}명)`, percent: diagnosed ? Math.round((applied / diagnosed) * 100) : 0 },
      { label: `신청 최종 완료 (${completed}명)`, percent: diagnosed ? Math.round((completed / diagnosed) * 100) : 0 },
    ],
    insights: [
      {
        title: '집중 관리 필요',
        body: lowPerformingDepartment
          ? `${lowPerformingDepartment.name}의 완료율이 ${lowPerformingDepartment.completion}%로 가장 낮습니다.`
          : '완료율 하락 부서는 아직 없습니다.',
      },
      {
        title: '참여 우수 부서',
        body: topPerformingDepartment
          ? `${topPerformingDepartment.name}의 참여율이 ${topPerformingDepartment.participation}%로 가장 높습니다.`
          : '참여 우수 부서 데이터가 아직 없습니다.',
      },
    ],
    urgentActions: [
      completed ? '완료 처리된 과정의 후기/이력 반영 상태를 점검합니다.' : '완료 처리 데이터가 없어 수강 완료 버튼 플로우를 다시 확인합니다.',
      topGap ? `${topGap} 영역 보완 과정이 충분히 추천되는지 확인합니다.` : '최신 진단이 없어 진단부터 한 번 더 진행해 주세요.',
      '현재 선택 과정과 신청/이력 반영 상태를 점검합니다.',
    ],
    departmentComparisons,
    trendComparison: trends,
    summary: {
      departmentCount: departmentComparisons.length,
      displayedDepartments: Math.min(5, departmentComparisons.length),
    },
  }
}

async function buildAdminDepartmentsPayload(pool, session, requestedDivision = '') {
  const users = (await pool.query(`select * from app.users order by created_at desc`)).rows
  const courseRows = (await pool.query(`select * from app.courses order by competency_area asc, rank_in_area asc, created_at asc`)).rows
  const latestDiagnoses = (await pool.query(`
    select distinct on (d.user_id) d.*, u.division
    from app.diagnoses d
    join app.users u on u.id = d.user_id
    order by d.user_id, d.diagnosed_at desc
  `)).rows
  const latestEnrollments = (await pool.query(`
    select distinct on (e.user_id) e.*, u.division
    from app.enrollments e
    join app.users u on u.id = e.user_id
    order by e.user_id, e.enrollment_requested_at desc
  `)).rows

  const departmentMap = new Map()
  const ensureDepartment = (name) => {
    const key = name || '미분류'
    if (!departmentMap.has(key)) {
      departmentMap.set(key, {
        name: key,
        users: 0,
        diagnosisCount: 0,
        completedCount: 0,
        avgScoreSum: 0,
        learningHoursSum: 0,
        competencySums: Object.fromEntries(Object.keys(competencyAreaText).map((area) => [area, 0])),
        competencyCounts: Object.fromEntries(Object.keys(competencyAreaText).map((area) => [area, 0])),
        courseCounts: new Map(),
      })
    }
    return departmentMap.get(key)
  }

  for (const user of users) {
    ensureDepartment(user.division).users += 1
  }

  for (const diagnosis of latestDiagnoses) {
    const bucket = ensureDepartment(diagnosis.division)
    bucket.diagnosisCount += 1
    const scoreRate = Number(diagnosis.max_score || 0) ? (Number(diagnosis.total_score || 0) / Number(diagnosis.max_score)) * 100 : 0
    bucket.avgScoreSum += scoreRate
    for (const area of Object.keys(competencyAreaText)) {
      const raw = Number(diagnosis.category_scores_json?.[area] || 0)
      if (!raw) continue
      bucket.competencySums[area] += (raw / 16) * 100
      bucket.competencyCounts[area] += 1
    }
  }

  for (const enrollment of latestEnrollments) {
    if (enrollment.enrollment_status !== 'enrolled') continue
    ensureDepartment(enrollment.division).completedCount += 1
  }

  const diagnosisByUserId = new Map(latestDiagnoses.map((row) => [row.user_id, parseDiagnosis(row)]))
  for (const user of users) {
    const bucket = ensureDepartment(user.division)
    const diagnosis = diagnosisByUserId.get(user.id) || null
    const ranked = courseRows
      .map((row) => {
        const course = parseCourse(row)
        return {
          courseTitle: course.courseTitle,
          durationHours: Number(course.durationHours || 0),
          fitScore: scoreCourse(course, diagnosis, user.role),
        }
      })
      .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))
      .slice(0, 5)

    const totalHours = ranked.reduce((sum, item) => sum + Math.max(0, Number(item.durationHours || 0)), 0)
    bucket.learningHoursSum += totalHours
    for (const item of ranked) {
      const title = item.courseTitle || '과정 미상'
      bucket.courseCounts.set(title, (bucket.courseCounts.get(title) || 0) + 1)
    }
  }

  const departments = Array.from(departmentMap.values()).map((bucket) => {
    const topStrength = Object.entries(bucket.competencySums)
      .map(([area, sum]) => ({
        area,
        score: bucket.competencyCounts[area] ? sum / bucket.competencyCounts[area] : 0,
      }))
      .sort((left, right) => right.score - left.score)[0]
    return {
      name: bucket.name,
      users: bucket.users,
      participation: bucket.users ? Math.round((bucket.diagnosisCount / bucket.users) * 100) : 0,
      completion: bucket.users ? Math.round((bucket.completedCount / bucket.users) * 100) : 0,
      avgScore: bucket.diagnosisCount ? Number((bucket.avgScoreSum / bucket.diagnosisCount).toFixed(1)) : 0,
      avgLearningHours: bucket.users ? Number((bucket.learningHoursSum / bucket.users).toFixed(1)) : 0,
      topStrength: competencyAreaText[topStrength?.area] || '데이터 없음',
      statusLabel:
        bucket.completedCount > 0
          ? '수강연계'
          : bucket.diagnosisCount > 0
            ? '진단완료'
            : '미진단',
      statusTone:
        bucket.completedCount > 0
          ? 'emerald'
          : bucket.diagnosisCount > 0
            ? 'blue'
            : 'slate',
      topCourses: Array.from(bucket.courseCounts.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([title, count]) => ({ title, count })),
    }
  }).sort((left, right) => right.users - left.users)

  const focusDepartment = requestedDivision
    ? departments.find((item) => item.name === requestedDivision) || null
    : null
  const focusUsers = focusDepartment
    ? users.filter((user) => (user.division || '미분류') === focusDepartment.name)
    : users
  const recommendationCounts = new Map()
  for (const user of focusUsers) {
    const diagnosis = diagnosisByUserId.get(user.id) || null
    const ranked = courseRows
      .map((row) => {
        const course = parseCourse(row)
        return {
          title: course.courseTitle,
          fitScore: scoreCourse(course, diagnosis, user.role),
        }
      })
      .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))
      .slice(0, 5)
    for (const item of ranked) {
      recommendationCounts.set(item.title, (recommendationCounts.get(item.title) || 0) + 1)
    }
  }
  const overallAreaScores = Object.fromEntries(Object.keys(competencyAreaText).map((area) => [area, []]))
  const focusAreaScores = Object.fromEntries(Object.keys(competencyAreaText).map((area) => [area, []]))
  for (const diagnosis of latestDiagnoses) {
    for (const area of Object.keys(competencyAreaText)) {
      const raw = Number(diagnosis.category_scores_json?.[area] || 0)
      if (!raw) continue
      overallAreaScores[area].push((raw / 16) * 100)
      if (focusDepartment && diagnosis.division === focusDepartment.name) {
        focusAreaScores[area].push((raw / 16) * 100)
      }
    }
  }

  const competencyComparison = Object.entries(competencyAreaText).map(([area, label]) => ({
    label,
    departmentScore: !focusDepartment
      ? (overallAreaScores[area].length
          ? Math.round(overallAreaScores[area].reduce((sum, value) => sum + value, 0) / overallAreaScores[area].length)
          : 0)
      : focusAreaScores[area].length
      ? Math.round(focusAreaScores[area].reduce((sum, value) => sum + value, 0) / focusAreaScores[area].length)
      : 0,
    overallScore: overallAreaScores[area].length
      ? Math.round(overallAreaScores[area].reduce((sum, value) => sum + value, 0) / overallAreaScores[area].length)
      : 0,
  }))

  const baseForCards = focusDepartment || {
    participation: departments.length ? Math.round(departments.reduce((sum, item) => sum + item.participation, 0) / departments.length) : 0,
    avgScore: departments.length ? Number((departments.reduce((sum, item) => sum + item.avgScore, 0) / departments.length).toFixed(1)) : 0,
    completion: departments.length ? Math.round(departments.reduce((sum, item) => sum + item.completion, 0) / departments.length) : 0,
    topCourses: [],
  }

  return {
    userName: session.profile.name,
    focusDivision: focusDepartment?.name || '',
    filters: departments.map((item) => item.name),
    kpis: [
      {
        label: '부서별 평균 참여율',
        value: `${baseForCards.participation}%`,
        delta: `${focusDepartment ? focusDepartment.users : users.length}명 기준`,
        tone: baseForCards.participation >= 80 ? 'positive' : 'warning',
      },
      {
        label: '평균 역량 지수 (DCI)',
        value: `${baseForCards.avgScore}`,
        delta: '/ 100',
        tone: baseForCards.avgScore >= 70 ? 'positive' : 'warning',
      },
      {
        label: '수강 완료율',
        value: `${baseForCards.completion}%`,
        delta: `${focusDepartment ? focusDepartment.topCourses.length : 0}개 과정 반영`,
        tone: baseForCards.completion >= 70 ? 'positive' : 'warning',
      },
    ],
    competencyComparison,
    topCourses: (() => {
      const entries = Array.from(recommendationCounts.entries()).sort((left, right) => right[1] - left[1])
      const totalRecommendations = entries.reduce((sum, [, count]) => sum + count, 0)
      return entries.slice(0, 5).map(([title, count], index) => ({
        rank: index + 1,
        title,
        percent: totalRecommendations ? Math.round((count / totalRecommendations) * 100) : 0,
      }))
    })(),
    departments,
    summary: {
      departmentCount: departments.length,
      displayedDepartments: Math.min(5, departments.length),
    },
  }
}

async function buildDepartmentStats(pool) {
  const users = (await pool.query(`select * from app.users order by created_at desc`)).rows
  const diagnoses = (await pool.query(`
    select distinct on (d.user_id) d.*, u.division
    from app.diagnoses d
    join app.users u on u.id = d.user_id
    order by d.user_id, d.diagnosed_at desc
  `)).rows
  const enrollments = (await pool.query(`
    select distinct on (e.user_id) e.*, u.division
    from app.enrollments e
    join app.users u on u.id = e.user_id
    order by e.user_id, e.enrollment_requested_at desc
  `)).rows
  const stats = new Map()
  for (const user of users) {
    const key = user.division || '미분류'
    if (!stats.has(key)) stats.set(key, { users: 0, diagnosis: 0, completed: 0, avgScore: 0 })
    stats.get(key).users += 1
  }
  for (const item of diagnoses) {
    const key = item.division || '미분류'
    if (!stats.has(key)) stats.set(key, { users: 0, diagnosis: 0, completed: 0, avgScore: 0 })
    stats.get(key).diagnosis += 1
    stats.get(key).avgScore += (item.total_score / item.max_score) * 100
  }
  for (const item of enrollments) {
    const key = item.division || '미분류'
    if (!stats.has(key)) stats.set(key, { users: 0, diagnosis: 0, completed: 0, avgScore: 0 })
    if (item.enrollment_status === 'enrolled') stats.get(key).completed += 1
  }
  return Array.from(stats.entries()).map(([name, value]) => ({
    name,
    users: value.users,
    participation: value.users ? Math.round((value.diagnosis / value.users) * 100) : 0,
    completion: value.users ? Math.round((value.completed / value.users) * 100) : 0,
    avgScore: value.diagnosis ? Math.round(value.avgScore / value.diagnosis) : 0,
  })).sort((left, right) => right.users - left.users)
}

async function buildDashboardTrends(pool, diagnoses, userCount) {
  const enrolledByAreaRows = (await pool.query(`
    select c.competency_area, count(distinct e.user_id)::int as enrolled_users
    from app.enrollments e
    join app.courses c on c.id = e.course_id
    where e.enrollment_status = 'enrolled'
    group by c.competency_area
  `)).rows

  const enrolledByArea = new Map(enrolledByAreaRows.map((row) => [row.competency_area, Number(row.enrolled_users || 0)]))

  return Object.entries(competencyAreaText).map(([areaKey, label]) => {
    const areaScores = diagnoses
      .map((item) => Number(item.category_scores_json?.[areaKey] || 0))
      .filter((value) => Number.isFinite(value) && value > 0)
    const competency = areaScores.length
      ? Math.round((areaScores.reduce((sum, value) => sum + value, 0) / areaScores.length / 16) * 100)
      : 0
    const completion = userCount
      ? Math.round(((enrolledByArea.get(areaKey) || 0) / userCount) * 100)
      : 0
    return {
      label,
      completion: Math.min(100, completion),
      competency: Math.min(100, competency),
    }
  })
}

async function buildAdminQuestionsPayload(pool, session) {
  const rows = (await pool.query(`select * from app.questions order by created_at asc`)).rows
  return {
    userName: session.profile.name,
    questions: rows.map((question, index) => ({
      id: question.id,
      order: index + 1,
      categoryKey: question.category,
      area: competencyAreaText[question.category] || question.category,
      title: question.title,
      date: question.created_at,
      status: question.status === '활성' ? 'active' : 'inactive',
    })),
  }
}

async function buildAdminCoursesPayload(pool, session) {
  const courseRows = (await pool.query(`select * from app.courses order by competency_area asc, rank_in_area asc, created_at asc`)).rows
  const enrollmentRows = (await pool.query(`select * from app.enrollments`)).rows
  return {
    userName: session.profile.name,
    courses: courseRows.map((course) => ({
      id: course.id,
      title: course.course_title,
      summary: course.summary,
      competencyArea: course.competency_area,
      category: competencyAreaText[course.competency_area] || course.competency_area,
      level: course.level,
      durationHours: course.duration_hours,
      summary: course.summary,
      users: enrollmentRows.filter((item) => item.course_id === course.id).length,
      status: course.status,
      sourceCategory1: course.source_category_1,
      sourceCategory2: course.source_category_2,
      previewUrl: course.preview_url,
      contentCount: course.content_count,
      instructor: course.instructor,
      hasAssessment: course.has_assessment,
    })),
  }
}

async function buildAdminUsersPayload(pool, session) {
  const users = (await pool.query(`select * from app.users order by created_at desc`)).rows
  const latestDiagnoses = (await pool.query(`
    select distinct on (user_id) user_id, diagnosed_at
    from app.diagnoses
    order by user_id, diagnosed_at desc
  `)).rows
  const latestEnrollments = (await pool.query(`
    select distinct on (user_id) user_id, enrollment_status
    from app.enrollments
    order by user_id, enrollment_requested_at desc
  `)).rows
  const diagnosisMap = new Map(latestDiagnoses.map((row) => [row.user_id, row]))
  const enrollmentMap = new Map(latestEnrollments.map((row) => [row.user_id, row]))
  const normalizedUsers = users.map((user) => {
      const latestDiagnosis = diagnosisMap.get(user.id)
      const latestEnrollment = enrollmentMap.get(user.id)
      const computedStatus =
        latestEnrollment?.enrollment_status === 'enrolled'
          ? '수강완료'
          : latestEnrollment?.enrollment_status === 'requested'
            ? '신청완료'
            : latestEnrollment?.enrollment_status === 'return-missing'
              ? '확인필요'
              : latestEnrollment?.enrollment_status === 'failed'
                ? '신청실패'
              : latestDiagnosis
                  ? '진단완료'
                  : '가입완료'
      const status = user.admin_status_override || computedStatus
      return {
        id: user.id,
        name: user.name,
        employeeId: user.employee_id,
        division: user.division,
        team: user.team,
        email: user.company_email,
        interestCourse: user.interest_course,
        role: user.role,
        statusOverride: user.admin_status_override || '',
        joinedAt: String(user.created_at).slice(0, 10).replaceAll('-', '.'),
        diagnosisDate: latestDiagnosis
          ? String(latestDiagnosis.diagnosed_at).slice(0, 10).replaceAll('-', '.')
          : '-',
        status,
      }
    })
  const divisions = [...new Set(normalizedUsers.map((user) => user.division).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'ko'))
  const statuses = [...new Set(normalizedUsers.map((user) => user.status).filter(Boolean))]
  return {
    userName: session.profile.name,
    users: normalizedUsers,
    filters: {
      divisions,
      statuses,
    },
  }
}

function unauthorized(res) {
  return sendJson(res, 401, { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } })
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

function normalizeRole(value) {
  return value === 'manager' || value === 'admin' ? value : 'employee'
}

const competencyAreaText = {
  aiAutomation: 'AI/자동화 활용',
  dataDecision: '데이터 기반 의사결정',
  dxInnovation: 'DX 혁신 이해',
  operationsQualitySafety: '생산/품질/안전 운영',
  problemCollaboration: '문제해결/협업',
}

const defaultChoiceOptions = [
  { label: '전혀 그렇지 않다', value: 1 },
  { label: '가끔 그렇다', value: 2 },
  { label: '대체로 그렇다', value: 3 },
  { label: '항상 그렇다', value: 4 },
]
