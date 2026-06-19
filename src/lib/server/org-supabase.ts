// Server-side helper: read org-supplied Supabase credentials from request headers
// and build a per-org Supabase client (cached by URL+anonKey).
//
// Why headers, not body? The same creds apply to every persistence endpoint
// (memory, profile, analytics, programs, context-blocks). Putting them in
// headers keeps request bodies clean and lets a single middleware-style
// helper work across all routes.
//
// The anon key is safe to use from the browser (it is designed to be public
// with Row Level Security). The user runs the SQL setup script in THEIR
// Supabase project, which creates the tables and RLS policies. HubForge
// platform servers NEVER see the user's data — they only proxy the request
// to the user's Supabase.

import type { NextRequest } from 'next/server'

export const ORG_SUPABASE_URL_HEADER = 'X-Org-Supabase-Url'
export const ORG_SUPABASE_KEY_HEADER = 'X-Org-Supabase-Key'

export interface OrgSupabaseCreds {
  url: string
  anonKey: string
}

/**
 * Extract org-supplied Supabase credentials from request headers.
 * Returns null if the user hasn't connected their own Supabase.
 */
export function getOrgSupabaseCredsFromRequest(req: NextRequest): OrgSupabaseCreds | null {
  const url = req.headers.get(ORG_SUPABASE_URL_HEADER)?.trim()
  const anonKey = req.headers.get(ORG_SUPABASE_KEY_HEADER)?.trim()
  if (!url || !anonKey) return null
  // Basic sanity check — must look like a Supabase URL
  if (!/^https?:\/\/.+\..+/.test(url)) return null
  return { url, anonKey }
}

// In-memory cache of Supabase clients keyed by URL (anon keys rotate rarely,
// and re-creating clients on every request is wasteful). Cache size is bounded.
type CacheEntry = { url: string; anonKey: string; client: any; ts: number }
const clientCache: CacheEntry[] = []
const MAX_CACHE = 8
const TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Build (or fetch from cache) a Supabase client for the given org creds.
 * Returns null if @supabase/supabase-js is not installed or creds are invalid.
 */
export async function getOrgSupabaseClient(creds: OrgSupabaseCreds): Promise<any | null> {
  // Cache hit?
  const now = Date.now()
  const hit = clientCache.find((c) => c.url === creds.url && c.anonKey === creds.anonKey)
  if (hit && now - hit.ts < TTL_MS) return hit.client

  // Evict oldest if at capacity
  if (clientCache.length >= MAX_CACHE) {
    clientCache.sort((a, b) => a.ts - b.ts)
    clientCache.splice(0, clientCache.length - MAX_CACHE + 1)
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(creds.url, creds.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    clientCache.push({ url: creds.url, anonKey: creds.anonKey, client, ts: now })
    return client
  } catch (e) {
    console.error('[org-supabase] failed to create client:', e)
    return null
  }
}

/**
 * Convenience: try org-supabase from request, return client or null.
 */
export async function maybeGetOrgSupabaseClient(req: NextRequest): Promise<any | null> {
  const creds = getOrgSupabaseCredsFromRequest(req)
  if (!creds) return null
  return getOrgSupabaseClient(creds)
}
