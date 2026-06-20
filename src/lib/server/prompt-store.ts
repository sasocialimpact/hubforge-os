// Shared store for Prompt A/B Testing versions.
//
// The admin Prompt Manager (Prompts tab in /admin) writes new prompt versions
// here. Each engine can have many saved versions, but only ONE may be `active`
// per engine at a time. The A/B Test endpoint reads two versions, runs the
// same problem through both, and returns side-by-side outputs + scores.
//
// Data source priority:
//   1. Platform Supabase (SUPABASE_URL / SUPABASE_SERVICE_KEY env vars)
//      -> table: prompt_versions (id, engine_id, label, system_prompt,
//                  user_prompt_template, active, created_at, created_by, avg_score)
//   2. In-memory array (fallback when Supabase is not configured)
//
// On first read, if no versions exist for an engine, the store lazily seeds a
// "Built-in" version from src/lib/engine-prompts.ts using the built-in
// socialImpactPack so the admin has a baseline to fork from.

import { getPlatformClient } from './platform-supabase'
import { getEnginePrompt, ENGINE_IDS } from '@/lib/engine-prompts'
import { socialImpactPack } from '@/lib/knowledge'

export interface PromptVersion {
  id: string
  engineId: string
  label: string
  systemPrompt: string
  userPromptTemplate: string
  active: boolean
  createdAt: string
  createdBy: string | null
  // Rolling average of evaluation.overall across all strategies generated
  // while this version was active. Used by the version history table.
  avgScore: number | null
  runCount: number
}

let cache: PromptVersion[] = []
let cacheLoaded = false

function genId(): string {
  return `pv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeRow(row: any): PromptVersion {
  return {
    id: String(row.id ?? ''),
    engineId: String(row.engine_id ?? row.engineId ?? ''),
    label: String(row.label ?? ''),
    systemPrompt: String(row.system_prompt ?? row.systemPrompt ?? ''),
    userPromptTemplate: String(row.user_prompt_template ?? row.userPromptTemplate ?? ''),
    active: !!row.active,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    createdBy: row.created_by ?? row.createdBy ?? null,
    avgScore: row.avg_score != null ? Number(row.avg_score) : (row.avgScore != null ? Number(row.avgScore) : null),
    runCount: Number(row.run_count ?? row.runCount ?? 0),
  }
}

// Seed the store with a "Built-in" version for every engine on first load.
// This gives the admin a baseline to fork from and ensures the version history
// is never empty.
function seedBuiltInVersions(): PromptVersion[] {
  const now = new Date().toISOString()
  return ENGINE_IDS.map((engineId, i) => {
    const info = getEnginePrompt(engineId, socialImpactPack)
    return {
      id: `pv_builtin_${engineId}`,
      engineId,
      label: 'Built-in (v' + (info?.version ?? '1.0.0') + ')',
      systemPrompt: info?.systemPrompt ?? '',
      userPromptTemplate: info?.userPromptTemplate ?? '',
      active: true, // mark all built-ins as active by default
      createdAt: new Date(Date.now() - (ENGINE_IDS.length - i) * 1000).toISOString(),
      createdBy: 'system',
      avgScore: null,
      runCount: 0,
    }
  })
}

async function refreshFromSupabase(force = false): Promise<void> {
  if (!force && cacheLoaded) return
  const supabase = await getPlatformClient()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('id, engine_id, label, system_prompt, user_prompt_template, active, created_at, created_by, avg_score, run_count')
        .order('created_at', { ascending: true })
      if (error) throw error
      if (data && data.length > 0) {
        cache = (data as any[]).map(normalizeRow)
        cacheLoaded = true
        return
      }
      // Empty table - seed built-ins and persist.
      const seeded = seedBuiltInVersions()
      for (const v of seeded) {
        await supabase.from('prompt_versions').insert({
          id: v.id,
          engine_id: v.engineId,
          label: v.label,
          system_prompt: v.systemPrompt,
          user_prompt_template: v.userPromptTemplate,
          active: v.active,
          created_at: v.createdAt,
          created_by: v.createdBy,
          avg_score: v.avgScore,
          run_count: v.runCount,
        })
      }
      cache = seeded
      cacheLoaded = true
      return
    } catch (e) {
      console.error('[prompt-store] refresh from Supabase failed:', e)
    }
  }
  // No Supabase - seed in-memory if empty.
  if (cache.length === 0) cache = seedBuiltInVersions()
  cacheLoaded = true
}

export async function listVersions(engineId?: string): Promise<PromptVersion[]> {
  await refreshFromSupabase()
  const filtered = engineId ? cache.filter((v) => v.engineId === engineId) : [...cache]
  // Newest first - matches the version history table ordering in the UI.
  return filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function getVersion(id: string): Promise<PromptVersion | null> {
  await refreshFromSupabase()
  return cache.find((v) => v.id === id) ?? null
}

export async function getActiveVersion(engineId: string): Promise<PromptVersion | null> {
  await refreshFromSupabase()
  return cache.find((v) => v.engineId === engineId && v.active) ?? null
}

export interface NewPromptVersionInput {
  engineId: string
  label: string
  systemPrompt: string
  userPromptTemplate: string
  active?: boolean
  createdBy?: string
}

export async function addVersion(input: NewPromptVersionInput): Promise<PromptVersion> {
  await refreshFromSupabase()
  const id = genId()
  const now = new Date().toISOString()
  const version: PromptVersion = {
    id,
    engineId: input.engineId,
    label: input.label,
    systemPrompt: input.systemPrompt,
    userPromptTemplate: input.userPromptTemplate,
    active: !!input.active,
    createdAt: now,
    createdBy: input.createdBy ?? 'admin',
    avgScore: null,
    runCount: 0,
  }
  const supabase = await getPlatformClient()
  if (supabase) {
    // If active, first deactivate any existing active version for this engine
    // (DB-level invariant: only one active per engine).
    if (version.active) {
      await supabase
        .from('prompt_versions')
        .update({ active: false })
        .eq('engine_id', input.engineId)
        .eq('active', true)
    }
    const { error } = await supabase.from('prompt_versions').insert({
      id,
      engine_id: version.engineId,
      label: version.label,
      system_prompt: version.systemPrompt,
      user_prompt_template: version.userPromptTemplate,
      active: version.active,
      created_at: now,
      created_by: version.createdBy,
      avg_score: null,
      run_count: 0,
    })
    if (error) throw new Error(error.message || 'Supabase insert failed')
  } else {
    // In-memory: enforce single-active invariant in the array.
    if (version.active) {
      for (const v of cache) {
        if (v.engineId === input.engineId && v.active) v.active = false
      }
    }
  }
  cache.push(version)
  return version
}

export async function activateVersion(id: string): Promise<PromptVersion | null> {
  await refreshFromSupabase()
  const target = cache.find((v) => v.id === id)
  if (!target) return null
  const engineId = target.engineId
  const supabase = await getPlatformClient()
  if (supabase) {
    // Deactivate all other versions for this engine, then activate the target.
    await supabase
      .from('prompt_versions')
      .update({ active: false })
      .eq('engine_id', engineId)
      .neq('id', id)
    const { error } = await supabase
      .from('prompt_versions')
      .update({ active: true })
      .eq('id', id)
    if (error) throw new Error(error.message || 'Supabase update failed')
  }
  // Update in-memory cache regardless of storage backend.
  for (const v of cache) {
    if (v.engineId === engineId) v.active = (v.id === id)
  }
  return cache.find((v) => v.id === id) ?? null
}

export async function recordRun(id: string, score: number): Promise<void> {
  // Update the rolling average quality score for a version after a strategy
  // was generated with it. Called by /api/admin/ab-test and any future
  // "tagged" production runs.
  await refreshFromSupabase()
  const v = cache.find((x) => x.id === id)
  if (!v) return
  const n = v.runCount + 1
  const prev = v.avgScore ?? 0
  // Rolling mean: new_avg = prev + (score - prev) / n
  const newAvg = Math.round((prev + (score - prev) / n) * 10) / 10
  v.avgScore = newAvg
  v.runCount = n
  const supabase = await getPlatformClient()
  if (supabase) {
    await supabase
      .from('prompt_versions')
      .update({ avg_score: newAvg, run_count: n })
      .eq('id', id)
  }
}
