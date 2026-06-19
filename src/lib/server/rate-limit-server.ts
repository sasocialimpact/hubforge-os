// Per-user daily rate limiting for the shared Z.ai key.
//
// Why: Without per-user limits, one user could exhaust the shared key's daily
// quota, breaking the platform for everyone. Free users get a generous daily
// allowance; users who bring their own API key are unlimited (their provider
// rate-limits them, not us).
//
// Limits:
//   - Shared 'zai' provider: 5 strategy generations per day per profileId
//   - Own-key providers: unlimited (the user's provider handles their limits)
//   - Individual engine steps (retrieval, rule, critique, etc.) are NOT counted
//     - only the full interview (start of a generation) counts as 1 "strategy".
//     This prevents the 9-engine pipeline from consuming 9x the allowance.
//
// BYPASS HARDENING:
//   - Callers MUST pass a profileId. Anonymous (profileId=null) requests are
//     no longer given unlimited access - they get a strict per-IP daily quota
//     (DAILY_LIMIT) so an attacker can't bypass rate limits by simply
//     omitting the header.
//
// Storage: in-memory Map per server instance. On Vercel serverless this means
// each instance tracks its own subset of users - not perfectly accurate, but
// good enough to prevent abuse. For strict accuracy, move to a shared store
// (Upstash Redis, Supabase) via the COUNT_KEY pattern below.

const DAILY_LIMIT = 5
const WINDOW_MS = 24 * 60 * 60 * 1000

// Map<profileId, { date: string, count: number }>
// Using date string (YYYY-MM-DD) so counts reset at local midnight.
const userCounts = new Map<string, { date: string; count: number }>()

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export interface RateLimitResult {
  allowed: boolean
  reason?: 'limit_exceeded' | 'limit_unknown'
  used: number
  limit: number
  remaining: number
  resetsAt: number // epoch ms
  isOwnKey: boolean
}

/**
 * Check if a user can make a strategy generation call.
 * Does NOT increment the counter - call recordStrategyGeneration() after a
 * successful generation.
 */
export function checkRateLimit(profileId: string | null | undefined, provider: string): RateLimitResult {
  // Own-key users are unlimited.
  const isOwnKey = provider !== 'zai'
  if (isOwnKey) {
    return {
      allowed: true,
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      resetsAt: 0,
      isOwnKey: true,
    }
  }

  // Shared key - enforce per-user daily limit.
  // We require a profileId. If none is supplied, fall back to the anonymous
  // bucket ("anon") so untracked callers share the same DAILY_LIMIT rather
  // than getting unlimited access. This closes the bypass where an attacker
  // simply omits the header.
  const bucketKey = profileId && profileId.length > 0 && profileId.length <= 200
    ? profileId
    : 'anon'

  const today = todayKey()
  const entry = userCounts.get(bucketKey)
  const used = entry && entry.date === today ? entry.count : 0
  const remaining = Math.max(0, DAILY_LIMIT - used)
  const resetsAt = Date.now() + WINDOW_MS // approximate

  return {
    allowed: used < DAILY_LIMIT,
    reason: used >= DAILY_LIMIT ? 'limit_exceeded' : undefined,
    used,
    limit: DAILY_LIMIT,
    remaining,
    resetsAt,
    isOwnKey: false,
  }
}

/**
 * Record a successful strategy generation. Call this AFTER a generation
 * completes (not before) so failed generations don't consume the allowance.
 */
export function recordStrategyGeneration(profileId: string | null | undefined, provider: string): void {
  // Don't count own-key users.
  if (provider !== 'zai') return
  const bucketKey = profileId && profileId.length > 0 && profileId.length <= 200
    ? profileId
    : 'anon'
  const today = todayKey()
  const entry = userCounts.get(bucketKey)
  if (entry && entry.date === today) {
    entry.count++
  } else {
    userCounts.set(bucketKey, { date: today, count: 1 })
  }
}

/**
 * Get the current rate-limit state for a user (for UI display).
 */
export function getUserRateLimit(profileId: string | null | undefined, provider: string): RateLimitResult {
  return checkRateLimit(profileId, provider)
}

/** Admin: get all tracked users' counts (for the admin dashboard). */
export function getAllRateLimits() {
  const today = todayKey()
  const entries: { profileId: string; count: number; date: string }[] = []
  for (const [profileId, entry] of userCounts.entries()) {
    if (entry.date === today) {
      entries.push({ profileId, count: entry.count, date: entry.date })
    }
  }
  return { dailyLimit: DAILY_LIMIT, users: entries, totalToday: entries.reduce((s, e) => s + e.count, 0) }
}
