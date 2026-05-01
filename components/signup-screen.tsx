'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'

import { signupWithPassword } from '@/lib/auth-client'
import { buildOrganizationLabel, sanitizeInternalPath } from '@/lib/paths'
import { AuthShell } from '@/components/auth-shell'

const divisionOptions = [
  '직속',
  '기획실',
  '경영지원본부',
  '재경본부',
  '구매본부',
  '품질사업부',
  '특수사업부',
  '모빌리티사업부',
  '모빌리티영업담당',
  '모빌리티솔루션사업부',
  '차량부품연구센터',
  'TMS사업부',
]

export function SignupScreen({ next }: { next?: string }) {
  const router = useRouter()
  const nextPath = sanitizeInternalPath(next) ?? '/diagnosis'
  const [division, setDivision] = useState('')
  const [team, setTeam] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [interestCourse, setInterestCourse] = useState('')
  const [error, setError] = useState('')

  const organization = useMemo(
    () => buildOrganizationLabel({ division, team, fallback: '현대위아' }),
    [division, team],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await signupWithPassword({
        division,
        office: '',
        team,
        employeeId,
        companyEmail,
        password,
        name,
        interestCourse,
        organization,
        nextPath,
      })
      router.replace(nextPath)
    } catch {
      setError('이미 가입된 사원번호 또는 회사 이메일이거나 입력 정보가 올바르지 않습니다.')
    }
  }

  return (
    <AuthShell description="현대위아 사원정보를 등록하고 맞춤 학습 여정을 시작하세요." hidePageHeader title="회원가입">
      <section className="auth-panel">
        <div className="auth-panel-copy">
          <h2>회원가입</h2>
        </div>

        <form className="auth-form-grid auth-form-grid-two" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>소속본부/사업부</span>
            <select className="auth-select" required value={division} onChange={(event) => setDivision(event.target.value)}>
              <option value="">선택하세요</option>
              {divisionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="auth-field">
            <span>소속팀</span>
            <input required value={team} onChange={(event) => setTeam(event.target.value)} placeholder="예: 교육문화팀" />
          </label>
          <label className="auth-field">
            <span>사원번호</span>
            <input required inputMode="numeric" maxLength={5} pattern="[0-9]{5}" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} placeholder="예: 12345" />
          </label>
          <label className="auth-field">
            <span>이름</span>
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 김현대" />
          </label>
          <label className="auth-field">
            <span>회사 이메일</span>
            <input required type="email" value={companyEmail} onChange={(event) => setCompanyEmail(event.target.value)} placeholder="member@hyundai-wia.com" />
          </label>
          <label className="auth-field">
            <span>비밀번호</span>
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호를 입력하세요" />
          </label>
          <label className="auth-field auth-field-full">
            <span>관심과정</span>
            <input required value={interestCourse} onChange={(event) => setInterestCourse(event.target.value)} placeholder="예: AI 업무 자동화, 데이터 기반 의사결정" />
          </label>

          <div className="auth-preview auth-field-full">
            <p className="auth-preview-label">상단 프로필 미리보기</p>
            <strong>{name || '이름 미입력'}</strong>
            <span>{organization}</span>
          </div>

          {error ? <p className="auth-error auth-field-full">{error}</p> : null}

          <div className="auth-actions auth-field-full">
            <button className="auth-shell-btn auth-shell-btn-primary" type="submit">
              회원가입 완료
            </button>
            <Link className="auth-shell-btn auth-shell-btn-secondary" href={`/login?next=${encodeURIComponent(nextPath)}`}>
              로그인으로 이동
            </Link>
          </div>
        </form>
      </section>
    </AuthShell>
  )
}
