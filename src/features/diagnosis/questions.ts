export type ChoiceValue = 0 | 1 | 2

export type DiagnosisQuestion = {
  id: string
  title: string
  type: 'binary' | 'choice'
  options: Array<{ label: string; value: ChoiceValue }>
  category: 'digital' | 'leadership' | 'collaboration' | 'problem-solving'
}

const yesNoOptions = [
  { label: '아니오', value: 0 as ChoiceValue },
  { label: '보통', value: 1 as ChoiceValue },
  { label: '예', value: 2 as ChoiceValue },
]

export const diagnosisQuestions: DiagnosisQuestion[] = [
  {
    id: 'q1',
    title: '새로운 디지털 도구를 업무에 빠르게 적용할 수 있다.',
    type: 'binary',
    options: yesNoOptions,
    category: 'digital',
  },
  {
    id: 'q2',
    title: '데이터를 기반으로 의사결정을 내리는 편이다.',
    type: 'binary',
    options: yesNoOptions,
    category: 'digital',
  },
  {
    id: 'q3',
    title: '팀 내 목표를 명확히 공유하고 실행을 이끈다.',
    type: 'choice',
    options: yesNoOptions,
    category: 'leadership',
  },
  {
    id: 'q4',
    title: '업무 우선순위를 정해 팀을 조율할 수 있다.',
    type: 'choice',
    options: yesNoOptions,
    category: 'leadership',
  },
  {
    id: 'q5',
    title: '다른 부서와의 협업 요청을 적극적으로 수용한다.',
    type: 'binary',
    options: yesNoOptions,
    category: 'collaboration',
  },
  {
    id: 'q6',
    title: '회의에서 타인의 의견을 반영해 대안을 제시한다.',
    type: 'choice',
    options: yesNoOptions,
    category: 'collaboration',
  },
  {
    id: 'q7',
    title: '문제 원인을 단계적으로 분석하는 습관이 있다.',
    type: 'binary',
    options: yesNoOptions,
    category: 'problem-solving',
  },
  {
    id: 'q8',
    title: '유사 사례를 찾아 해결 전략을 세운다.',
    type: 'choice',
    options: yesNoOptions,
    category: 'problem-solving',
  },
  {
    id: 'q9',
    title: '새로운 학습 목표를 스스로 설정하고 실행한다.',
    type: 'binary',
    options: yesNoOptions,
    category: 'digital',
  },
  {
    id: 'q10',
    title: '학습한 내용을 실제 업무 개선으로 연결한다.',
    type: 'choice',
    options: yesNoOptions,
    category: 'problem-solving',
  },
]
