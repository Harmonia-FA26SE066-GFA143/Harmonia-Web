import { expect, test } from '@playwright/test'

const rehearsalUrl = process.env.PLAYWRIGHT_REHEARSAL_URL
const scoreSong = process.env.PLAYWRIGHT_SCORE_SONG
const email = process.env.PLAYWRIGHT_EMAIL
const password = process.env.PLAYWRIGHT_PASSWORD

test('opens and controls a PDF score without page-level overflow', async ({ page }) => {
  test.skip(!rehearsalUrl || !scoreSong, 'Set PLAYWRIGHT_REHEARSAL_URL and PLAYWRIGHT_SCORE_SONG to run this test.')

  await page.goto(rehearsalUrl!)

  if (new URL(page.url()).pathname === '/login') {
    test.skip(!email || !password, 'Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD, or provide PLAYWRIGHT_STORAGE_STATE.')
    await page.getByLabel('Email').fill(email!)
    await page.getByLabel('Mật khẩu').fill(password!)
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await page.waitForURL((url) => url.pathname !== '/login')
    await page.goto(rehearsalUrl!)
  }

  await page.getByRole('button', { name: scoreSong! }).click()

  const viewer = page.locator('.practice-score-viewer')
  const stage = viewer.locator('.practice-score-document-stage')
  await expect(viewer.getByRole('heading', { name: 'Bản nhạc' })).toBeVisible()
  // The score is fetched through a short-lived Cloudinary URL and PDF.js renders it in a worker.
  await expect(stage.locator('canvas')).toBeVisible({ timeout: 30_000 })
  await expect(viewer.getByRole('link', { name: /Mở\/Tải xuống/ })).toHaveAttribute('target', '_blank')

  const initialOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(initialOverflow).toBeLessThanOrEqual(0)

  await viewer.getByRole('button', { name: 'Phóng to bản nhạc' }).click()
  await expect(viewer.getByText('125%', { exact: true })).toBeVisible()

  const zoomed = await stage.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
  }))
  expect(zoomed.scrollWidth).toBeGreaterThan(zoomed.clientWidth)
  expect(zoomed.pageOverflow).toBeLessThanOrEqual(0)

  await viewer.getByRole('button', { name: 'Thu gọn' }).click()
  await expect(viewer.locator('#practice-score-content')).toHaveCount(0)
  await viewer.getByRole('button', { name: 'Mở bản nhạc' }).click()
  await viewer.getByRole('button', { name: 'Vừa chiều rộng' }).click()
  await expect(viewer.getByText('100%', { exact: true })).toBeVisible()
})
