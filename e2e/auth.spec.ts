import { test, expect } from '@playwright/test'

test.describe('Auth flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('hubforge.auth')
      localStorage.removeItem('hubforge.landingSeen')
    })
    await page.goto('/')
  })

  test('clicking Launch App opens auth dialog', async ({ page }) => {
    const launchButton = page.getByRole('button', { name: /Launch/i })
    await launchButton.first().click()

    // Auth dialog should appear with "Create your account" heading
    await expect(page.getByText('Create your account')).toBeVisible()
  })

  test('auth dialog shows email and password fields', async ({ page }) => {
    const launchButton = page.getByRole('button', { name: /Launch/i })
    await launchButton.first().click()

    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible()
    await expect(page.getByPlaceholder(/password/i).first()).toBeVisible()
  })

  test('can switch between signup and login', async ({ page }) => {
    // Open signup dialog
    const launchButton = page.getByRole('button', { name: /Launch/i })
    await launchButton.first().click()
    await expect(page.getByText('Create your account')).toBeVisible()

    // Switch to login
    await page.getByText('Already have an account?').locator('..').getByRole('button', { name: /Sign in/i }).click()
    await expect(page.getByText('Welcome back')).toBeVisible()

    // Switch back to signup
    await page.getByRole('button', { name: /Create account/i }).click()
    await expect(page.getByText('Create your account')).toBeVisible()
  })
})
