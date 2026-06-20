import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth state so landing page shows
    await page.addInitScript(() => {
      localStorage.removeItem('hubforge.auth')
      localStorage.removeItem('hubforge.landingSeen')
    })
    await page.goto('/')
  })

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/HubForge OS/)
  })

  test('shows HubForge OS heading', async ({ page }) => {
    const heading = page.locator('h1')
    await expect(heading).toContainText('HubForge OS')
  })

  test('has a Launch App CTA button', async ({ page }) => {
    const launchButton = page.getByRole('button', { name: /Launch/i })
    await expect(launchButton.first()).toBeVisible()
  })

  test('has navigation links to help, privacy, and terms', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Help/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Privacy/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Terms/i })).toBeVisible()
  })
})
