// /api/admin/knowledge - Knowledge Graph CRUD for the admin editor.
//
// Endpoints:
//   GET    /api/admin/knowledge?admin_key=...&type=evidence|cases|frameworks|heuristics
//          -> { overrides: [{ id, type, item, created_at, created_by }], total, source }
//   POST   /api/admin/knowledge?admin_key=...   body: { type, item }
//          -> { override }
//   DELETE /api/admin/knowledge?admin_key=...&id=...
//          -> { success: true }
//
// Auth: requires HUBFORGE_ADMIN_KEY env var + ?admin_key=... matching it
// (same constant-time pattern as /api/admin/sessions and /api/analytics).
//
// Storage: platform Supabase `knowledge_overrides` table, or in-memory
// fallback (see src/lib/server/knowledge-store.ts).
import { NextRequest, NextResponse } from 'next/server'
import {
  listOverrides,
  addOverride,
  removeOverride,
  type KnowledgeOverrideType,
} from '@/lib/server/knowledge-store'

export const maxDuration = 10

function requireAdminKey(provided: string | null): boolean {
  const expected = process.env.HUBFORGE_ADMIN_KEY
  if (!expected) return false // admin disabled until env var is configured
  if (!provided) return false
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i++)
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

const ITEM_TYPES = new Set<KnowledgeOverrideType>([
  'evidence',
  'cases',
  'frameworks',
  'heuristics',
])

const MAX_ITEM_CHARS = 20000

// Per-type field validation. Returns an error string or null if valid.
function validateItem(type: KnowledgeOverrideType, item: any): string | null {
  if (!item || typeof item !== 'object') return 'item must be an object'
  const json = JSON.stringify(item)
  if (json.length > MAX_ITEM_CHARS) return `item too large (max ${MAX_ITEM_CHARS} chars)`

  if (type === 'evidence') {
    if (!String(item.title ?? '').trim()) return 'title is required'
    if (!String(item.summary ?? '').trim()) return 'summary is required'
    return null
  }
  if (type === 'cases') {
    if (!String(item.problem ?? '').trim()) return 'problem is required'
    if (!String(item.outcome ?? '').trim()) return 'outcome is required'
    return null
  }
  if (type === 'frameworks') {
    if (!String(item.name ?? '').trim()) return 'name is required'
    if (!String(item.description ?? '').trim()) return 'description is required'
    if (!Array.isArray(item.keyElements)) return 'keyElements must be an array'
    return null
  }
  if (type === 'heuristics') {
    if (!String(item.name ?? '').trim()) return 'name is required'
    if (!String(item.description ?? '').trim()) return 'description is required'
    return null
  }
  return 'invalid type'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    if (!requireAdminKey(searchParams.get('admin_key'))) {
      return NextResponse.json(
        { error: 'Invalid or missing admin key' },
        { status: 403 }
      )
    }
    const typeParam = searchParams.get('type') as KnowledgeOverrideType | null
    if (typeParam && !ITEM_TYPES.has(typeParam)) {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 })
    }
    const overrides = await listOverrides(typeParam ?? undefined)
    return NextResponse.json({
      overrides,
      total: overrides.length,
      source: process.env.SUPABASE_URL ? 'platform-supabase' : 'memory',
    })
  } catch (e: any) {
    console.error('[/api/admin/knowledge GET] error:', e)
    return NextResponse.json(
      { error: e?.message ?? 'Internal error', overrides: [], total: 0 },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    if (!requireAdminKey(searchParams.get('admin_key'))) {
      return NextResponse.json(
        { error: 'Invalid or missing admin key' },
        { status: 403 }
      )
    }
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    }
    const type = body.type as KnowledgeOverrideType | undefined
    if (!type || !ITEM_TYPES.has(type)) {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 })
    }
    const validation = validateItem(type, body.item)
    if (validation) {
      return NextResponse.json({ error: validation }, { status: 400 })
    }
    const override = await addOverride(type, body.item, 'admin')
    return NextResponse.json({ override })
  } catch (e: any) {
    console.error('[/api/admin/knowledge POST] error:', e)
    return NextResponse.json(
      { error: e?.message ?? 'Internal error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    if (!requireAdminKey(searchParams.get('admin_key'))) {
      return NextResponse.json(
        { error: 'Invalid or missing admin key' },
        { status: 403 }
      )
    }
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    await removeOverride(id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[/api/admin/knowledge DELETE] error:', e)
    return NextResponse.json(
      { error: e?.message ?? 'Internal error' },
      { status: 500 }
    )
  }
}
