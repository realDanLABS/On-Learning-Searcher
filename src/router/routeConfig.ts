import type { RouteAccessPolicy } from '../shared/orchestration/access'
import type { FeatureKey } from '../shared/config/runtime'

export type FeatureRoute = RouteAccessPolicy & {
  featureKey: FeatureKey
  path: string
  label: string
  description: string
}

export const featureRoutes: FeatureRoute[] = [
  {
    featureKey: 'diagnosis',
    path: '/diagnosis',
    label: 'AI 역량 진단',
    description: 'OX형/선택형 질문 기반 진단 흐름 구현 영역',
    minStage: 'start',
    requireProfile: true,
    requireAuth: true,
  },
  {
    featureKey: 'recommendation',
    path: '/recommendation',
    label: '맞춤 교육 추천',
    description: '진단 결과 기반 추천 목록/상세 UI 구현 영역',
    minStage: 'diagnosis_done',
    requireProfile: true,
    requireAuth: true,
  },
  {
    featureKey: 'course-linking',
    path: '/course-linking',
    label: '교육 신청 연동',
    description: '추천 과정에서 이캠퍼스 신청으로 이어지는 연동 영역',
    minStage: 'course_selected',
    requireProfile: true,
    requireAuth: true,
  },
  {
    featureKey: 'history',
    path: '/history',
    label: '진단/학습 이력',
    description: '진단 결과 및 수강 히스토리 관리 화면 구현 영역',
    minStage: 'diagnosis_done',
    requireProfile: true,
    requireAuth: true,
  },
  {
    featureKey: 'chatbot',
    path: '/chatbot',
    label: 'AI 챗봇 상담',
    description: '실시간 학습 상담/질의응답 UI 구현 영역',
    minStage: 'start',
    requireProfile: true,
    requireAuth: true,
  },
  {
    featureKey: 'responsive',
    path: '/responsive',
    label: '반응형 최적화',
    description: '데스크톱/모바일 UI 적응성 검증 영역',
    minStage: 'start',
    requireProfile: false,
    requireAuth: true,
    allowedRoles: ['admin'],
  },
]
