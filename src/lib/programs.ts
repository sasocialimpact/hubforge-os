// Program Workspaces - save, resume, and manage multiple programs.
// Stored in localStorage (with Supabase sync if configured).
// When the user connects their own Supabase (Data Storage dialog), every
// save/delete also upserts/deletes in THEIR database. On app load, we pull
// from their Supabase so they see their data across devices/browsers.

import {
  syncProgramToSupabase,
  deleteProgramFromSupabase,
  pullProgramsFromSupabase,
  mergePrograms,
} from './org-supabase-sync'

export interface Program {
  id: string
  title: string
  status: 'draft' | 'in_review' | 'submitted' | 'funded' | 'active' | 'closed'
  problem: string
  outputTypes: string[]
  draft: string
  evaluation: any
  structured: any
  feedbackHistory: { feedback: string; addressed: string[]; timestamp: string }[]
  provider: string
  templateId?: string
  tags: { donor?: string; geography?: string; sector?: string; budget?: string }
  createdAt: string
  updatedAt: string
}

const PROGRAMS_KEY = 'hubforge.programs'

export function getPrograms(): Program[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PROGRAMS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function getProgram(id: string): Program | null {
  const programs = getPrograms()
  return programs.find((p) => p.id === id) || null
}

export function saveProgram(program: Program): void {
  if (typeof window === 'undefined') return
  try {
    const programs = getPrograms()
    const idx = programs.findIndex((p) => p.id === program.id)
    const updated = { ...program, updatedAt: new Date().toISOString() }
    if (idx >= 0) {
      programs[idx] = updated
    } else {
      programs.unshift(updated)
    }
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs))
    // Fire-and-forget sync to user's own Supabase (no-op if not connected).
    void syncProgramToSupabase(updated)
  } catch {}
}

export function deleteProgram(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const programs = getPrograms().filter((p) => p.id !== id)
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs))
    // Fire-and-forget delete from user's own Supabase.
    void deleteProgramFromSupabase(id)
  } catch {}
}

/**
 * Pull programs from the user's own Supabase (if connected) and merge with
 * local. Call on app/dashboard mount. Returns the merged list (caller should
 * also persist it via saveAllPrograms if they want localStorage updated).
 */
export async function syncProgramsFromSupabase(): Promise<Program[]> {
  if (typeof window === 'undefined') return []
  const remote = await pullProgramsFromSupabase()
  if (remote.length === 0) return getPrograms()
  const local = getPrograms()
  const merged = mergePrograms(local, remote)
  try {
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(merged))
  } catch {}
  return merged
}

/** Overwrite all local programs (used after merge). Exposed for the dashboard. */
export function saveAllPrograms(programs: Program[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs))
  } catch {}
}

export function createProgram(data: Partial<Program>): Program {
  const now = new Date().toISOString()
  return {
    id: `prog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: data.title || 'Untitled Program',
    status: 'draft',
    problem: data.problem || '',
    outputTypes: data.outputTypes || ['strategy', 'toc'],
    draft: data.draft || '',
    evaluation: data.evaluation || null,
    structured: data.structured || null,
    feedbackHistory: data.feedbackHistory || [],
    provider: data.provider || 'zai',
    templateId: data.templateId,
    tags: data.tags || {},
    createdAt: now,
    updatedAt: now,
  }
}

export function duplicateProgram(id: string): Program | null {
  const original = getProgram(id)
  if (!original) return null
  const copy = createProgram({
    ...original,
    title: `${original.title} (Copy)`,
    status: 'draft',
    draft: original.draft,
    structured: original.structured,
    outputTypes: original.outputTypes,
    tags: original.tags,
  })
  saveProgram(copy)
  return copy
}

export const PROGRAM_STATUSES = [
  { id: 'draft', label: 'Draft', color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
  { id: 'in_review', label: 'In Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { id: 'funded', label: 'Funded', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  { id: 'active', label: 'Active', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  { id: 'closed', label: 'Closed', color: 'bg-muted text-muted-foreground' },
]
