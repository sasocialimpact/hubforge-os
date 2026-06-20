// Shared store for Knowledge Graph overrides.
//
// The admin Knowledge Editor writes custom evidence / cases / frameworks /
// heuristics / rubric weights here. The retrieval engine and evaluation
// engine read them at runtime and merge them with the built-in pack
// (see src/lib/knowledge-overrides.ts).
//
// Data source priority:
//   1. Platform Supabase (SUPABASE_URL / SUPABASE_SERVICE_KEY env vars)
//      -> table: knowledge_overrides (id, type, item JSONB, created_at, created_by)
//   2. In-memory array (fallback when Supabase is not configured)
//
// A 30-second TTL cache is kept in-memory so the engines (which run on
// every reasoning step) don't hit Supabase on every call. Mutations
// (add/remove/setRubric) update the cache immediately.

import { getPlatformClient } from './platform-supabase'

export type KnowledgeOverrideType =
  | 'evidence'
  | 'cases'
  | 'frameworks'
  | 'heuristics'
  | 'rubric'

export interface KnowledgeOverride {
  id: string
  type: KnowledgeOverrideType
  item: any
  created_at: string
  created_by: string | null
}

const REFRESH_INTERVAL_MS = 30_000

let cache: KnowledgeOverride[] = []
let cacheLoaded = false
let lastRefresh = 0

function genId(): string {
  return `ko_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeRow(row: any): KnowledgeOverride {
  return {
    id: String(row.id ?? ''),
    type: row.type as KnowledgeOverrideType,
    item: row.item ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    created_by: row.created_by ?? null,
  }
}

// Refresh the in-memory cache from Supabase. No-op if cached and fresh.
export async function refreshCache(force = false): Promise<void> {
  const now = Date.now()
  if (!force && cacheLoaded && now - lastRefresh < REFRESH_INTERVAL_MS) return
  const supabase = await getPlatformClient()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('knowledge_overrides')
        .select('id, type, item, created_at, created_by')
        .order('created_at', { ascending: true })
      if (error) throw error
      cache = (data || []).map(normalizeRow)
      cacheLoaded = true
      lastRefresh = now
      return
    } catch (e) {
      console.error('[knowledge-store] refresh from Supabase failed:', e)
      // Fall through - keep using whatever is in memory.
    }
  }
  // No Supabase (or fetch failed) - the in-memory array IS the store.
  // Mark loaded so we don't retry on every call within the TTL window.
  cacheLoaded = true
  lastRefresh = now
}

export function listCachedOverrides(type?: KnowledgeOverrideType): KnowledgeOverride[] {
  return type ? cache.filter((o) => o.type === type) : [...cache]
}

export async function listOverrides(
  type?: KnowledgeOverrideType
): Promise<KnowledgeOverride[]> {
  await refreshCache()
  return listCachedOverrides(type)
}

export async function addOverride(
  type: KnowledgeOverrideType,
  item: any,
  createdBy?: string
): Promise<KnowledgeOverride> {
  const id = genId()
  const now = new Date().toISOString()
  const override: KnowledgeOverride = {
    id,
    type,
    item,
    created_at: now,
    created_by: createdBy ?? null,
  }
  const supabase = await getPlatformClient()
  if (supabase) {
    const { error } = await supabase.from('knowledge_overrides').insert({
      id,
      type,
      item,
      created_at: now,
      created_by: createdBy ?? null,
    })
    if (error) throw new Error(error.message || 'Supabase insert failed')
  }
  cache.push(override)
  return override
}

export async function removeOverride(id: string): Promise<boolean> {
  if (!id) throw new Error('id required')
  const supabase = await getPlatformClient()
  if (supabase) {
    const { error } = await supabase
      .from('knowledge_overrides')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message || 'Supabase delete failed')
  }
  const idx = cache.findIndex((o) => o.id === id)
  if (idx >= 0) cache.splice(idx, 1)
  return true
}

// Rubric is a singleton - only one override of type 'rubric' may exist.
// setRubricOverride replaces any existing rubric override.
export async function setRubricOverride(
  item: any,
  createdBy?: string
): Promise<KnowledgeOverride> {
  await refreshCache()
  const existing = cache.filter((o) => o.type === 'rubric')
  for (const e of existing) {
    await removeOverride(e.id)
  }
  return addOverride('rubric', item, createdBy)
}

export async function getRubricOverride(): Promise<KnowledgeOverride | null> {
  await refreshCache()
  const rubrics = cache.filter((o) => o.type === 'rubric')
  // If more than one somehow exists (race), use the most recent.
  return rubrics[rubrics.length - 1] ?? null
}

export async function clearRubricOverride(): Promise<boolean> {
  await refreshCache()
  const existing = cache.filter((o) => o.type === 'rubric')
  for (const e of existing) {
    await removeOverride(e.id)
  }
  return true
}
