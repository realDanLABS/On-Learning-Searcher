import { expect, test } from '@playwright/test'

async function prepareUntilCourseLinking(page: import('@playwright/test').Page) {
  await page.goto('/')

  await page.getByRole('button', { name: '로그인' }).first().click()

  await page.getByLabel('사번').fill('E10001')
  await page.getByLabel('이름').fill('홍길동')
  await page.getByLabel('소속').fill('경영지원본부')
  await page.getByRole('button', { name: '프로필 저장' }).first().click()

  await page.getByRole('button', { name: '진단 시작' }).first().click()
  await expect(page).toHaveURL(/\/diagnosis/)

  for (let i = 0; i < 9; i += 1) {
    await page.getByRole('button', { name: '예' }).click()
    await page.getByRole('button', { name: '다음' }).click()
  }

  await page.getByRole('button', { name: '예' }).click()
  await page.getByRole('button', { name: '결과 보기' }).click()
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

test('landing to history e2e journey', async ({ page }) => {
  await prepareUntilCourseLinking(page)

  await page.getByRole('button', { name: '신청 완료 처리' }).click()
  await expect(page).toHaveURL(/\/history/)

  await expect(page.getByRole('heading', { name: '진단 결과 및 학습 이력' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '신청/수강 이력' })).toBeVisible()
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
  await page.getByRole('button', { name: '진단 시작' }).first().click()
  await expect(page).toHaveURL(/\/diagnosis/)

  await page.getByRole('button', { name: '예' }).click()
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('button', { name: '보통' }).click()
  await page.goto('/')

  await expect(page.getByRole('button', { name: '바로 시작: 3) 미완료 진단 이어하기' })).toBeVisible()
  await page.getByRole('button', { name: '바로 시작: 3) 미완료 진단 이어하기' }).click()
  await expect(page).toHaveURL(/\/diagnosis/)
  await expect(page.getByText('2 / 10 답변 완료')).toBeVisible()
})
