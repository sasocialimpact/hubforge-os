import { test, expect } from '@playwright/test'

// Helper to mock logged-in state
function mockLoggedIn(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    localStorage.setItem('hubforge.auth', JSON.stringify({ email: 'test@example.com', token: 'test-token' }))
    localStorage.setItem('hubforge.landingSeen', 'true')
  })
}

test.describe('Main app (logged in)', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoggedIn(page)
    await page.goto('/')
  })

  test('dashboard loads after login', async ({ page }) => {
    // The dashboard should show the HubForge OS header
    await expect(page.getByText('HubForge OS').first()).toBeVisible()
    // Should see a "New Program" or "Programs" element in the dashboard
    await expect(page.getByRole('button', { name: /Programs|Workspace/i }).first()).toBeVisible()
  })

  test('can open settings with settings button', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /Settings/i })
    await settingsButton.click()

    // Command center / settings dialog should open
    await expect(page.getByText(/Settings|Command/i).first()).toBeVisible()
  })

  test('can open settings with Cmd+K', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    // Wait for command center to appear
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 5_000 })
  })

  test('program templates are visible on dashboard', async ({ page }) => {
    // The dashboard should show template cards or a "New Program" button
    const newProgramButton = page.getByRole('button', { name: /New Program|Create/i })
    await expect(newProgramButton.first()).toBeVisible()
  })

  test('can switch to workspace view', async ({ page }) => {
    // Click the Workspace button to switch views
    const workspaceButton = page.getByRole('button', { name: /Workspace/i })
    await workspaceButton.click()

    // After switching, the button should now say "Programs" (toggle behavior)
    await expect(page.getByRole('button', { name: /Programs/i }).first()).toBeVisible()
  })
})
