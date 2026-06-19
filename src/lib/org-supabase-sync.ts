// Browser-side sync to the user's OWN Supabase.
//
// Why browser-side and not via our API routes?
//   - The anon key is designed to be public (RLS protects data).
//   - Programs/context-blocks are large JSON blobs; routing them through our
//     API doubles bandwidth and adds latency.
//   - It's the user's data — the request should go directly to their DB,
//     bypassing HubForge servers entirely.
//
// localStorage remains the source of truth for instant UI feedback. After
// every local mutation we fire-and-forget a sync to Supabase. On app load
// (if connected) we pull from Supabase so users get their data when they
// switch devices/browsers.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getOrgSupabase, hasOrgSupabase } from './org-supabase'
import type { Program } from './programs'
import type { ContextBlock } from './context-blocks'

let cachedClient: SupabaseClient | null = null
let cachedUrl = ''
let cachedKey = ''

/**
 * Get a cached browser-side Supabase client for the user's own DB.
 * Returns null if the user hasn't connected their own Supabase.
 */
export function getOrgSupabaseBrowser(): SupabaseClient | null {
  if (!hasOrgSupabase()) return null
  const cfg = getOrgSupabase()!
  // Re-create if creds changed (user disconnected and reconnected)
  if (cachedClient && cachedUrl === cfg.url && cachedKey === cfg.anonKey) return cachedClient
  try {
    cachedClient = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    cachedUrl = cfg.url
    cachedKey = cfg.anonKey
    return cachedClient
  } catch (e) {
    console.error('[org-supabase-sync] failed to create client:', e)
    return null
  }
}

/** Drop the cached client — call after the user disconnects their Supabase. */
export function resetOrgSupabaseBrowser(): void {
  cachedClient = null
  cachedUrl = ''
  cachedKey = ''
}

// ───────────────────────────────────────────────────────────────────────────
// Programs
// ───────────────────────────────────────────────────────────────────────────

function programToRow(p: Program) {
  return {
    program_id: p.id,
    title: p.title,
    status: p.status,
    problem: p.problem,
    draft: p.draft,
    evaluation: p.evaluation,
    structured_outputs: p.structured,
    output_types: p.outputTypes,
    feedback_history: p.feedbackHistory,
    tags: p.tags,
    provider: p.provider,
    updated_at: p.updatedAt,
  }
}

function rowToProgram(row: any): Program {
  return {
    id: row.program_id || row.id,
    title: row.title || 'Untitled Program',
    status: row.status || 'draft',
    problem: row.problem || '',
    outputTypes: row.output_types || ['strategy', 'toc'],
    draft: row.draft || '',
    evaluation: row.evaluation || null,
    structured: row.structured_outputs || null,
    feedbackHistory: row.feedback_history || [],
    provider: row.provider || 'zai',
    tags: row.tags || {},
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  }
}

/** Upsert a program to the user's Supabase. Fire-and-forget. */
export async function syncProgramToSupabase(program: Program): Promise<void> {
  const client = getOrgSupabaseBrowser()
  if (!client) return
  try {
    const { error } = await client
      .from('programs')
      .upsert(programToRow(program), { onConflict: 'program_id' })
    if (error) console.warn('[org-supabase-sync] program upsert error:', error.message)
  } catch (e) {
    console.warn('[org-supabase-sync] program upsert failed:', e)
  }
}

/** Delete a program from the user's Supabase. */
export async function deleteProgramFromSupabase(programId: string): Promise<void> {
  const client = getOrgSupabaseBrowser()
  if (!client) return
  try {
    const { error } = await client.from('programs').delete().eq('program_id', programId)
    if (error) console.warn('[org-supabase-sync] program delete error:', error.message)
  } catch (e) {
    console.warn('[org-supabase-sync] program delete failed:', e)
  }
}

/**
 * Pull all programs from the user's Supabase. Use on app load to sync across
 * devices. Returns [] if not connected or on error.
 */
export async function pullProgramsFromSupabase(): Promise<Program[]> {
  const client = getOrgSupabaseBrowser()
  if (!client) return []
  try {
    const { data, error } = await client
      .from('programs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200)
    if (error) {
      console.warn('[org-supabase-sync] programs pull error:', error.message)
      return []
    }
    return (data || []).map(rowToProgram)
  } catch (e) {
    console.warn('[org-supabase-sync] programs pull failed:', e)
    return []
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Context blocks
// ───────────────────────────────────────────────────────────────────────────

function blockToRow(b: ContextBlock) {
  return {
    id: undefined, // let supabase generate
    block_type: b.type,
    name: b.name,
    content: b.content,
    tags: b.tags,
    auto_saved: b.autoSaved,
    updated_at: b.updatedAt,
  }
}

// We use a stable secondary key (block_type + name) for upsert since the
// browser-generated id isn't the Supabase primary key.
function rowToBlock(row: any): ContextBlock {
  const now = new Date().toISOString()
  return {
    id: `block-${row.id}`, // use supabase uuid to dedupe on pull
    type: row.block_type,
    name: row.name,
    content: row.content || '',
    tags: row.tags || [],
    autoSaved: row.auto_saved || false,
    usedInPrograms: 0,
    createdAt: row.created_at || now,
    updatedAt: row.updated_at || now,
  }
}

/** Upsert a context block to the user's Supabase. */
export async function syncBlockToSupabase(block: ContextBlock): Promise<void> {
  const client = getOrgSupabaseBrowser()
  if (!client) return
  try {
    // Try to find existing by block_type + name to update; else insert.
    const { data: existing } = await client
      .from('context_blocks')
      .select('id')
      .eq('block_type', block.type)
      .eq('name', block.name)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await client
        .from('context_blocks')
        .update(blockToRow(block))
        .eq('id', existing.id)
      if (error) console.warn('[org-supabase-sync] block update error:', error.message)
    } else {
      const { error } = await client.from('context_blocks').insert(blockToRow(block))
      if (error) console.warn('[org-supabase-sync] block insert error:', error.message)
    }
  } catch (e) {
    console.warn('[org-supabase-sync] block upsert failed:', e)
  }
}

/** Delete a context block from the user's Supabase by type+name. */
export async function deleteBlockFromSupabase(block: ContextBlock): Promise<void> {
  const client = getOrgSupabaseBrowser()
  if (!client) return
  try {
    const { error } = await client
      .from('context_blocks')
      .delete()
      .eq('block_type', block.type)
      .eq('name', block.name)
    if (error) console.warn('[org-supabase-sync] block delete error:', error.message)
  } catch (e) {
    console.warn('[org-supabase-sync] block delete failed:', e)
  }
}

/** Pull all context blocks from the user's Supabase. */
export async function pullBlocksFromSupabase(): Promise<ContextBlock[]> {
  const client = getOrgSupabaseBrowser()
  if (!client) return []
  try {
    const { data, error } = await client
      .from('context_blocks')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200)
    if (error) {
      console.warn('[org-supabase-sync] blocks pull error:', error.message)
      return []
    }
    return (data || []).map(rowToBlock)
  } catch (e) {
    console.warn('[org-supabase-sync] blocks pull failed:', e)
    return []
  }
}

/**
 * Merge remote programs into local localStorage, preferring the newer
 * `updatedAt`. Returns the merged list (caller writes it back to localStorage).
 */
export function mergePrograms(local: Program[], remote: Program[]): Program[] {
  const byId = new Map<string, Program>()
  for (const p of local) byId.set(p.id, p)
  for (const r of remote) {
    const existing = byId.get(r.id)
    if (!existing || new Date(r.updatedAt) > new Date(existing.updatedAt)) {
      byId.set(r.id, r)
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

/** Merge remote context blocks into local (same logic as programs). */
export function mergeBlocks(local: ContextBlock[], remote: ContextBlock[]): ContextBlock[] {
  const byId = new Map<string, ContextBlock>()
  for (const b of local) byId.set(`${b.type}::${b.name}`, b)
  for (const r of remote) {
    const key = `${r.type}::${r.name}`
    const existing = byId.get(key)
    if (!existing || new Date(r.updatedAt) > new Date(existing.updatedAt)) {
      byId.set(key, r)
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}
