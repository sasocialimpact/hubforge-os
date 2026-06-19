// Browser-side sync of monitoring indicators + readings to the user's own
// Supabase. Same pattern as org-supabase-sync.ts (programs + context blocks):
// localStorage remains source of truth for instant UI; Supabase is the
// persistence + cross-device layer.
import { getOrgSupabaseBrowser } from './org-supabase-sync'
import type { Indicator } from './monitoring'

function indicatorToRow(ind: Indicator) {
  return {
    indicator_id: ind.id,
    program_id: ind.programId,
    title: ind.title,
    level: ind.level,
    description: ind.description,
    baseline: ind.baseline,
    target: ind.target,
    current: ind.current,
    unit: ind.unit,
    direction: ind.direction,
    frequency: ind.frequency,
    mov: ind.mov,
    readings: ind.readings, // stored as JSONB array
    updated_at: ind.updatedAt,
  }
}

function rowToIndicator(row: any): Indicator {
  return {
    id: row.indicator_id || row.id,
    programId: row.program_id || '',
    title: row.title || 'Untitled',
    level: row.level || 'custom',
    description: row.description || '',
    baseline: row.baseline ?? 0,
    target: row.target ?? 100,
    current: row.current,
    unit: row.unit || '',
    direction: row.direction || 'increase',
    frequency: row.frequency || 'quarterly',
    mov: row.mov || '',
    readings: row.readings || [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  }
}

export async function syncIndicatorToSupabase(indicator: Indicator): Promise<void> {
  const client = getOrgSupabaseBrowser()
  if (!client) return
  try {
    const { error } = await client
      .from('indicators')
      .upsert(indicatorToRow(indicator), { onConflict: 'indicator_id' })
    if (error) console.warn('[monitoring-sync] upsert error:', error.message)
  } catch (e) {
    console.warn('[monitoring-sync] upsert failed:', e)
  }
}

export async function deleteIndicatorFromSupabase(indicatorId: string): Promise<void> {
  const client = getOrgSupabaseBrowser()
  if (!client) return
  try {
    const { error } = await client.from('indicators').delete().eq('indicator_id', indicatorId)
    if (error) console.warn('[monitoring-sync] delete error:', error.message)
  } catch (e) {
    console.warn('[monitoring-sync] delete failed:', e)
  }
}

export async function pullIndicatorsFromSupabase(programId?: string): Promise<Indicator[]> {
  const client = getOrgSupabaseBrowser()
  if (!client) return []
  try {
    let query = client.from('indicators').select('*').order('updated_at', { ascending: false }).limit(500)
    if (programId) query = query.eq('program_id', programId)
    const { data, error } = await query
    if (error) {
      console.warn('[monitoring-sync] pull error:', error.message)
      return []
    }
    return (data || []).map(rowToIndicator)
  } catch (e) {
    console.warn('[monitoring-sync] pull failed:', e)
    return []
  }
}
