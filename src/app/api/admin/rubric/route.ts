// /api/admin/rubric - Evaluation rubric weights editor.
//
// Endpoints:
//   GET  /api/admin/rubric?admin_key=...
//        -> { override: { criteria: [...] } | null, builtIn: [...], effective: [...], source }
//   POST /api/admin/rubric?admin_key=...   body: { criteria: EvaluationCriterion[] }
//        -> { override }
//   DELETE /api/admin/rubric?admin_key=...   (reset to built-in)
//        -> { success: true }
//
// The evaluation engine reads the effective rubric at runtime via
// src/lib/knowledge-overrides.ts -> getMergedRubric(), so an admin save
// takes effect on the next reasoning run with no code change.
//
// Weights must sum to 1.0 (within a 0.001 tolerance). If they don't,
// the POST returns 400 and the admin must adjust before saving.
import { NextRequest, NextResponse } from 'next/server'
import {
  getRubricOverride,
  setRubricOverride,
  clearRubricOverride,
} from '@/lib/server/knowledge-store'
import { socialImpactPack } from '@/lib/knowledge'
import type { EvaluationCriterion } from '@/lib/knowledge'

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

const MAX_CRITERIA = 20
const WEIGHT_TOLERANCE = 0.001

function normalizeCriteria(input: any): EvaluationCriterion[] | { error: string } {
  if (!Array.isArray(input)) return { error: 'criteria must be an array' }
  if (input.length === 0) return { error: 'criteria cannot be empty' }
  if (input.length > MAX_CRITERIA)
    return { error: `too many criteria (max ${MAX_CRITERIA})` }

  const out: EvaluationCriterion[] = []
  const seen = new Set<string>()
  for (const c of input) {
    if (!c || typeof c !== 'object') return { error: 'each criterion must be an object' }
    const criterion = String(c.criterion ?? '').trim()
    if (!criterion) return { error: 'criterion name is required' }
    const key = criterion.toLowerCase()
    if (seen.has(key)) return { error: `duplicate criterion: ${criterion}` }
    seen.add(key)
    const weight = Number(c.weight)
    if (!Number.isFinite(weight))
      return { error: `weight for "${criterion}" must be a number` }
    if (weight < 0 || weight > 1)
      return { error: `weight for "${criterion}" must be between 0 and 1` }
    out.push({
      criterion,
      weight,
      description: String(c.description ?? '').trim(),
      scoringGuide: String(c.scoringGuide ?? '').trim(),
    })
  }

  const sum = out.reduce((a, c) => a + c.weight, 0)
  if (Math.abs(sum - 1) > WEIGHT_TOLERANCE) {
    return { error: `weights must sum to 1.0 (currently ${sum.toFixed(3)})` }
  }
  return out
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
    const override = await getRubricOverride()
    const overrideCriteria =
      override && Array.isArray(override.item?.criteria)
        ? (override.item.criteria as EvaluationCriterion[])
        : null
    return NextResponse.json({
      override: overrideCriteria,
      builtIn: socialImpactPack.evaluationCriteria,
      effective: overrideCriteria ?? socialImpactPack.evaluationCriteria,
      overrideId: override?.id ?? null,
      source: process.env.SUPABASE_URL ? 'platform-supabase' : 'memory',
    })
  } catch (e: any) {
    console.error('[/api/admin/rubric GET] error:', e)
    return NextResponse.json(
      { error: e?.message ?? 'Internal error' },
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
    const result = normalizeCriteria(body.criteria)
    if (!Array.isArray(result)) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    const override = await setRubricOverride({ criteria: result }, 'admin')
    return NextResponse.json({ override })
  } catch (e: any) {
    console.error('[/api/admin/rubric POST] error:', e)
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
    await clearRubricOverride()
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[/api/admin/rubric DELETE] error:', e)
    return NextResponse.json(
      { error: e?.message ?? 'Internal error' },
      { status: 500 }
    )
  }
}
