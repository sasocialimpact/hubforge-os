import { test, expect } from '@playwright/test'

test.describe('API health checks', () => {
  test('GET /api/v1/health returns 200', async ({ request }) => {
    const response = await request.get('/api/v1/health')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('ok')
    expect(body.api).toBe('hubforge-os')
  })

  test('GET /api/v1/knowledge returns 200', async ({ request }) => {
    const response = await request.get('/api/v1/knowledge')
    expect(response.status()).toBe(200)
  })

  test('GET /api/v1/packs returns 200', async ({ request }) => {
    const response = await request.get('/api/v1/packs')
    expect(response.status()).toBe(200)
  })

  test('POST /api/v1/reason without body returns 400', async ({ request }) => {
    const response = await request.post('/api/v1/reason', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('problem')
  })

  test('GET /admin page loads without admin key', async ({ request }) => {
    // Admin page is client-rendered with a key input - it should still return 200
    // (the page loads, but shows the key input form, not the dashboard)
    const response = await request.get('/admin')
    expect(response.status()).toBe(200)
  })
})
