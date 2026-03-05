import { expect, test } from '@playwright/test'

test('remote mode full journey works from auth callback to history', async ({ page }) => {
  await page.goto(
    '/auth/callback?status=success&employeeId=E1001&name=Remote%20Tester&organization=Learning%20Team&role=employee',
  )
  await expect(page).toHaveURL(/\/diagnosis/)

  const diagnosisCard = page.locator('.diagnosis-question-card')
  for (let step = 0; step < 9; step += 1) {
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
})
