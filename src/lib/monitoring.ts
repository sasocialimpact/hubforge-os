// Monitoring Tracker - the bridge from planning tool to operating system.
//
// Without this, strategies die at submission. With it:
//   - Indicators (from the logframe OVIs) get tracked over time
//   - RAG status (Red/Amber/Green) shows progress at a glance
//   - Lessons compound: what worked / what didn't feeds back into the
//     knowledge graph for the next program
//   - Donor reports become a one-click export (the data is already here)
//
// Data model:
//   Program → has Indicators (derived from logframe OVIs, or manual)
//   Indicator → has Readings (timestamped measurements)
//   Reading → { value, date, note, source }
//   Indicator status → RAG computed from latest reading vs target

export interface Indicator {
  id: string
  programId: string
  title: string           // e.g. "Reading levels of 3,000 children improved"
  level: 'goal' | 'purpose' | 'output' | 'activity' | 'custom'
  description?: string
  baseline?: number       // starting value
  target: number          // goal value
  current?: number        // latest reading value (computed from readings)
  unit: string            // "children", "%", "schools", "$"
  direction: 'increase' | 'decrease'  // increase = higher is better, decrease = lower
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time'
  mov?: string            // means of verification (from logframe)
  readings: Reading[]
  createdAt: string
  updatedAt: string
}

export interface Reading {
  id: string
  value: number
  date: string            // ISO date the reading was taken
  note?: string           // context: "Q3 2024 survey", "Field officer report"
  source?: string         // "survey", "admin data", "observation"
  createdAt: string
}

export type RAGStatus = 'green' | 'amber' | 'red' | 'gray'

export interface IndicatorWithStatus extends Indicator {
  status: RAGStatus
  progressPercent: number  // 0-100, computed from baseline/target/current
  lastReadingDate?: string
  nextDueDate?: string     // computed from frequency + last reading
}

const INDICATORS_KEY = 'hubforge.indicators'

// ───────────────────────────────────────────────────────────────────────────
// CRUD
// ───────────────────────────────────────────────────────────────────────────

export function getIndicators(programId?: string): Indicator[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(INDICATORS_KEY)
    const all: Indicator[] = raw ? JSON.parse(raw) : []
    return programId ? all.filter((i) => i.programId === programId) : all
  } catch {
    return []
  }
}

export function getIndicator(id: string): Indicator | null {
  return getIndicators().find((i) => i.id === id) || null
}

export function saveIndicator(indicator: Indicator): void {
  if (typeof window === 'undefined') return
  try {
    const all = getIndicators()
    const idx = all.findIndex((i) => i.id === indicator.id)
    const updated = { ...indicator, updatedAt: new Date().toISOString() }
    // Recompute current from latest reading.
    updated.current = updated.readings.length > 0
      ? updated.readings[updated.readings.length - 1].value
      : indicator.current
    if (idx >= 0) all[idx] = updated
    else all.unshift(updated)
    localStorage.setItem(INDICATORS_KEY, JSON.stringify(all))
    // Fire-and-forget sync to user's Supabase if connected.
    void syncIndicatorToSupabase(updated)
  } catch {}
}

export function deleteIndicator(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const all = getIndicators().filter((i) => i.id !== id)
    localStorage.setItem(INDICATORS_KEY, JSON.stringify(all))
    void deleteIndicatorFromSupabase(id)
  } catch {}
}

export function createIndicator(data: Partial<Indicator>): Indicator {
  const now = new Date().toISOString()
  return {
    id: `ind-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    programId: data.programId || '',
    title: data.title || 'Untitled indicator',
    level: data.level || 'custom',
    description: data.description || '',
    baseline: data.baseline ?? 0,
    target: data.target ?? 100,
    current: data.current,
    unit: data.unit || '',
    direction: data.direction || 'increase',
    frequency: data.frequency || 'quarterly',
    mov: data.mov || '',
    readings: data.readings || [],
    createdAt: now,
    updatedAt: now,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Readings
// ───────────────────────────────────────────────────────────────────────────

export function addReading(indicatorId: string, reading: Omit<Reading, 'id' | 'createdAt'>): void {
  const indicator = getIndicator(indicatorId)
  if (!indicator) return
  const newReading: Reading = {
    ...reading,
    id: `read-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  }
  indicator.readings.push(newReading)
  // Sort readings by date ascending so the latest is at the end.
  indicator.readings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  saveIndicator(indicator)
}

export function deleteReading(indicatorId: string, readingId: string): void {
  const indicator = getIndicator(indicatorId)
  if (!indicator) return
  indicator.readings = indicator.readings.filter((r) => r.id !== readingId)
  saveIndicator(indicator)
}

// ───────────────────────────────────────────────────────────────────────────
// RAG status + progress computation
// ───────────────────────────────────────────────────────────────────────────

export function computeProgress(indicator: Indicator): number {
  const baseline = indicator.baseline ?? 0
  const target = indicator.target ?? 0
  const current = indicator.current
  if (current == null) return 0
  if (target === baseline) return current >= target ? 100 : 0
  const progress = ((current - baseline) / (target - baseline)) * 100
  return Math.max(0, Math.min(100, Math.round(progress)))
}

export function computeRAG(indicator: Indicator): RAGStatus {
  if (indicator.readings.length === 0) return 'gray'
  const progress = computeProgress(indicator)
  if (progress >= 80) return 'green'
  if (progress >= 50) return 'amber'
  return 'red'
}

export function computeNextDue(indicator: Indicator): string | undefined {
  if (indicator.readings.length === 0) return undefined
  const last = indicator.readings[indicator.readings.length - 1]
  const lastDate = new Date(last.date)
  let next = new Date(lastDate)
  switch (indicator.frequency) {
    case 'monthly': next.setMonth(next.getMonth() + 1); break
    case 'quarterly': next.setMonth(next.getMonth() + 3); break
    case 'annually': next.setFullYear(next.getFullYear() + 1); break
    case 'one-time': return undefined
  }
  return next.toISOString().slice(0, 10)
}

export function getIndicatorsWithStatus(programId: string): IndicatorWithStatus[] {
  return getIndicators(programId).map((indicator) => ({
    ...indicator,
    status: computeRAG(indicator),
    progressPercent: computeProgress(indicator),
    lastReadingDate: indicator.readings.length > 0
      ? indicator.readings[indicator.readings.length - 1].date
      : undefined,
    nextDueDate: computeNextDue(indicator),
  }))
}

// ───────────────────────────────────────────────────────────────────────────
// Auto-derive indicators from a logframe
// ───────────────────────────────────────────────────────────────────────────

export function deriveFromLogframe(programId: string, logframe: any): Indicator[] {
  if (!logframe) return []
  const created: Indicator[] = []
  const rows: { row: any; level: Indicator['level'] }[] = []
  if (logframe.goal) rows.push({ row: logframe.goal, level: 'goal' })
  if (logframe.purpose) rows.push({ row: logframe.purpose, level: 'purpose' })
  if (Array.isArray(logframe.outputs)) {
    logframe.outputs.forEach((o: any) => rows.push({ row: o, level: 'output' }))
  }
  for (const { row, level } of rows) {
    if (!row?.ovi || row.ovi.trim() === '') continue
    // Skip if an indicator with the same title already exists for this program.
    const existing = getIndicators(programId).find((i) => i.title === row.ovi)
    if (existing) continue
    const indicator = createIndicator({
      programId,
      title: row.ovi,
      level,
      description: row.description || '',
      mov: row.mov || '',
      baseline: 0,
      target: 100,
      unit: '',
      direction: 'increase',
      frequency: 'quarterly',
    })
    saveIndicator(indicator)
    created.push(indicator)
  }
  return created
}

// ───────────────────────────────────────────────────────────────────────────
// Summary (for program dashboard / donor reports)
// ───────────────────────────────────────────────────────────────────────────

export interface MonitoringSummary {
  total: number
  green: number
  amber: number
  red: number
  gray: number
  avgProgress: number
  readingsThisQuarter: number
  nextActionsDue: number  // indicators with a nextDueDate in the past or soon
}

export function getMonitoringSummary(programId: string): MonitoringSummary {
  const indicators = getIndicatorsWithStatus(programId)
  const now = new Date()
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  let readingsThisQuarter = 0
  let nextActionsDue = 0
  for (const ind of indicators) {
    readingsThisQuarter += ind.readings.filter((r) => new Date(r.date) >= quarterStart).length
    if (ind.nextDueDate && new Date(ind.nextDueDate) <= new Date(now.getTime() + 7 * 86400000)) {
      nextActionsDue++
    }
  }
  const avgProgress = indicators.length > 0
    ? Math.round(indicators.reduce((s, i) => s + i.progressPercent, 0) / indicators.length)
    : 0
  return {
    total: indicators.length,
    green: indicators.filter((i) => i.status === 'green').length,
    amber: indicators.filter((i) => i.status === 'amber').length,
    red: indicators.filter((i) => i.status === 'red').length,
    gray: indicators.filter((i) => i.status === 'gray').length,
    avgProgress,
    readingsThisQuarter,
    nextActionsDue,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Supabase sync (browser → user's own DB, fire-and-forget)
// ───────────────────────────────────────────────────────────────────────────

async function syncIndicatorToSupabase(indicator: Indicator): Promise<void> {
  try {
    const { syncIndicatorToSupabase: sync } = await import('./monitoring-sync')
    await sync(indicator)
  } catch {}
}

async function deleteIndicatorFromSupabase(indicatorId: string): Promise<void> {
  try {
    const { deleteIndicatorFromSupabase: del } = await import('./monitoring-sync')
    await del(indicatorId)
  } catch {}
}
