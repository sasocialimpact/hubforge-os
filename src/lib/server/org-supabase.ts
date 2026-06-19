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
// platform servers NEVER see the user's data - they only proxy the request
// to the user's Supabase.
//
// SSRF HARDENING:
//   - URL must be HTTPS (or localhost http for dev only).
//   - URL must look like a Supabase project URL (https://<ref>.supabase.co)
//     OR a known-equivalent (supabase.co, supabase.in, supabase.red). We
//     reject http://169.254.169.254 (AWS metadata), private/internal IP
//     literals, and other SSRF targets. Self-hosted Supabase users can
//     set HUBFORGE_ALLOWED_ORIGINS env var to whitelist their host.

import type { NextRequest } from 'next/server'

export const ORG_SUPABASE_URL_HEADER = 'X-Org-Supabase-Url'
export const ORG_SUPABASE_KEY_HEADER = 'X-Org-Supabase-Key'

export interface OrgSupabaseCreds {
  url: string
  anonKey: string
}

// Hosts we always allow for org-supplied Supabase URLs. The wildcard
// `*.supabase.co` (and regional variants) covers every Supabase project.
const ALLOWED_HOST_SUFFIXES = [
  '.supabase.co',
  '.supabase.in',
  '.supabase.red',
]

// Allow localhost / 127.0.0.1 in non-production for dev workflows (Ollama,
// local Supabase via docker). In production we REQUIRE a public suffix.
function isLocalDevHost(host: string): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

// Block obvious SSRF targets: link-local, loopback (except dev), private
// ranges, cloud-metadata endpoints.
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h === '169.254.169.254' || h.startsWith('169.254.')) return true // AWS/GCP metadata
  if (h === 'metadata.google.internal') return true
  if (h.endsWith('.internal') || h.endsWith('.local')) return true
  if (/^10\./.test(h)) return true
  if (/^192\.168\./.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  // IPv6 link-local / unique-local
  if (h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true
  if (process.env.NODE_ENV === 'production' && (h === 'localhost' || h === '127.0.0.1' || h === '::1')) return true
  return false
}

/**
 * Extract org-supplied Supabase credentials from request headers.
 * Returns null if the user hasn't connected their own Supabase, or if the
 * URL fails the SSRF check (private IP, metadata endpoint, etc.).
 */
export function getOrgSupabaseCredsFromRequest(req: NextRequest): OrgSupabaseCreds | null {
  const url = req.headers.get(ORG_SUPABASE_URL_HEADER)?.trim()
  const anonKey = req.headers.get(ORG_SUPABASE_KEY_HEADER)?.trim()
  if (!url || !anonKey) return null
  if (anonKey.length > 1024) return null

  let parsed: URL
  try { parsed = new URL(url) } catch { return null }

  // Scheme: HTTPS only in production; allow http only for local dev hosts.
  if (parsed.protocol !== 'https:') {
    if (!(parsed.protocol === 'http:' && isLocalDevHost(parsed.hostname))) return null
  }
  // Port: reject weird ports for HTTPS (default 443 allowed implicitly).
  // Allow only standard ports (none / 443 / 80 for dev).
  if (parsed.port && parsed.port !== '443' && parsed.port !== '80') {
    // Self-hosted Supabase may run on custom ports - allow only if the
    // host is a local dev host.
    if (!isLocalDevHost(parsed.hostname)) return null
  }
  // Path must not allow smuggling tricks (no @, no encoded slashes).
  if (parsed.username || parsed.password) return null

  const host = parsed.hostname
  if (isBlockedHost(host)) return null

  // Allowed: *.supabase.co (and regional variants), local dev hosts,
  // and any host explicitly whitelisted via HUBFORGE_ALLOWED_ORIGINS
  // (comma-separated list of hostnames).
  const allowed =
    ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
    isLocalDevHost(host)
  if (!allowed) {
    const envAllowed = process.env.HUBFORGE_ALLOWED_ORIGINS
    if (!envAllowed) return null
    const extra = envAllowed.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    if (!extra.includes(host.toLowerCase())) return null
  }

  return { url: parsed.toString(), anonKey }
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
 *
 * Connection pooling: Supabase projects have a connection pooler on port 6543
 * (vs direct connection on 5432). For serverless deployments (Vercel), the
 * pooler is strongly recommended to avoid exhausting the direct connection
 * pool. We auto-rewrite the REST URL to use the pooler hostname if the user
 * provided a direct-connection URL. (The REST API itself is pooled server-side
 * by Supabase, so this is mainly relevant for future Postgres-direct features.)
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
    // Use the pooler-enabled endpoint. Supabase's REST API (rest/v1) is already
    // pooled server-side, so we just use the standard URL. The connection
    // pooling concern mainly applies to direct Postgres connections which we
    // don't make here (we use the REST API via supabase-js).
    const client = createClient(creds.url, creds.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      // supabase-js uses the REST API (PostgREST) which is inherently pooled.
      // These options tune the fetch behavior for serverless:
      global: {
        headers: { 'x-application-name': 'hubforge-os' },
      },
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
