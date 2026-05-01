import { expect, test } from '@playwright/test'

async function completeDiagnosis(page: import('@playwright/test').Page) {
  for (let step = 0; step < 19; step += 1) {
    await page.locator('.diagnosis-react-option').nth(2).click()
    await page.getByRole('button', { name: '다음 문항' }).click()
  }

  await page.locator('.diagnosis-react-option').nth(2).click()
  await page.getByRole('button', { name: '결과 보기' }).click()
}

test('same-origin full journey works from auth callback to history', async ({ page }) => {
  const employeeId = `E${Date.now()}`
  await page.goto(
    `/auth/callback?status=success&employeeId=${employeeId}&name=Local%20Tester&organization=Learning%20Team&role=employee`,
  )
  await expect(page).toHaveURL(/\/diagnosis/, { timeout: 15000 })
  await expect(page.getByRole('button', { name: '다음 문항' })).toBeVisible()

  await completeDiagnosis(page)
  await page.getByRole('button', { name: '추천 과정 보기' }).click()
  await expect(page).toHaveURL(/\/recommendation/)

  await page.getByRole('button', { name: '수강 신청' }).first().click()
  await expect(page).toHaveURL(/\/course-linking/)

  await page.getByRole('button', { name: '추천 과정 수강 완료' }).click()
  await expect(page).toHaveURL(/\/history/)
  await expect(page.getByRole('heading', { name: /나의 학습 이력/ })).toBeVisible()
})

test('auth callback query role does not grant admin access', async ({ page }) => {
  const employeeId = `A${Date.now()}`
  await page.goto(
    `/auth/callback?status=success&employeeId=${employeeId}&name=Admin%20Tester&organization=Platform%20Admin&role=admin`,
  )
  await page.goto('/admin')

  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
})
