// Context Blocks - reusable knowledge blocks (geography, donor, sector).
// Saved once, reused across programs. Auto-loaded into reasoning context.
// When the user connects their own Supabase, every save/delete also upserts/
// deletes in THEIR database, and on app load we pull from their Supabase so
// blocks sync across devices/browsers.

import {
  syncBlockToSupabase,
  deleteBlockFromSupabase,
  pullBlocksFromSupabase,
  mergeBlocks,
} from './org-supabase-sync'

export interface ContextBlock {
  id: string
  type: 'geography' | 'donor' | 'sector' | 'organization' | 'stakeholder'
  name: string
  content: string
  tags: string[]
  autoSaved: boolean
  usedInPrograms: number
  createdAt: string
  updatedAt: string
}

const BLOCKS_KEY = 'hubforge.contextBlocks'

export function getBlocks(): ContextBlock[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(BLOCKS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function getBlock(id: string): ContextBlock | null {
  return getBlocks().find((b) => b.id === id) || null
}

export function saveBlock(block: ContextBlock): void {
  if (typeof window === 'undefined') return
  try {
    const blocks = getBlocks()
    const idx = blocks.findIndex((b) => b.id === block.id)
    const updated = { ...block, updatedAt: new Date().toISOString() }
    if (idx >= 0) blocks[idx] = updated
    else blocks.unshift(updated)
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
    // Fire-and-forget sync to user's own Supabase (no-op if not connected).
    void syncBlockToSupabase(updated)
  } catch {}
}

export function deleteBlock(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const block = getBlock(id)
    const blocks = getBlocks().filter((b) => b.id !== id)
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
    // Fire-and-forget delete from user's own Supabase.
    if (block) void deleteBlockFromSupabase(block)
  } catch {}
}

/**
 * Pull context blocks from the user's own Supabase (if connected) and merge.
 * Returns the merged list. Call on app mount.
 */
export async function syncBlocksFromSupabase(): Promise<ContextBlock[]> {
  if (typeof window === 'undefined') return []
  const remote = await pullBlocksFromSupabase()
  if (remote.length === 0) return getBlocks()
  const local = getBlocks()
  const merged = mergeBlocks(local, remote)
  try {
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(merged))
  } catch {}
  return merged
}

export function createBlock(data: Partial<ContextBlock>): ContextBlock {
  const now = new Date().toISOString()
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: data.type || 'geography',
    name: data.name || 'Untitled Block',
    content: data.content || '',
    tags: data.tags || [],
    autoSaved: data.autoSaved || false,
    usedInPrograms: 0,
    createdAt: now,
    updatedAt: now,
  }
}

// Auto-create a context block from web search results
export function saveSearchAsBlock(type: ContextBlock['type'], name: string, searchResults: any): ContextBlock | null {
  if (!searchResults || !name) return null
  const content = formatSearchAsContext(type, name, searchResults)
  const block = createBlock({ type, name, content, autoSaved: true, tags: [type, name] })
  saveBlock(block)
  return block
}

function formatSearchAsContext(type: string, name: string, results: any): string {
  const lines: string[] = [`## ${type.charAt(0).toUpperCase() + type.slice(1)} Context: ${name}`]
  
  if (results.summary) {
    lines.push(`\n### Summary\n${results.summary}`)
  }
  
  if (results.demographic?.length) {
    lines.push('\n### Demographic Data')
    results.demographic.slice(0, 5).forEach((r: any, i: number) => {
      lines.push(`${i + 1}. ${r.title}: ${r.snippet} (Source: ${r.source})`)
    })
  }
  
  if (results.previousPrograms?.length) {
    lines.push('\n### Previous Programs')
    results.previousPrograms.slice(0, 5).forEach((r: any, i: number) => {
      lines.push(`${i + 1}. ${r.title}: ${r.snippet} (Source: ${r.source})`)
    })
  }
  
  if (results.evidence?.length) {
    lines.push('\n### Evidence')
    results.evidence.slice(0, 5).forEach((r: any, i: number) => {
      lines.push(`${i + 1}. ${r.title}: ${r.snippet} (Source: ${r.source})`)
    })
  }
  
  return lines.join('\n')
}

// Build the context block text to include in reasoning
export function getBlocksContext(blockIds: string[]): string {
  const blocks = getBlocks().filter((b) => blockIds.includes(b.id))
  if (blocks.length === 0) return ''
  const sections = blocks.map((b) => b.content).join('\n\n---\n\n')
  return `\n## Saved Context Blocks\n\n${sections}\n\nIMPORTANT: Use this saved context to ground the strategy in real data specific to the target geography, donor requirements, and sector best practices.`
}

export const BLOCK_TYPES = [
  { id: 'geography', label: 'Geography', description: 'Country/district demographics, infrastructure, governance' },
  { id: 'donor', label: 'Donor', description: 'Reporting requirements, templates, indicator frameworks' },
  { id: 'sector', label: 'Sector', description: 'Best practices, evidence, standards' },
  { id: 'organization', label: 'Organization', description: 'Past results, team capacity, partnerships' },
  { id: 'stakeholder', label: 'Stakeholder', description: 'Government partners, community structures, local NGOs' },
]
