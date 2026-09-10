import crypto from 'node:crypto'

const competencyKeywords = {
  aiAutomation: ['ai', '자동화', '생성형', 'gpt', 'copilot', '프롬프트', '업무혁신', 'agent', '에이전트'],
  dataDecision: ['데이터', '분석', '통계', '지표', 'excel', '엑셀', 'sql', '시각화', '대시보드', '리포트', '의사결정'],
  dxInnovation: ['dx', '디지털전환', '혁신', '미래', '전략', '애자일', 'esg', 'csr', 'csv', 'transform', '신사업'],
  operationsQualitySafety: ['생산', '품질', '안전', '보건', '제조', '공정', '설비', '물류', 'iso', '구매', '원가', '공급망', '현장'],
  problemCollaboration: ['리더십', '협업', '커뮤니케이션', '문제해결', 'hr', '조직', '팀', '프레젠테이션', '회의', '마케팅', '영업', '소통', '코칭'],
}

const pairAreaMap = new Map([
  ['oa||엑셀', 'dataDecision'],
  ['it||데이터 분석', 'dataDecision'],
  ['it||it 프로그래밍', 'dataDecision'],
  ['자격증||it/sw', 'dataDecision'],
  ['ai||', 'aiAutomation'],
  ['4차 산업혁명||', 'dxInnovation'],
  ['10분 독서||기술 혁신', 'dxInnovation'],
  ['10분 독서||비즈니스 혁신', 'dxInnovation'],
  ['10분 독서||트렌드', 'dxInnovation'],
  ['비즈니스 북터뷰||디지털전략', 'dxInnovation'],
  ['경영일반||경영혁신', 'dxInnovation'],
  ['mba||경영전략', 'dxInnovation'],
  ['산업전문||유통/물류', 'operationsQualitySafety'],
  ['산업전문||부동산', 'operationsQualitySafety'],
  ['산업전문||부동산/건설', 'operationsQualitySafety'],
  ['자격증||전기/소방/기계', 'operationsQualitySafety'],
  ['리더십||직급별 리더십', 'problemCollaboration'],
  ['biz. skill||커뮤니케이션', 'problemCollaboration'],
  ['biz. skill||업무수행력', 'problemCollaboration'],
  ['biz. skill||보고서(작성)', 'problemCollaboration'],
  ['biz. skill||기획력', 'problemCollaboration'],
  ['영어||비즈니스 영어', 'problemCollaboration'],
])

const category2AreaMap = new Map([
  ['데이터 분석', 'dataDecision'],
  ['엑셀', 'dataDecision'],
  ['it 프로그래밍', 'dataDecision'],
  ['it/sw', 'dataDecision'],
  ['기술 혁신', 'dxInnovation'],
  ['비즈니스 혁신', 'dxInnovation'],
  ['경영혁신', 'dxInnovation'],
  ['경영전략', 'dxInnovation'],
  ['디지털전략', 'dxInnovation'],
  ['트렌드', 'dxInnovation'],
  ['유통/물류', 'operationsQualitySafety'],
  ['전기/소방/기계', 'operationsQualitySafety'],
  ['부동산/건설', 'operationsQualitySafety'],
  ['업무수행력', 'problemCollaboration'],
  ['커뮤니케이션', 'problemCollaboration'],
  ['보고서(작성)', 'problemCollaboration'],
  ['기획력', 'problemCollaboration'],
  ['직급별 리더십', 'problemCollaboration'],
  ['팀웍', 'problemCollaboration'],
  ['셀프 리더십', 'problemCollaboration'],
  ['조직문화', 'problemCollaboration'],
  ['변화관리', 'problemCollaboration'],
  ['마케팅', 'problemCollaboration'],
  ['마케팅과 트렌드', 'problemCollaboration'],
  ['심리학', 'problemCollaboration'],
  ['자기관리', 'problemCollaboration'],
  ['자기계발', 'problemCollaboration'],
  ['일 잘하는 법', 'problemCollaboration'],
  ['비즈니스 영어', 'problemCollaboration'],
  ['영어 회화초급', 'problemCollaboration'],
  ['영어 회화입문', 'problemCollaboration'],
  ['영어 회화중급', 'problemCollaboration'],
  ['영어 회화고급', 'problemCollaboration'],
  ['중국어 회화초급', 'problemCollaboration'],
  ['중국어 회화입문', 'problemCollaboration'],
  ['일본어 회화초급', 'problemCollaboration'],
  ['일본어 회화입문', 'problemCollaboration'],
  ['opic', 'problemCollaboration'],
  ['토익 rc', 'problemCollaboration'],
  ['토익 lc', 'problemCollaboration'],
  ['토익 speaking', 'problemCollaboration'],
])

const category1AreaMap = new Map([
  ['ai', 'aiAutomation'],
  ['oa', 'dataDecision'],
  ['it', 'dataDecision'],
  ['4차 산업혁명', 'dxInnovation'],
  ['산업전문', 'operationsQualitySafety'],
  ['자격증', 'operationsQualitySafety'],
  ['리더십', 'problemCollaboration'],
  ['biz. skill', 'problemCollaboration'],
  ['경영일반', 'problemCollaboration'],
  ['mba', 'problemCollaboration'],
  ['영어', 'problemCollaboration'],
  ['제2외국어', 'problemCollaboration'],
  ['중국어', 'problemCollaboration'],
  ['일본어', 'problemCollaboration'],
  ['10분 독서', 'problemCollaboration'],
  ['비즈니스 북터뷰', 'problemCollaboration'],
  ['교보문고', 'problemCollaboration'],
  ['자기계발', 'problemCollaboration'],
  ['인문/교양', 'problemCollaboration'],
  ['ubobful', 'problemCollaboration'],
  ['테마특강', 'problemCollaboration'],
])

function text(value) {
  return String(value ?? '').replace(/\r/g, '').replace(/\u00a0/g, ' ').trim()
}

function normalized(value) {
  return text(value).toLowerCase()
}

function splitBullets(value) {
  return text(value)
    .split('\n')
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
}

function parseDurationHours(value) {
  const raw = text(value)
  const match = raw.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/)
  if (!match) return 1
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return Math.max(1, Math.round(hours + minutes / 60 + seconds / 3600))
}

function inferLevel({ durationHours, contentCount, courseTitle, summary, category1, category2 }) {
  const blob = normalized(`${category1} ${category2} ${courseTitle} ${summary}`)
  if (blob.includes('심화') || blob.includes('전문') || blob.includes('master') || blob.includes('고급')) return '심화'
  if (blob.includes('입문') || blob.includes('기초') || blob.includes('basic') || blob.includes('초급')) return '입문'
  if (durationHours >= 5 || contentCount >= 20) return '심화'
  if (durationHours >= 2 || contentCount >= 8) return '중급'
  return '입문'
}

function inferCompetencyArea({ category1, category2, courseTitle, summary, objectives, targetAudience }) {
  const c1 = normalized(category1)
  const c2 = normalized(category2)
  const direct = pairAreaMap.get(`${c1}||${c2}`) || category2AreaMap.get(c2) || category1AreaMap.get(c1)
  if (direct) return direct

  const content = [category1, category2, courseTitle, summary, ...objectives, ...targetAudience].map(normalized).join(' ')
  const scores = {
    aiAutomation: 0,
    dataDecision: 0,
    dxInnovation: 0,
    operationsQualitySafety: 0,
    problemCollaboration: 0,
  }

  for (const [area, keywords] of Object.entries(competencyKeywords)) {
    for (const keyword of keywords) {
      if (content.includes(keyword)) scores[area] += 2
    }
  }

  if (content.includes('안전') || content.includes('iso')) scores.operationsQualitySafety += 4
  if (content.includes('마케팅') || content.includes('고객')) scores.problemCollaboration += 3
  if (content.includes('데이터') || content.includes('엑셀')) scores.dataDecision += 4
  if (content.includes('ai') || content.includes('생성형')) scores.aiAutomation += 4
  if (content.includes('혁신') || content.includes('전략')) scores.dxInnovation += 3

  const [bestArea, bestScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return bestScore > 0 ? bestArea : 'problemCollaboration'
}

function normalizeRow(raw) {
  const category1 = text(raw.category1 ?? raw['카테고리1'])
  const category2 = text(raw.category2 ?? raw['카테고리2'])
  const courseTitle = text(raw.courseTitle ?? raw['과정명'])
  const previewUrl = text(raw.previewUrl ?? raw['프리뷰URL'])
  const previewLabel = text(raw.previewLabel ?? raw['미리보기']) || '미리보기'
  const durationText = text(raw.durationText ?? raw['학습시간'])
  const contentCount = Number(raw.contentCount ?? raw['콘텐츠수'] ?? 0)
  const instructor = text(raw.instructor ?? raw['강사'])
  const hasAssessment = normalized(raw.hasAssessment ?? raw['평가유무']) === 'y'
  const summary = text(raw.summary ?? raw['요약'])
  const objectives = splitBullets(raw.objectives ?? raw['학습목표'])
  const targetAudience = splitBullets(raw.targetAudience ?? raw['학습대상'])
  const durationHours = Number(raw.durationHours) || parseDurationHours(durationText)
  const competencyArea =
    raw.competencyArea ??
    inferCompetencyArea({ category1, category2, courseTitle, summary, objectives, targetAudience })
  const level =
    raw.level ??
    inferLevel({ durationHours, contentCount, courseTitle, summary, category1, category2 })

  return {
    category1,
    category2,
    courseTitle,
    previewUrl,
    previewLabel,
    durationText,
    durationHours,
    contentCount,
    instructor,
    hasAssessment,
    summary,
    objectives: objectives.length ? objectives : [summary || '과정 핵심 내용을 확인합니다.'],
    targetAudience: targetAudience.length ? targetAudience : ['회사 구성원'],
    expectedOutcomes: objectives.length ? objectives : ['업무 적용 포인트를 이해합니다.'],
    reasonTags: [category1, category2, hasAssessment ? '평가포함' : '평가없음'].filter(Boolean),
    recommendedBy: 'skill-gap',
    level,
    competencyArea,
    status: '운영중',
  }
}

export function normalizeCourseImportRows(rows, initialRankCounts = {}) {
  const rankCounts = { ...initialRankCounts }
  return rows
    .map(normalizeRow)
    .filter((course) => course.courseTitle)
    .map((course, index) => {
      const nextRank = Number(rankCounts[course.competencyArea] || 0) + 1
      rankCounts[course.competencyArea] = nextRank
      return {
        id:
          course.id ||
          rawCourseId(course, index),
        ...course,
        rankInArea: nextRank,
      }
    })
}

function rawCourseId(course, index) {
  const digest = crypto.createHash('md5').update(`${index}:${course.courseTitle}:${course.category1}:${course.category2}`).digest('hex').slice(0, 8).toUpperCase()
  return `XLSX-${String(index + 1).padStart(4, '0')}-${digest}`
}

export function buildRecommendationSignals(course) {
  const c1 = normalized(course.sourceCategory1 || course.category1)
  const c2 = normalized(course.sourceCategory2 || course.category2)
  const penalties = ['영어', '제2외국어', '중국어', '일본어', '10분 독서', '비즈니스 북터뷰', '교보문고']
  const normalizedPenalties = penalties.map((item) => item.toLowerCase())

  return {
    isLanguageTrack: normalizedPenalties.slice(0, 4).includes(c1),
    isBookTrack: normalizedPenalties.slice(4).includes(c1),
    isTechnicalTrack: ['oa', 'it', '산업전문', 'ai', '자격증'].includes(c1),
    category1: c1,
    category2: c2,
    hasAssessment: Boolean(course.hasAssessment),
  }
}
