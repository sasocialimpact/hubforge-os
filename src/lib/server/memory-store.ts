// Shared in-memory store for reasoning sessions.
//
// Both /api/memory (POST/GET) and /api/admin/sessions (GET) need to read
// the same set of records when Supabase is not configured. Keeping the
// array in a dedicated module means every Next.js route handler that
// imports it sees the same in-memory state (no per-route closures).
//
// The store is bounded to MEMORY_MAX records; oldest entries are evicted
// first (FIFO).

export interface FeedbackHistoryEntry {
  feedback: string
  addressed: string[]
  scoreBefore?: number | null
  scoreAfter?: number | null
  createdAt?: string | null
}

export interface MemoryRecord {
  id: string
  timestamp: string
  problem: string
  iterations: number
  finalScore: number
  thresholdMet: boolean
  finalDraft: string
  structuredOutputs?: any
  provider?: string
  // Quality Console enrichment (JSONB-equivalent in Supabase)
  critique?: any
  evaluationBreakdown?: any
  feedbackHistory?: FeedbackHistoryEntry[]
  outputTypes?: string[]
}

const MEMORY_MAX = 500

const memoryStore: MemoryRecord[] = []

export function pushMemory(record: MemoryRecord): void {
  memoryStore.push(record)
  if (memoryStore.length > MEMORY_MAX) memoryStore.shift()
}

export function clearMemory(): void {
  memoryStore.length = 0
}

export function listMemory(): MemoryRecord[] {
  // Newest first (matches Supabase ordering used in /api/memory GET).
  return [...memoryStore].reverse()
}

export function listMemoryRaw(): MemoryRecord[] {
  // Insertion-order view (used by aggregation that needs every record).
  return memoryStore
}

// Append a feedback entry to a session record's feedbackHistory.
// Used by /api/feedback when the caller passes a sessionId so the entry
// (with scoreBefore/scoreAfter) lands in the same record the Feedback
// Analysis endpoint reads. Returns true if the session was found and
// updated, false otherwise.
export function appendFeedbackToMemory(
  sessionId: string,
  entry: { feedback: string; addressed: string[]; scoreBefore?: number | null; scoreAfter?: number | null; createdAt?: string }
): boolean {
  // Sessions are stored with id `s-${Date.now()}` (set in general-mode.tsx
  // saveMemory call) - match either the exact id or one starting with the
  // same prefix.
  const rec = memoryStore.find((r) => r.id === sessionId)
  if (!rec) return false
  if (!Array.isArray(rec.feedbackHistory)) rec.feedbackHistory = []
  rec.feedbackHistory.push({
    feedback: entry.feedback,
    addressed: entry.addressed,
    scoreBefore: entry.scoreBefore ?? null,
    scoreAfter: entry.scoreAfter ?? null,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  } as any)
  return true
}
