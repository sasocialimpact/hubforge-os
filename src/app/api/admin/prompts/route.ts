// /api/admin/prompts - Prompt version CRUD for the Prompt Manager.
//
// Endpoints:
//   GET    /api/admin/prompts?admin_key=...                  (all versions)
//   GET    /api/admin/prompts?admin_key=...&engine_id=reasoning   (one engine)
//   POST   /api/admin/prompts?admin_key=...
//          body: { engineId, systemPrompt, userPromptTemplate, label, active? }
//          -> { version }   (creates a new version; if active=true, deactivates
//             any existing active version for the same engine)
//   PATCH  /api/admin/prompts?admin_key=...&action=activate&id=...
//          -> { version }   (activates one version, deactivates the rest for the
//             same engine)
//   DELETE /api/admin/prompts?admin_key=...&id=...
//          -> { success: true }   (cannot delete the active version)
//
// Auth: requires HUBFORGE_ADMIN_KEY env var + ?admin_key=... matching it
// (same constant-time pattern as /api/admin/sessions and /api/admin/knowledge).
//
// Storage: platform Supabase `prompt_versions` table, or in-memory
// fallback (see src/lib/server/prompt-store.ts).
import { NextRequest, NextResponse } from 'next/server'
import {
  listVersions,
  addVersion,
  activateVersion,
  getVersion,
} from '@/lib/server/prompt-store'
import { ENGINE_IDS } from '@/lib/engine-prompts'

export const maxDuration = 10

function requireAdminKey(provided: string | null): boolean {
  const expected = process.env.HUBFORGE_ADMIN_KEY
  if (!expected) return false
  if (!provided) return false
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i++)
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

const ENGINE_ID_SET = new Set(ENGINE_IDS)
const MAX_PROMPT_CHARS = 20000
const MAX_LABEL_CHARS = 120

function validateBody(body: any): string | null {
  if (!body || typeof body !== 'object') return 'invalid body'
  const engineId = String(body.engineId ?? '').trim()
  if (!engineId) return 'engineId is required'
  if (!ENGINE_ID_SET.has(engineId)) return `engineId must be one of: ${ENGINE_IDS.join(', ')}`
  const label = String(body.label ?? '').trim()
  if (!label) return 'label is required'
  if (label.length > MAX_LABEL_CHARS) return `label too long (max ${MAX_LABEL_CHARS} chars)`
  const systemPrompt = String(body.systemPrompt ?? '')
  if (!systemPrompt.trim()) return 'systemPrompt is required'
  if (systemPrompt.length > MAX_PROMPT_CHARS) return `systemPrompt too long (max ${MAX_PROMPT_CHARS} chars)`
  const userPromptTemplate = String(body.userPromptTemplate ?? '')
  if (!userPromptTemplate.trim()) return 'userPromptTemplate is required'
  if (userPromptTemplate.length > MAX_PROMPT_CHARS) return `userPromptTemplate too long (max ${MAX_PROMPT_CHARS} chars)`
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    if (!requireAdminKey(searchParams.get('admin_key'))) {
      return NextResponse.json({ error: 'Invalid or missing admin key' }, { status: 403 })
    }
    const engineId = searchParams.get('engine_id') || undefined
    if (engineId && !ENGINE_ID_SET.has(engineId)) {
      return NextResponse.json({ error: 'invalid engine_id' }, { status: 400 })
    }
    const versions = await listVersions(engineId)
    return NextResponse.json({
      versions,
      total: versions.length,
      engineIds: ENGINE_IDS,
      source: process.env.SUPABASE_URL ? 'platform-supabase' : 'memory',
    })
  } catch (e: any) {
    console.error('[/api/admin/prompts GET] error:', e)
    return NextResponse.json(
      { error: e?.message ?? 'Internal error', versions: [], total: 0, engineIds: ENGINE_IDS },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    if (!requireAdminKey(searchParams.get('admin_key'))) {
      return NextResponse.json({ error: 'Invalid or missing admin key' }, { status: 403 })
    }
    const body = await req.json().catch(() => null)
    const err = validateBody(body)
    if (err) return NextResponse.json({ error: err }, { status: 400 })
    const version = await addVersion({
      engineId: String(body.engineId).trim(),
      label: String(body.label).trim(),
      systemPrompt: String(body.systemPrompt),
      userPromptTemplate: String(body.userPromptTemplate),
      active: !!body.active,
      createdBy: 'admin',
    })
    return NextResponse.json({ version })
  } catch (e: any) {
    console.error('[/api/admin/prompts POST] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    if (!requireAdminKey(searchParams.get('admin_key'))) {
      return NextResponse.json({ error: 'Invalid or missing admin key' }, { status: 403 })
    }
    const action = searchParams.get('action')
    const id = searchParams.get('id')
    if (action !== 'activate' || !id) {
      return NextResponse.json({ error: 'PATCH requires ?action=activate&id=...' }, { status: 400 })
    }
    const existing = await getVersion(id)
    if (!existing) {
      return NextResponse.json({ error: 'version not found' }, { status: 404 })
    }
    const version = await activateVersion(id)
    return NextResponse.json({ version })
  } catch (e: any) {
    console.error('[/api/admin/prompts PATCH] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
