import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppShell } from '../../../shared/layouts/AppShell'
import { getNextJourneyAction } from '../../../shared/orchestration/journey'
import {
  getDiagnosisPayload,
  getEnrollmentRecords,
  getJourneyStage,
} from '../../../shared/state/learningFlow'

type ChatMessage = {
  id: string
  role: 'user' | 'bot'
  text: string
}

const promptOptions = ['내 부족 역량 알려줘', '추천 이유 설명해줘', '이번 달 학습계획 제안해줘']

export function ChatbotPage() {
  const diagnosis = getDiagnosisPayload()
  const enrollments = getEnrollmentRecords()
  const journeyStage = getJourneyStage()
  const nextAction = getNextJourneyAction(journeyStage)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'bot',
      text: '안녕하세요. 온러닝서처 학습 도우미입니다. 아래 빠른 질문을 눌러 시작하세요.',
    },
  ])
  const idRef = useRef(1)

  const botReply = useMemo(() => {
    const gaps = diagnosis?.topGaps?.join(', ') || '진단 데이터 없음'
    return {
      '내 부족 역량 알려줘': `현재 보완 우선 역량은 ${gaps} 입니다. 먼저 추천 과정에서 해당 태그 과정을 확인해 보세요.`,
      '추천 이유 설명해줘': '추천 과정은 진단 점수와 역량 갭을 기반으로 자동 선별되었습니다. 추천 페이지의 reason tag를 확인하세요.',
      '이번 달 학습계획 제안해줘': `이번 달에는 2개 과정을 목표로 하세요. 현재 신청 이력 ${enrollments.length}건 기준으로 부족 역량 우선 과정을 추천합니다.`,
    }
  }, [diagnosis, enrollments.length])

  const ask = (question: string) => {
    const nextId = idRef.current
    idRef.current += 1
    const user: ChatMessage = {
      id: `${nextId}-u`,
      role: 'user',
      text: question,
    }
    const bot: ChatMessage = {
      id: `${nextId}-b`,
      role: 'bot',
      text: botReply[question as keyof typeof botReply] ?? '질문을 다시 선택해 주세요.',
    }
    setMessages((prev) => [...prev, user, bot])
  }

  return (
    <AppShell
      title="AI 챗봇 상담"
      description="진단/추천/이력 데이터를 바탕으로 학습 방향을 안내합니다."
    >
      <section className="hero-card">
        <h2>빠른 질문</h2>
        <div className="journey-actions">
          {promptOptions.map((prompt) => (
            <button className="secondary-btn" key={prompt} onClick={() => ask(prompt)} type="button">
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section className="hero-card chat-log">
        {messages.map((message) => (
          <div className={message.role === 'bot' ? 'chat-bubble bot' : 'chat-bubble user'} key={message.id}>
            {message.text}
          </div>
        ))}
      </section>

      <section className="hero-card">
        <h2>바로가기</h2>
        <p className="hint-text">현재 여정 단계에 맞춰 다음 행동을 제안합니다.</p>
        <div className="journey-actions">
          <Link className="primary-btn link-btn" to={nextAction.to}>
            {nextAction.label}
          </Link>
          <Link className="secondary-btn link-btn" to="/history">
            이력 페이지 이동
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
