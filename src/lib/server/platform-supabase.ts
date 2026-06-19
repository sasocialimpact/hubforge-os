// Platform Supabase client (env-var based) - shared across API routes.
//
// Connection pooling: Supabase recommends using the pooler URL
// (db.{project}.supabase.co:6543) for serverless deployments to avoid
// exhausting the direct connection pool (port 5432). supabase-js uses the
// REST API (PostgREST) which is inherently pooled server-side, so the
// SUPABASE_URL env var (https://{project}.supabase.co) is already safe.
//
// For direct Postgres access (future features), set:
//   SUPABASE_DB_URL=postgresql://postgres.{ref}:{password}@aws-0-{region}.pooler.supabase.com:6543/postgres
// We'll prefer this over the direct URL when both are set.
//
// Cache: one client per server instance (lazy-initialized).

let platformClient: any = null
let platformInitialized = false

export async function getPlatformClient(): Promise<any | null> {
  if (platformInitialized) return platformClient
  platformInitialized = true
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    platformClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-application-name': 'hubforge-os-platform' } },
    })
    return platformClient
  } catch (e) {
    console.error('[platform-supabase] failed to create client:', e)
    return null
  }
}
