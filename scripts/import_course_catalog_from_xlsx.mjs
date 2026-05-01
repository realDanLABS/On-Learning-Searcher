import xlsx from 'xlsx'

import { normalizeCourseImportRows } from '../api/_lib/courseCatalog.js'
import { ensureSchema, getPool } from '../api/_lib/db.js'

const workbookPath = process.argv[2]

if (!workbookPath) {
  console.error('Usage: node scripts/import_course_catalog_from_xlsx.mjs <xlsx-path>')
  process.exit(1)
}

function readWorkbook(path) {
  const workbook = xlsx.readFile(path)
  const firstSheet = workbook.SheetNames[0]
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1, raw: false })
  return rows.slice(2).map((row) => ({
    카테고리1: row[0],
    카테고리2: row[1],
    과정명: row[2],
    프리뷰URL: row[3],
    미리보기: row[4],
    학습시간: row[5],
    콘텐츠수: row[6],
    강사: row[7],
    평가유무: row[8],
    요약: row[9],
    학습목표: row[10],
    학습대상: row[11],
  }))
}

async function main() {
  const imported = normalizeCourseImportRows(readWorkbook(workbookPath))

  await ensureSchema()
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('begin')
    await client.query('delete from app.courses')

    const chunkSize = 250
    for (let offset = 0; offset < imported.length; offset += chunkSize) {
      const chunk = imported.slice(offset, offset + chunkSize)
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

    const summary = imported.reduce((acc, course) => {
      acc[course.competencyArea] = (acc[course.competencyArea] || 0) + 1
      return acc
    }, {})

    console.log(JSON.stringify({ imported: imported.length, competencyAreas: summary }, null, 2))
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
