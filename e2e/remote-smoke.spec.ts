import { expect, test } from '@playwright/test'

test('remote mode full journey works from auth callback to history', async ({ page }) => {
  await page.goto(
    '/auth/callback?status=success&employeeId=E1001&name=Remote%20Tester&organization=Learning%20Team&role=employee',
  )
  await expect(page).toHaveURL(/\/diagnosis/)

  for (let step = 0; step < 19; step += 1) {
    await page.getByRole('radio').nth(2).check()
    await page.getByRole('button', { name: '다음 문항' }).click()
  }

  await page.getByRole('radio').nth(2).check()
  await page.getByRole('button', { name: '결과 보기' }).click()
  await page.getByRole('link', { name: '추천 과정 보기' }).click()

  await expect(page).toHaveURL(/\/recommendation/)
  await page.getByRole('button', { name: '신청하기' }).first().click()

  await expect(page).toHaveURL(/\/course-linking/)
  await page.getByRole('button', { name: '추천 과정 수강 완료' }).click()

  await expect(page).toHaveURL(/\/history/)
  await expect(page.getByRole('heading', { name: /학습 진행 현황/ })).toBeVisible()
})
