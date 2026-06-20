'use client'

// global-error.tsx - replaces the root layout when an unhandled error occurs
// at the root. Required by Next.js App Router for production error handling.
// Must include its own <html> and <body> tags because the root layout is
// bypassed when this boundary activates.

import { useEffect } from 'react'
import { captureException, initSentry } from '@/lib/sentry'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    initSentry().then(() => captureException(error))
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              {error.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '8px 16px', fontSize: 14, fontWeight: 500,
                background: '#d97706', color: 'white', border: 'none',
                borderRadius: 6, cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
