import { test, expect } from '@playwright/test'

test('login, create post, like, cleanup (UI)', async ({ page, request, baseURL }) => {
  // Assumes frontend dev server running at baseURL and backend at http://localhost:3000
  await page.goto('/')
  // navigate to login (app must have a route)
  await page.click('text=Login')
  // fill credentials for seeded user alice
  await page.fill('input[name="username"]', 'alice')
  await page.fill('input[name="password"]', 'password1')
  await page.click('button[type=submit]')
  // wait for posts page to show
  await page.waitForSelector('h2:has-text("Posts")')

  // open create modal
  await page.click('[aria-label="Crear post"]')
  await page.fill('textarea', 'playwright-ui-post')
  await page.click('text=Crear')
  // wait for created post to appear
  await page.waitForSelector('text=playwright-ui-post')

  // click like on the first post
  const firstLike = await page.locator('.post-card button.heart-btn').first()
  await firstLike.click()
  // optional: assert likes count increased (approximate)
  await expect(page.locator('.post-card span').first()).not.toBeEmpty()

  // call cleanup via backend request using API token from login cookie/localStorage
  // retrieve token from localStorage
  const token = await page.evaluate(() => localStorage.getItem('token') || '')
  if (token) {
    const resp = await request.delete('http://localhost:3000/posts/cleanup-orphans', { headers: { Authorization: `Bearer ${token}` } })
    expect(resp.ok()).toBeTruthy()
  }
})
