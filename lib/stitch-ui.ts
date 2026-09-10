'use client'

import { logoutSession, type UserProfile } from '@/lib/auth-client'
import { competencyAreaLabels } from '@/lib/diagnosis'
import type { CompetencyAreaKey, DiagnosisPayload, EnrollmentRecord, RecommendedCourse } from '@/lib/learning-client'

const KEY_FAVORITE_COURSE_IDS = 'on_learning_favorite_course_ids_v1'
export const RECOMMENDED_COURSE_PREVIEW_COUNT = 5

export type NoticeItem = {
  id: string
  category: string
  date: string
  title: string
  summary: string
}

export type FaqItem = {
  id: string
  question: string
  answer: string
}

const defaultNotices: NoticeItem[] = [
  {
    id: 'notice-1',
    category: '학습 안내',
    date: '2026.03.07',
    title: '3월 AI 기초 과정 추천이 새롭게 반영되었습니다.',
    summary: '역량 진단 결과를 기반으로 추천 과정과 학습 경로가 매일 업데이트됩니다.',
  },
  {
    id: 'notice-2',
    category: '운영 공지',
    date: '2026.03.04',
    title: '추천 과정 저장 기능이 개선되었습니다.',
    summary: '선택한 추천 과정은 나의 학습 화면에서 바로 이어서 확인할 수 있습니다.',
  },
  {
    id: 'notice-3',
    category: '서비스 점검',
    date: '2026.02.28',
    title: '이캠퍼스 연동 안내가 최신 기준으로 정리되었습니다.',
    summary: '신청 전 확인해야 할 안내와 예외 대응 흐름을 더 쉽게 확인할 수 있습니다.',
  },
]

const defaultFaqs: FaqItem[] = [
  {
    id: 'faq-1',
    question: '역량 진단은 얼마나 걸리나요?',
    answer: '평균 5분 내외이며, 응답은 자동 저장되어 중간에 다시 이어서 진행할 수 있습니다.',
  },
  {
    id: 'faq-2',
    question: '추천 과정은 어떤 기준으로 만들어지나요?',
    answer: '가장 보완이 필요한 역량과 현재 역할을 함께 반영해 상위 학습 과정이 우선 추천됩니다.',
  },
  {
    id: 'faq-3',
    question: '추천 과정을 저장하면 어디서 다시 볼 수 있나요?',
    answer: '저장한 과정은 나의 학습 화면과 추천 화면에서 다시 확인하고 바로 이어서 볼 수 있습니다.',
  },
  {
    id: 'faq-4',
    question: '더 도움이 필요하면 어디에서 문의하나요?',
    answer: '커뮤니티 메뉴의 AI 챗봇 상담에서 추천 이유, 신청 상태, 다음 학습 방향을 바로 안내받을 수 있습니다.',
  },
]

const areaSubtitles: Record<CompetencyAreaKey, string> = {
  aiAutomation: '머신러닝 이해 및 워크플로우 자동화',
  dataDecision: '분석적 사고 및 데이터 기반 통찰력',
  dxInnovation: '디지털 전환 전략 및 생태계 인식',
  operationsQualitySafety: '현장 리스크 관리 및 디지털 위생 실습',
  problemCollaboration: '협업 조율 및 문제 해결 실행력',
}

const areaImages: Record<CompetencyAreaKey, string> = {
  aiAutomation:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB7j2oh5TwDs2LammLaxAShaW3g1U86Q-Zoft9OH-kAFzK7ms2WYGyHXTd3561odRPplwiSHdShm4VCKbykyBQ_TWjsRfNd1ge7JAxc3g2v55sFas1QqtbAiOXjFbK5js3ImCXGc9UgADo9Ce0UCLhpUIjToDZQtVywfnZWopNUdHya-WdmRITFHh-sFgH8KtkHEY-nzopCGNRxWZW46GhUU3B81PEIJ_2fHsLfohNExx6_bH_0EUsrOnKF9jqAT2rR0OT56Ar50A',
  dataDecision:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBvQrVXmN3Sqn5VJctDn6Plafo8DMYQPD_M1yJCpVBB3MQW_BCq5hBy_id7lsCSgEkxxHXDN1RlErQs1iD0D8-hBphtpAfl0xjN3xwczI_PUzUWltoh8N7GCdGgBxyYyjBnf0UbZZX_rbs7h6P89TZQ4Itt-n9tvD8MZYwE1X5w2j3ykhtNTeAPt4H81mz5Ijq0slc6TbIIVaMPv4w_fvu6ivjmNI1dXOUv0i4pWi3CWeEyzk82GoCsV9eYPwgvmKZfNaPLYkPpGQ',
  dxInnovation: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  operationsQualitySafety:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBNPNCiaBesfy_nbbbzDcWfdGHuwLnLSmMt9ZVj2mDsOIojjBsqFP7BidSc95Ety1CSAOButB8tIHb9YwDvadCjLQCAYVSVPrGeVZF4wug-tKstJJsl64F0WKvnMj67M_E_UzJLI4sBG89MXuUV9U-cR0p8rrqBa2IBRmz2cAk0Nl_wVJQn_45DWb2zH5iGCBmbKauwpcs-mkfLcCY1t3dlb6GWkAeG12ybAYa5m1ugRAfjZGJYCTgUukWZs8BcH9fv-LI1U8VmvQ',
  problemCollaboration: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
}

type CourseThumbnailPreset = {
  id: string
  accent: string
  accentSoft: string
  line: string
  chip: string
  overline: string
  title: string
  gradientFrom?: string
  gradientTo?: string
}

const courseThumbnailPresets: Record<string, CourseThumbnailPreset> = {
  '10분 독서||비즈니스 혁신': { id: 'reading-innovation', accent: '#0f4c81', accentSoft: '#e8f1fb', line: '#7aa6d8', chip: 'READ', overline: '10-MIN READ', title: 'Business Innovation' },
  '10분 독서||심리학': { id: 'reading-psychology', accent: '#8f4ad0', accentSoft: '#f3eafe', line: '#c39af0', chip: 'MIND', overline: '10-MIN READ', title: 'Psychology Insight' },
  'Biz. Skill||업무수행력': { id: 'biz-execution', accent: '#ec5b13', accentSoft: '#fff0e8', line: '#f5a174', chip: 'SKILL', overline: 'BIZ. SKILL', title: 'Execution Mastery' },
  'AI||': { id: 'ai-core', accent: '#00a7c4', accentSoft: '#e8fbff', line: '#7ad9e9', chip: 'AI', overline: 'AI TRACK', title: 'Generative Workflow' },
  'IT||IT 프로그래밍': { id: 'it-programming', accent: '#1f6feb', accentSoft: '#e9f2ff', line: '#8ab2f3', chip: 'CODE', overline: 'IT PROGRAMMING', title: 'Coding Practice' },
  '제2외국어||아시아': { id: 'lang-asia', accent: '#2c8f6b', accentSoft: '#eaf8f2', line: '#8dcfb6', chip: 'ASIA', overline: '2ND LANGUAGE', title: 'Asian Language' },
  '제2외국어||유럽': { id: 'lang-europe', accent: '#3659b8', accentSoft: '#ecf1ff', line: '#94aae6', chip: 'EU', overline: '2ND LANGUAGE', title: 'European Language' },
  '산업전문||부동산': { id: 'industry-realestate', accent: '#8c5a2b', accentSoft: '#f8eee4', line: '#cba57f', chip: 'IND', overline: 'INDUSTRY', title: 'Real Estate' },
  'OA||엑셀': { id: 'oa-excel', accent: '#107c41', accentSoft: '#e8f7ef', line: '#7fcca1', chip: 'OA', overline: 'OFFICE APP', title: 'Excel Productivity' },
  '중국어||중국어 회화초급': { id: 'cn-basic', accent: '#d9485f', accentSoft: '#ffedf0', line: '#f3a2ad', chip: 'CN', overline: 'CHINESE', title: 'Basic Conversation' },
  '영어||비즈니스 영어': { id: 'en-business', accent: '#274c9a', accentSoft: '#eef3ff', line: '#92a9de', chip: 'EN', overline: 'ENGLISH', title: 'Business English' },
  '중국어||HSK 시험대비': { id: 'cn-hsk', accent: '#e65d2f', accentSoft: '#fff0e8', line: '#f0a385', chip: 'HSK', overline: 'CHINESE', title: 'Exam Preparation' },
  '10분 독서||트렌드': { id: 'reading-trend', accent: '#1f7a8c', accentSoft: '#e9f8fb', line: '#8ac3cf', chip: 'TREND', overline: '10-MIN READ', title: 'Trend Briefing' },
  '자격증||IT/SW': { id: 'cert-it', accent: '#5a45d6', accentSoft: '#efeaff', line: '#a39af0', chip: 'CERT', overline: 'LICENSE', title: 'IT Certification' },
  'Biz. Skill||커뮤니케이션': { id: 'biz-communication', accent: '#ff7a00', accentSoft: '#fff2e6', line: '#ffc182', chip: 'TEAM', overline: 'BIZ. SKILL', title: 'Communication' },
  'IT||데이터 분석': { id: 'it-data', accent: '#0f766e', accentSoft: '#e7fbf8', line: '#85cfc7', chip: 'DATA', overline: 'IT ANALYTICS', title: 'Data Analysis' },
  '자기계발||자기관리': { id: 'self-management', accent: '#d97706', accentSoft: '#fff7e8', line: '#f0bf78', chip: 'SELF', overline: 'SELF GROWTH', title: 'Self Management' },
  '일본어||일본어 회화초급': { id: 'jp-basic', accent: '#cc3f6a', accentSoft: '#ffedf3', line: '#ef9fba', chip: 'JP', overline: 'JAPANESE', title: 'Basic Conversation' },
  '경영일반||경영기법': { id: 'management-method', accent: '#374151', accentSoft: '#f3f4f6', line: '#b0b4bc', chip: 'MGT', overline: 'MANAGEMENT', title: 'Business Method' },
  '4차 산업혁명||': { id: 'future-tech', accent: '#2563eb', accentSoft: '#edf4ff', line: '#8db3f5', chip: 'DX', overline: 'FUTURE TECH', title: 'Industry 4.0' },
}

const category1ThumbnailFallback: Record<string, string> = {
  '10분 독서': '10분 독서||비즈니스 혁신',
  '영어': '영어||비즈니스 영어',
  'Biz. Skill': 'Biz. Skill||업무수행력',
  '자격증': '자격증||IT/SW',
  '제2외국어': '제2외국어||아시아',
  OA: 'OA||엑셀',
  중국어: '중국어||중국어 회화초급',
  산업전문: '산업전문||부동산',
  IT: 'IT||IT 프로그래밍',
  일본어: '일본어||일본어 회화초급',
  경영일반: '경영일반||경영기법',
  MBA: '경영일반||경영기법',
  ubobful: 'Biz. Skill||업무수행력',
  AI: 'AI||',
  교보문고: '10분 독서||비즈니스 혁신',
  자기계발: '자기계발||자기관리',
  '인문/교양': '10분 독서||심리학',
  법정교육: '산업전문||부동산',
  리더십: 'Biz. Skill||커뮤니케이션',
  '비즈니스 북터뷰': '10분 독서||트렌드',
}

const thumbnailCache = new Map<string, string>()

function normalizeCategoryLabel(value?: string | null) {
  return String(value ?? '').trim()
}

function escapeSvgText(value?: string | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function clampText(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value
}

function buildCourseThumbnailDataUrl(
  preset: CourseThumbnailPreset,
  variant: number,
  meta: {
    title: string
    category: string
    level: string
    durationText: string
    instructor?: string
    previewLabel?: string
    contentCount?: number
  },
) {
  const cacheKey = `${preset.id}:${variant}`
  const metaKey = `${cacheKey}:${meta.title}:${meta.category}:${meta.level}:${meta.durationText}:${meta.instructor || ''}:${meta.previewLabel || ''}:${meta.contentCount || ''}`
  const cached = thumbnailCache.get(metaKey)
  if (cached) return cached
  const title = escapeSvgText(clampText(meta.title, 46))
  const subCategory = escapeSvgText(clampText(meta.category || preset.overline, 22))
  const level = escapeSvgText(meta.level)
  const durationText = escapeSvgText(meta.durationText)
  const instructor = escapeSvgText(clampText(meta.instructor || 'Company', 24))
  const previewLabel = escapeSvgText(clampText(meta.previewLabel || '추천 과정', 18))
  const countChip = meta.contentCount ? `${meta.contentCount}개 콘텐츠` : '맞춤 추천'
  const gradientFrom = preset.gradientFrom || preset.accent
  const gradientTo = preset.gradientTo || preset.line

  const svg = variant === 1
    ? `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">
            <stop stop-color="${gradientFrom}"/>
            <stop offset="1" stop-color="${gradientTo}"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="675" rx="36" fill="url(#g1)"/>
        <rect x="58" y="58" width="1084" height="559" rx="32" fill="${preset.accentSoft}"/>
        <rect x="88" y="92" width="140" height="42" rx="21" fill="${preset.accent}" fill-opacity="0.16"/>
        <text x="158" y="119" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${preset.accent}">${preset.chip}</text>
        <text x="88" y="208" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${preset.accent}">${subCategory}</text>
        <text x="88" y="292" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#0f172a">${title}</text>
        <rect x="88" y="344" width="300" height="8" rx="4" fill="${preset.line}"/>
        <rect x="88" y="378" width="360" height="8" rx="4" fill="${preset.line}" fill-opacity="0.72"/>
        <rect x="88" y="412" width="248" height="8" rx="4" fill="${preset.line}" fill-opacity="0.48"/>
        <circle cx="924" cy="242" r="138" fill="white" fill-opacity="0.55"/>
        <circle cx="924" cy="242" r="96" fill="${preset.accent}" fill-opacity="0.14"/>
        <rect x="760" y="446" width="280" height="92" rx="26" fill="white" fill-opacity="0.75"/>
        <text x="800" y="485" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${previewLabel}</text>
        <rect x="800" y="504" width="184" height="14" rx="7" fill="${preset.accent}" fill-opacity="0.82"/>
        <rect x="800" y="528" width="144" height="12" rx="6" fill="${preset.accent}" fill-opacity="0.46"/>
        <text x="88" y="568" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${level} · ${durationText}</text>
        <text x="1024" y="585" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${instructor}</text>
      </svg>
    `.trim()
    : variant === 2
      ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">
          <rect width="1200" height="675" rx="36" fill="${preset.accentSoft}"/>
          <rect x="72" y="72" width="1056" height="531" rx="30" fill="white"/>
          <rect x="72" y="72" width="260" height="531" rx="30" fill="${preset.accent}"/>
          <rect x="112" y="114" width="104" height="38" rx="19" fill="white" fill-opacity="0.18"/>
          <text x="164" y="139" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="white">${preset.chip}</text>
          <text x="112" y="228" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="white" transform="rotate(-90 112 228)">${preset.overline}</text>
          <text x="382" y="210" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${preset.accent}">${subCategory}</text>
          <text x="382" y="290" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="#0f172a">${title}</text>
          <rect x="382" y="256" width="260" height="8" rx="4" fill="${preset.line}"/>
          <rect x="382" y="288" width="420" height="8" rx="4" fill="${preset.line}" fill-opacity="0.72"/>
          <rect x="382" y="320" width="312" height="8" rx="4" fill="${preset.line}" fill-opacity="0.5"/>
          <rect x="382" y="390" width="654" height="138" rx="28" fill="${preset.accentSoft}"/>
          <text x="424" y="434" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="${preset.accent}">${level}</text>
          <text x="424" y="472" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#0f172a">${durationText}</text>
          <text x="424" y="508" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#475569">${escapeSvgText(countChip)}</text>
          <rect x="848" y="420" width="132" height="84" rx="18" fill="white"/>
          <circle cx="914" cy="462" r="26" fill="${preset.accent}" fill-opacity="0.18"/>
          <text x="1030" y="566" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${previewLabel}</text>
        </svg>
      `.trim()
      : variant === 3
      ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">
          <rect width="1200" height="675" rx="36" fill="${preset.accentSoft}"/>
          <rect x="48" y="48" width="1104" height="579" rx="28" fill="white"/>
          <rect x="48" y="48" width="1104" height="176" rx="28" fill="${preset.accent}"/>
          <circle cx="1060" cy="138" r="64" fill="white" fill-opacity="0.15"/>
          <circle cx="980" cy="118" r="24" fill="white" fill-opacity="0.22"/>
          <rect x="88" y="92" width="120" height="40" rx="20" fill="white" fill-opacity="0.18"/>
          <text x="148" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="white">${preset.chip}</text>
          <text x="88" y="286" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${preset.accent}">${subCategory}</text>
          <text x="88" y="368" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="#0f172a">${title}</text>
          <rect x="88" y="420" width="280" height="8" rx="4" fill="${preset.line}"/>
          <rect x="88" y="452" width="420" height="8" rx="4" fill="${preset.line}" fill-opacity="0.75"/>
          <rect x="88" y="484" width="360" height="8" rx="4" fill="${preset.line}" fill-opacity="0.55"/>
          <rect x="760" y="284" width="272" height="188" rx="26" fill="${preset.accentSoft}"/>
          <text x="804" y="338" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${preset.accent}">${previewLabel}</text>
          <text x="804" y="378" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#0f172a">${durationText}</text>
          <text x="804" y="420" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#475569">${instructor}</text>
          <rect x="88" y="560" width="180" height="26" rx="13" fill="${preset.accentSoft}"/>
          <text x="178" y="578" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${level}</text>
        </svg>
      `.trim()
      : variant === 4
      ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">
          <defs>
            <linearGradient id="g4" x1="70" y1="68" x2="1110" y2="607" gradientUnits="userSpaceOnUse">
              <stop stop-color="${preset.accentSoft}"/>
              <stop offset="1" stop-color="#ffffff"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="675" rx="36" fill="${preset.accent}"/>
          <rect x="70" y="68" width="1060" height="539" rx="30" fill="url(#g4)"/>
          <rect x="92" y="96" width="220" height="36" rx="18" fill="${preset.accent}" fill-opacity="0.12"/>
          <text x="202" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="${preset.accent}">${subCategory}</text>
          <text x="92" y="220" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#0f172a">${title}</text>
          <rect x="92" y="254" width="520" height="2" fill="${preset.line}"/>
          <rect x="92" y="330" width="220" height="120" rx="24" fill="${preset.accent}"/>
          <text x="126" y="380" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="white">${level}</text>
          <text x="126" y="420" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="white">${durationText}</text>
          <rect x="370" y="330" width="300" height="120" rx="24" fill="${preset.accentSoft}"/>
          <text x="404" y="380" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${previewLabel}</text>
          <text x="404" y="420" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="#0f172a">${escapeSvgText(countChip)}</text>
          <circle cx="920" cy="260" r="126" fill="${preset.accent}" fill-opacity="0.10"/>
          <circle cx="920" cy="260" r="74" fill="${preset.accent}" fill-opacity="0.18"/>
          <text x="1036" y="568" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${instructor}</text>
        </svg>
      `.trim()
      : variant === 5
      ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">
          <rect width="1200" height="675" rx="36" fill="#ffffff"/>
          <rect x="0" y="0" width="1200" height="675" rx="36" fill="${preset.accentSoft}"/>
          <rect x="66" y="82" width="180" height="511" rx="28" fill="${preset.accent}"/>
          <text x="156" y="142" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="white">${preset.chip}</text>
          <text x="320" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${preset.accent}">${subCategory}</text>
          <text x="320" y="250" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="#0f172a">${title}</text>
          <rect x="320" y="288" width="420" height="6" rx="3" fill="${preset.line}"/>
          <rect x="320" y="360" width="760" height="148" rx="30" fill="white"/>
          <text x="360" y="412" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${previewLabel}</text>
          <text x="360" y="454" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#0f172a">${durationText}</text>
          <text x="360" y="492" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#475569">${level} · ${escapeSvgText(countChip)}</text>
          <text x="1040" y="572" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${instructor}</text>
        </svg>
      `.trim()
      : `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">
          <defs>
            <linearGradient id="g6" x1="70" y1="90" x2="1130" y2="590" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ffffff"/>
              <stop offset="1" stop-color="${preset.accentSoft}"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="675" rx="36" fill="url(#g6)"/>
          <rect x="76" y="84" width="1048" height="507" rx="30" fill="white"/>
          <rect x="92" y="104" width="180" height="34" rx="17" fill="${preset.accentSoft}"/>
          <text x="182" y="126" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${preset.accent}">${subCategory}</text>
          <text x="92" y="210" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#0f172a">${title}</text>
          <rect x="92" y="244" width="480" height="3" fill="${preset.line}"/>
          <rect x="92" y="332" width="460" height="176" rx="28" fill="${preset.accentSoft}"/>
          <text x="126" y="386" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${preset.accent}">${previewLabel}</text>
          <text x="126" y="432" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#0f172a">${durationText}</text>
          <text x="126" y="472" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#475569">${level}</text>
          <text x="126" y="504" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#475569">${escapeSvgText(countChip)}</text>
          <rect x="730" y="174" width="286" height="286" rx="48" fill="${preset.accent}" fill-opacity="0.12"/>
          <rect x="790" y="234" width="166" height="166" rx="34" fill="${preset.accent}" fill-opacity="0.20"/>
          <text x="1038" y="560" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${preset.accent}">${instructor}</text>
        </svg>
      `.trim()
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  thumbnailCache.set(metaKey, url)
  return url
}

function stableVariantSeed(text: string) {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return hash
}

function resolveThumbnailPresetKey(course: Pick<RecommendedCourse, 'sourceCategory1' | 'sourceCategory2' | 'competencyArea'>) {
  const c1 = normalizeCategoryLabel(course.sourceCategory1)
  const c2 = normalizeCategoryLabel(course.sourceCategory2)
  const pairKey = `${c1}||${c2}`
  if (courseThumbnailPresets[pairKey]) return pairKey
  if (category1ThumbnailFallback[c1]) return category1ThumbnailFallback[c1]
  if (course.competencyArea === 'aiAutomation') return 'AI||'
  if (course.competencyArea === 'dataDecision') return 'IT||데이터 분석'
  if (course.competencyArea === 'dxInnovation') return '4차 산업혁명||'
  if (course.competencyArea === 'operationsQualitySafety') return '산업전문||부동산'
  return 'Biz. Skill||커뮤니케이션'
}

export function getRepresentativeCourseThumbnail(
  course: Pick<
    RecommendedCourse,
    'sourceCategory1' | 'sourceCategory2' | 'competencyArea' | 'courseId' | 'courseTitle' | 'level' | 'durationHours' | 'sourceDurationText' | 'instructor' | 'previewLabel' | 'contentCount'
  >,
) {
  const presetKey = resolveThumbnailPresetKey(course)
  const variantSeed = stableVariantSeed(`${course.courseId || ''}:${course.courseTitle || ''}:${course.sourceCategory1 || ''}:${course.sourceCategory2 || ''}`)
  const variant = variantSeed % 6
  return buildCourseThumbnailDataUrl(courseThumbnailPresets[presetKey], variant, {
    title: course.courseTitle || courseThumbnailPresets[presetKey].title,
    category: course.sourceCategory2 || course.sourceCategory1 || courseThumbnailPresets[presetKey].overline,
    level: course.level || '입문',
    durationText: course.sourceDurationText || formatDurationText(course.durationHours || 0),
    instructor: course.instructor,
    previewLabel: course.previewLabel,
    contentCount: course.contentCount,
  })
}

export function getAreaLabel(area?: string | null) {
  if (!area) return '-'
  return competencyAreaLabels[area as CompetencyAreaKey] ?? area
}

export function getAreaSubtitle(area: CompetencyAreaKey) {
  return areaSubtitles[area]
}

export function getAreaImage(area?: CompetencyAreaKey | null) {
  if (!area) return areaImages.aiAutomation
  return areaImages[area]
}

export function formatDurationText(hours: number) {
  if (!Number.isFinite(hours)) return '-'
  const rounded = Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
  return `${rounded}시간`
}

export function getDiagnosisScoreRate(diagnosis: DiagnosisPayload | null) {
  if (!diagnosis) return 0
  return Math.round((diagnosis.totalScore / Math.max(1, diagnosis.maxScore)) * 100)
}

export function getEnrollmentStatusLabel(record: EnrollmentRecord | null) {
  if (!record) return '학습 준비'
  if (record.enrollmentStatus === 'requested') return '신청완료'
  if (record.enrollmentStatus === 'enrolled') return '수강 완료'
  if (record.enrollmentStatus === 'return-missing') return '확인필요'
  return '신청실패'
}

export function getHistoryResultLabel(record: EnrollmentRecord | null) {
  if (!record) return '-'
  if (record.enrollmentStatus === 'enrolled') return '완료 처리'
  return '-'
}

export function mapCourseCategory(area: CompetencyAreaKey) {
  if (area === 'aiAutomation' || area === 'dataDecision') return '데이터/AI'
  if (area === 'dxInnovation' || area === 'operationsQualitySafety') return '개발'
  return '디자인'
}

export function buildRecommendationCourse(course: RecommendedCourse, index = 0) {
  return {
    courseId: course.courseId,
    title: course.courseTitle,
    level: course.level,
    durationText: formatDurationText(course.durationHours),
    badge: index === 0 ? '인기' : course.recommendedBy === 'history-based' ? '신규' : '추천',
    fitScore: course.fitScore ?? 70,
    category: mapCourseCategory(course.competencyArea),
    rank: index + 1,
    imageUrl: getRepresentativeCourseThumbnail(course),
    summary: course.summary,
  }
}

export function buildCourseCurriculum(course: RecommendedCourse) {
  const source = [...course.objectives, ...course.expectedOutcomes]
  return [0, 1, 2].map((index) => ({
    title: source[index] ?? `모듈 ${index + 1}`,
    subtitle: source[index + 1] ?? '핵심 적용 포인트를 중심으로 학습합니다.',
  }))
}

export function buildLearningPathCourses(courses: RecommendedCourse[]) {
  return courses.slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT).map((course, index) => ({
    ...course,
    step: index + 1,
    durationText: formatDurationText(course.durationHours),
    imageUrl: getRepresentativeCourseThumbnail(course),
    reason:
      course.reasonTags[0]
        ? `${course.reasonTags[0]} 역량을 보완하기 위한 우선 학습입니다.`
        : '현재 진단 결과에 맞춘 우선 학습 과정입니다.',
  }))
}

export function getSelectedOrFallbackCourse(selectedCourse: RecommendedCourse | null, allCourses: RecommendedCourse[]) {
  return selectedCourse ?? allCourses[0] ?? null
}

export function formatCompetencyAreaList(areas: CompetencyAreaKey[]) {
  return areas.map((area) => competencyAreaLabels[area]).join(', ')
}

function readFavoriteCourseIds() {
  if (typeof window === 'undefined') return [] as string[]
  const raw = window.localStorage.getItem(KEY_FAVORITE_COURSE_IDS)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function toggleFavoriteCourseId(courseId: string) {
  const next = new Set(readFavoriteCourseIds())
  if (next.has(courseId)) next.delete(courseId)
  else next.add(courseId)
  window.localStorage.setItem(KEY_FAVORITE_COURSE_IDS, JSON.stringify([...next]))
}

export function getFavoriteCoursesFrom(allCourses: RecommendedCourse[]) {
  const favorites = new Set(readFavoriteCourseIds())
  return allCourses.filter((course) => favorites.has(course.courseId))
}

export function getNoticeItems() {
  return defaultNotices
}

export function getFaqItems() {
  return defaultFaqs
}

export function getDefaultNoticeItems() {
  return defaultNotices
}

export function getDefaultFaqItems() {
  return defaultFaqs
}

export async function clearIdentity() {
  await logoutSession()
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(KEY_FAVORITE_COURSE_IDS)
    window.localStorage.removeItem('on-learning-diagnosis-answers-v1')
  }
}

export function getDisplayUser(profile?: UserProfile | null) {
  return {
    employeeId: profile?.employeeId ?? '',
    name: profile?.name ?? '',
    organization: profile?.organization ?? '',
  }
}
