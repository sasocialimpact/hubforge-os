// LLM Rate Limiter + Queue — protects the shared Z.ai key from being
// overwhelmed when many users hit the platform at once.
//
// Strategy:
//   - Only applies to the SHARED 'zai' provider (no user key). Users who bring
//     their own API key bypass this entirely — they're rate-limited by their
//     own provider, not by us.
//   - Uses a sliding-window counter (max N calls per M seconds).
//   - When the window is full, requests are queued and retried with exponential
//     backoff until the window drains or the request times out.
//   - In-memory per server instance. On Vercel serverless this means each
//     function instance has its own counter — good enough for soft protection
//     and analytics. For strict limits, pair with the per-user limiter
//     (rate-limit-server.ts) which keys on profileId.

const WINDOW_MS = 60_000 // 1 minute sliding window
const MAX_CONCURRENT = 8 // max in-flight shared-key calls per instance
const MAX_PER_WINDOW = 30 // max shared-key calls per minute per instance
const MAX_QUEUE_WAIT_MS = 45_000 // give up after 45s in the queue
const BACKOFF_BASE_MS = 500
const BACKOFF_MAX_MS = 5_000

// Sliding window of call timestamps (oldest first).
const callTimestamps: number[] = []
// Count of currently in-flight calls.
let inFlight = 0

interface QueueItem {
  resolve: () => void
  reject: (e: Error) => void
  enqueuedAt: number
  attempts: number
}

const queue: QueueItem[] = []
let draining = false

function pruneWindow(now: number) {
  const cutoff = now - WINDOW_MS
  while (callTimestamps.length > 0 && callTimestamps[0] < cutoff) {
    callTimestamps.shift()
  }
}

function canAdmit(now: number): boolean {
  pruneWindow(now)
  return inFlight < MAX_CONCURRENT && callTimestamps.length < MAX_PER_WINDOW
}

function recordCall() {
  inFlight++
  callTimestamps.push(Date.now())
}

function releaseCall() {
  inFlight = Math.max(0, inFlight - 1)
}

async function drainQueue() {
  if (draining) return
  draining = true
  try {
    while (queue.length > 0) {
      const now = Date.now()
      if (!canAdmit(now)) {
        // Wait a short tick and re-check.
        await new Promise((r) => setTimeout(r, 200))
        continue
      }
      const item = queue.shift()!
      // Check if this item has expired.
      if (Date.now() - item.enqueuedAt > MAX_QUEUE_WAIT_MS) {
        item.reject(new Error('Rate limit queue timeout — too many requests. Try again in a minute, or add your own API key in Settings for unlimited access.'))
        continue
      }
      item.resolve()
      // The caller will call releaseCall() when their LLM call finishes.
      // Don't loop too tightly — give the admitted call a moment to start.
      await new Promise((r) => setTimeout(r, 50))
    }
  } finally {
    draining = false
  }
}

/**
 * Acquire a rate-limit slot for a shared-key LLM call.
 * Resolves when it's safe to proceed. Rejects if the queue times out.
 * Callers MUST call `releaseSharedSlot()` when their LLM call completes
 * (success OR error) so the slot is freed for the next queued request.
 */
export async function acquireSharedSlot(): Promise<void> {
  const now = Date.now()
  if (canAdmit(now)) {
    recordCall()
    return
  }
  // Queue and wait.
  return new Promise<void>((resolve, reject) => {
    queue.push({
      resolve: () => { recordCall(); resolve() },
      reject,
      enqueuedAt: Date.now(),
      attempts: 0,
    })
    // Kick off the drain loop if not already running.
    void drainQueue()
  })
}

/** Release a slot acquired with acquireSharedSlot(). */
export function releaseSharedSlot(): void {
  releaseCall()
  // Try to drain the queue in case there are waiting requests.
  void drainQueue()
}

/**
 * Execute a function within a rate-limited slot. Handles acquire/release
 * automatically so callers don't have to remember to release.
 */
export async function withSharedSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSharedSlot()
  try {
    return await fn()
  } finally {
    releaseSharedSlot()
  }
}

/**
 * Retry a function with exponential backoff on retryable errors (rate limit,
 * 429, 5xx, network). Non-retryable errors throw immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; backoffBaseMs?: number; backoffMaxMs?: number } = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3
  const base = opts.backoffBaseMs ?? BACKOFF_BASE_MS
  const max = opts.backoffMaxMs ?? BACKOFF_MAX_MS

  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      const msg = String(e?.message || e).toLowerCase()
      const isRetryable =
        msg.includes('429') ||
        msg.includes('rate limit') ||
        msg.includes('rate_limit') ||
        msg.includes('too many requests') ||
        msg.includes('timeout') ||
        msg.includes('timed out') ||
        msg.includes('econnreset') ||
        msg.includes('socket hang up') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('504') ||
        msg.includes('service unavailable')
      if (!isRetryable || attempt === maxAttempts) throw e
      // Exponential backoff with jitter.
      const delay = Math.min(max, base * Math.pow(2, attempt - 1)) * (0.5 + Math.random() * 0.5)
      console.warn(`[rate-limit] attempt ${attempt} failed (${msg.slice(0, 60)}), retrying in ${Math.round(delay)}ms`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}

/** Inspect the current rate-limit state (for admin/debug UI). */
export function getRateLimitState() {
  pruneWindow(Date.now())
  return {
    inFlight,
    callsInLastMinute: callTimestamps.length,
    maxConcurrent: MAX_CONCURRENT,
    maxPerWindow: MAX_PER_WINDOW,
    windowMs: WINDOW_MS,
    queueLength: queue.length,
  }
}
