import { expect, test } from '@playwright/test'

async function prepareUntilCourseLinking(page: import('@playwright/test').Page) {
  await page.goto('/')

  await page.getByRole('button', { name: '로그인' }).first().click()

  await page.getByLabel('사번').fill('E10001')
  await page.getByLabel('이름').fill('홍길동')
  await page.getByLabel('소속').fill('경영지원본부')
  await page.getByRole('button', { name: '프로필 저장' }).first().click()

  await page.goto('/diagnosis')
  await expect(page).toHaveURL(/\/diagnosis/)

  const diagnosisCard = page.locator('.diagnosis-question-card')
  for (let i = 0; i < 9; i += 1) {
    await diagnosisCard.getByRole('button', { name: '예' }).click()
    await expect(diagnosisCard.getByRole('button', { name: '다음' })).toBeEnabled({ timeout: 2000 })
    await diagnosisCard.getByRole('button', { name: '다음' }).click()
  }

  await diagnosisCard.getByRole('button', { name: '예' }).click()
  await expect(diagnosisCard.getByRole('button', { name: '결과 보기' })).toBeEnabled({ timeout: 2000 })
  await diagnosisCard.getByRole('button', { name: '결과 보기' }).click()
  await page.getByRole('button', { name: '추천 과정 보기' }).click()
  await expect(page).toHaveURL(/\/recommendation/)

  await page.getByRole('button', { name: '신청하기' }).first().click()
  await expect(page).toHaveURL(/\/course-linking/)
}

async function prepareLoggedInProfile(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '로그인' }).first().click()
  await page.getByLabel('사번').fill('E10001')
  await page.getByLabel('이름').fill('홍길동')
  await page.getByLabel('소속').fill('경영지원본부')
  await page.getByRole('button', { name: '프로필 저장' }).first().click()
}

async function prepareLoggedInOnly(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '로그인' }).first().click()
}

async function prepareDiagnosisDone(page: import('@playwright/test').Page) {
  await prepareLoggedInProfile(page)
  await page.goto('/diagnosis')
  await expect(page).toHaveURL(/\/diagnosis/)

  const diagnosisCard = page.locator('.diagnosis-question-card')
  for (let i = 0; i < 9; i += 1) {
    await diagnosisCard.getByRole('button', { name: '예' }).click()
    await diagnosisCard.getByRole('button', { name: '다음' }).click()
  }

  await diagnosisCard.getByRole('button', { name: '예' }).click()
  await diagnosisCard.getByRole('button', { name: '결과 보기' }).click()
  await page.getByRole('button', { name: '추천 과정 보기' }).click()
  await expect(page).toHaveURL(/\/recommendation/)
}

test('landing to history e2e journey', async ({ page }) => {
  await prepareUntilCourseLinking(page)

  await page.getByRole('button', { name: '신청 완료 처리' }).click()
  await expect(page).toHaveURL(/\/history/)

  await expect(page.getByRole('heading', { name: '진단 결과 및 학습 이력' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '신청/수강 이력' })).toBeVisible()
})

test('home-only guided journey reaches history without manual URL jump', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /1\) 로그인 진행$/ }).click()
  await expect(page.getByText('인증 상태: 로그인됨')).toBeVisible()

  await page.getByLabel('사번').fill('E10999')
  await page.getByLabel('이름').fill('오케스트레이터')
  await page.getByLabel('소속').fill('교육문화팀')
  await page.getByRole('button', { name: /2\) 프로필 저장 진행$/ }).click()
  await expect(page).toHaveURL(/\/diagnosis/)

  const diagnosisCard = page.locator('.diagnosis-question-card')
  for (let i = 0; i < 9; i += 1) {
    await diagnosisCard.getByRole('button', { name: '예' }).click()
    await diagnosisCard.getByRole('button', { name: '다음' }).click()
  }

  await diagnosisCard.getByRole('button', { name: '예' }).click()
  await diagnosisCard.getByRole('button', { name: '결과 보기' }).click()
  await page.getByRole('button', { name: '추천 과정 보기' }).click()
  await expect(page).toHaveURL(/\/recommendation/)

  await page.getByRole('button', { name: '신청하기' }).first().click()
  await expect(page).toHaveURL(/\/course-linking/)

  await page.getByRole('button', { name: '신청 완료 처리' }).click()
  await expect(page).toHaveURL(/\/history/)
  await expect(page.getByRole('heading', { name: '진단 결과 및 학습 이력' })).toBeVisible()

  await page.getByRole('link', { name: 'AI 상담 이어가기' }).click()
  await expect(page).toHaveURL(/\/chatbot/)
  await expect(page.getByRole('heading', { name: 'AI 챗봇 상담' })).toBeVisible()
})

test('ecampus callback success auto-redirects to history', async ({ page }) => {
  await prepareUntilCourseLinking(page)
  await page.goto('/course-linking?enrollment=success&courseId=DIG-101')
  await expect(page).toHaveURL(/\/history\?from=enrollment/)
  await expect(page.getByRole('heading', { name: '진단 결과 및 학습 이력' })).toBeVisible()
})

test('ecampus callback failed shows recovery actions', async ({ page }) => {
  await prepareUntilCourseLinking(page)
  await page.goto('/course-linking?enrollment=failed&courseId=DIG-101')
  await expect(page.getByText('외부 신청 결과가 실패로 반환되었습니다. 신청 정보를 다시 확인해 주세요.')).toBeVisible()
  await expect(page.getByRole('button', { name: '복귀 결과 다시 확인' })).toBeVisible()
  await expect(page.getByRole('link', { name: '추천 페이지로 돌아가기' })).toBeVisible()
})

test('locked top-nav redirects to home guidance and recommended step', async ({ page }) => {
  await prepareLoggedInProfile(page)
  await page.getByRole('link', { name: '맞춤 교육 추천 (잠금)' }).click()
  await expect(page).toHaveURL(/\/\?gate=stage-locked&next=%2Fdiagnosis/)
  await expect(page.getByText('현재 단계에서는 접근할 수 없습니다. 안내된 순서대로 진행해 주세요.')).toBeVisible()
  await page.getByRole('button', { name: '권장 페이지로 이동' }).click()
  await expect(page).toHaveURL(/\/diagnosis/)
})

test('home primary CTA resumes unfinished diagnosis draft', async ({ page }) => {
  await prepareLoggedInProfile(page)
  await page.goto('/diagnosis')
  await expect(page).toHaveURL(/\/diagnosis/)

  const diagnosisCard = page.locator('.diagnosis-question-card')
  await diagnosisCard.getByRole('button', { name: '예' }).click()
  await diagnosisCard.getByRole('button', { name: '다음' }).click()
  await diagnosisCard.getByRole('button', { name: '보통' }).click()
  await page.goto('/')

  await expect(page.getByRole('button', { name: '바로 시작: 3) 미완료 진단 이어하기' })).toBeVisible()
  await page.getByRole('button', { name: '바로 시작: 3) 미완료 진단 이어하기' }).click()
  await expect(page).toHaveURL(/\/diagnosis/)
  await expect(page.getByText('2 / 10 답변 완료')).toBeVisible()
})

test('chatbot next action resumes unfinished diagnosis draft', async ({ page }) => {
  await prepareLoggedInProfile(page)
  await page.goto('/diagnosis')
  await expect(page).toHaveURL(/\/diagnosis/)

  const diagnosisCard = page.locator('.diagnosis-question-card')
  await diagnosisCard.getByRole('button', { name: '예' }).click()
  await diagnosisCard.getByRole('button', { name: '다음' }).click()

  await page.goto('/chatbot')
  const actionBarLink = page
    .getByLabel('단계 이동 액션')
    .getByRole('link', { name: '다음 단계: 미완료 진단 이어하기' })
  await expect(actionBarLink).toBeVisible()
  await actionBarLink.click()
  await expect(page).toHaveURL(/\/diagnosis/)
  await expect(page.getByText('1 / 10 답변 완료')).toBeVisible()
})

test('direct diagnosis access redirects with auth next path', async ({ page }) => {
  await page.goto('/diagnosis')
  await expect(page).toHaveURL(/\/\?gate=auth-required&next=%2Fdiagnosis/)
})

test('direct diagnosis access redirects with profile next path when only logged in', async ({ page }) => {
  await prepareLoggedInOnly(page)
  await page.goto('/diagnosis')
  await expect(page).toHaveURL(/\/\?gate=profile-required&next=%2Fdiagnosis/)
})

test('home primary action auto-advances to diagnosis after profile save', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
  await page.getByRole('button', { name: /1\) 로그인 진행$/ }).click()
  await expect(page.getByText('인증 상태: 로그인됨')).toBeVisible()

  await page.getByLabel('사번').fill('E10077')
  await page.getByLabel('이름').fill('김서연')
  await page.getByLabel('소속').fill('교육문화팀')

  await page.getByRole('button', { name: /2\) 프로필 저장 진행$/ }).click()
  await expect(page).toHaveURL(/\/diagnosis/)
})

test('gated next recommendation falls back to diagnosis after onboarding', async ({ page }) => {
  await page.goto('/recommendation')
  await expect(page).toHaveURL(/\/\?gate=auth-required&next=%2Frecommendation/)

  await page.getByRole('button', { name: /1\) 로그인 진행$/ }).click()
  await expect(page.getByText('인증 상태: 로그인됨')).toBeVisible()

  await page.getByLabel('사번').fill('E10111')
  await page.getByLabel('이름').fill('이민호')
  await page.getByLabel('소속').fill('경영지원본부')
  await page.getByRole('button', { name: /2\) 프로필 저장 진행$/ }).click()

  await expect(page).toHaveURL(/\/diagnosis/)
})

test('recommended button resolves to reachable step when next is recommendation', async ({ page }) => {
  await prepareLoggedInProfile(page)
  await page.goto('/?gate=stage-locked&next=%2Frecommendation')
  await page.getByRole('button', { name: '권장 페이지로 이동' }).click()
  await expect(page).toHaveURL(/\/diagnosis/)
})

test('stored next intent survives query loss and continues onboarding flow', async ({ page }) => {
  await page.goto('/recommendation')
  await expect(page).toHaveURL(/\/\?gate=auth-required&next=%2Frecommendation/)

  await page.goto('/')
  await page.getByRole('button', { name: /1\) 로그인 진행$/ }).click()
  await expect(page.getByText('인증 상태: 로그인됨')).toBeVisible()

  await page.getByLabel('사번').fill('E10222')
  await page.getByLabel('이름').fill('박지훈')
  await page.getByLabel('소속').fill('교육문화팀')
  await page.getByRole('button', { name: /2\) 프로필 저장 진행$/ }).click()

  await expect(page).toHaveURL(/\/diagnosis/)
})

test('onboarding card actions also auto-advance to diagnosis', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()

  const onboardingCard = page.locator('.feature-card').filter({ hasText: '1단계: 로그인/프로필' })
  await onboardingCard.getByRole('button', { name: '로그인' }).click()
  await expect(page.getByText('인증 상태: 로그인됨')).toBeVisible()

  await page.getByLabel('사번').fill('E10333')
  await page.getByLabel('이름').fill('정하늘')
  await page.getByLabel('소속').fill('경영지원본부')
  await onboardingCard.getByRole('button', { name: '프로필 저장' }).click()

  await expect(page).toHaveURL(/\/diagnosis/)
})

test('stale pending intent does not override completed-stage next action', async ({ page }) => {
  await prepareUntilCourseLinking(page)
  await page.getByRole('button', { name: '신청 완료 처리' }).click()
  await expect(page).toHaveURL(/\/history/)

  await page.goto('/?gate=stage-locked&next=%2Frecommendation')
  await page.goto('/')
  await page.getByRole('button', { name: '현재 단계 이어서 진행' }).click()
  await expect(page).toHaveURL(/\/history/)
})

test('unsafe external next parameter is ignored during onboarding flow', async ({ page }) => {
  await page.goto('/?gate=auth-required&next=https%3A%2F%2Fevil.example')
  await page.getByRole('button', { name: /1\) 로그인 진행$/ }).click()
  await expect(page.getByText('인증 상태: 로그인됨')).toBeVisible()

  await page.getByLabel('사번').fill('E10444')
  await page.getByLabel('이름').fill('최윤서')
  await page.getByLabel('소속').fill('교육문화팀')
  await page.getByRole('button', { name: /2\) 프로필 저장 진행$/ }).click()

  await expect(page).toHaveURL(/\/diagnosis/)
})

test('locked recommendation card offers predecessor navigation', async ({ page }) => {
  await prepareLoggedInProfile(page)
  await page.goto('/')

  const recommendationCard = page.locator('.feature-card').filter({ hasText: '3단계: 맞춤 추천' })
  await expect(recommendationCard.getByText('선행 단계를 먼저 완료해 주세요.')).toBeVisible()
  await recommendationCard.getByRole('button', { name: '선행 단계로 이동' }).click()
  await expect(page).toHaveURL(/\/diagnosis/)
})

test('history reset returns to home and starts a fresh diagnosis loop', async ({ page }) => {
  await prepareUntilCourseLinking(page)
  await page.getByRole('button', { name: '신청 완료 처리' }).click()
  await expect(page).toHaveURL(/\/history/)

  await page.getByRole('button', { name: '새로운 진단 여정 시작' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.getByRole('button', { name: '바로 시작: 3) 역량 진단 시작' }).click()
  await expect(page).toHaveURL(/\/diagnosis/)
})

test('course-linking missing selection redirects safely to recommended predecessor step', async ({ page }) => {
  await prepareUntilCourseLinking(page)
  await page.evaluate(() => {
    localStorage.removeItem('on_learning_selected_course_v1')
  })
  await page.reload()

  await expect(page).toHaveURL(/\/\?gate=stage-locked&next=%2Frecommendation/)
  await page.getByRole('button', { name: '권장 페이지로 이동' }).click()
  await expect(page).toHaveURL(/\/recommendation/)
})

test('chatbot quick intent provides safe guided navigation CTA', async ({ page }) => {
  await prepareLoggedInProfile(page)
  await page.goto('/chatbot')
  await page.getByRole('button', { name: '내 부족 역량 알려줘' }).click()
  await page.getByRole('link', { name: '추천 흐름으로 이동' }).last().click()
  await expect(page).toHaveURL(/\/diagnosis/)
})

test('chatbot guided CTA routes to recommendation after diagnosis completion', async ({ page }) => {
  await prepareDiagnosisDone(page)
  await page.goto('/chatbot')
  await page.getByRole('button', { name: '내 부족 역량 알려줘' }).click()
  await page.getByRole('link', { name: '추천 흐름으로 이동' }).last().click()
  await expect(page).toHaveURL(/\/recommendation/)
})

test('recommendation page without diagnosis redirects to locked guidance', async ({ page }) => {
  await prepareLoggedInProfile(page)
  await page.goto('/recommendation')

  await expect(page).toHaveURL(/\/\?gate=stage-locked&next=%2Fdiagnosis/)
  await page.getByRole('button', { name: '권장 페이지로 이동' }).click()
  await expect(page).toHaveURL(/\/diagnosis/)
})
