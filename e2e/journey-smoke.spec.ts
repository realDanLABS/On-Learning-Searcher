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
