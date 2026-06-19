// Client-side rate-limit hook + helpers.
// Fetches the user's daily strategy allowance from /api/rate-limit and exposes
// it for UI display. Own-key users get unlimited; shared-key users get 5/day.
import { useState, useEffect, useCallback } from 'react'
import { getProfileId } from './user-profile'

export interface RateLimitState {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  resetsAt: number
  isOwnKey: boolean
  loading: boolean
  error: string | null
}

export function useRateLimit(provider: string): RateLimitState & {
  refresh: () => void
  recordGeneration: () => Promise<void>
} {
  const [state, setState] = useState<RateLimitState>({
    allowed: true,
    used: 0,
    limit: 5,
    remaining: 5,
    resetsAt: 0,
    isOwnKey: false,
    loading: true,
    error: null,
  })

  const fetchLimit = useCallback(async () => {
    const profileId = getProfileId()
    try {
      const res = await fetch(`/api/rate-limit?profileId=${encodeURIComponent(profileId)}&provider=${encodeURIComponent(provider)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setState({
        allowed: data.allowed,
        used: data.used,
        limit: data.limit,
        remaining: data.remaining,
        resetsAt: data.resetsAt,
        isOwnKey: data.isOwnKey,
        loading: false,
        error: null,
      })
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message ?? 'Failed to load' }))
    }
  }, [provider])

  useEffect(() => { void fetchLimit() }, [fetchLimit])

  const recordGeneration = useCallback(async () => {
    const profileId = getProfileId()
    try {
      await fetch('/api/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, provider }),
      })
      // Refresh the local state after recording.
      void fetchLimit()
    } catch {}
  }, [provider, fetchLimit])

  return { ...state, refresh: fetchLimit, recordGeneration }
}
