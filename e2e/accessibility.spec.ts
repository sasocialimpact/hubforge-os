import { test, expect } from '@playwright/test'

test.describe('Accessibility basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('hubforge.auth')
      localStorage.removeItem('hubforge.landingSeen')
    })
    await page.goto('/')
  })

  test('landing page has proper heading hierarchy', async ({ page }) => {
    // Should have an h1
    const h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()

    // h2 headings should exist for sections
    const h2Count = await page.locator('h2').count()
    expect(h2Count).toBeGreaterThan(0)
  })

  test('interactive elements are keyboard-focusable', async ({ page }) => {
    // Tab through the page and verify focus moves to interactive elements
    await page.keyboard.press('Tab')
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase())
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(focusedTag)

    // Tab a few more times to ensure focus keeps moving
    await page.keyboard.press('Tab')
    const secondFocusedTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase())
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(secondFocusedTag)
  })

  test('images have alt text', async ({ page }) => {
    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt, `Image ${i} is missing alt text`).toBeTruthy()
    }
  })
})
