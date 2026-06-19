// Consumption Tracker - tracks AI usage so users can see and optimize their consumption.
// Stored in localStorage. Shows: API calls, estimated tokens, estimated cost, by provider.

export interface UsageRecord {
  timestamp: string
  provider: string
  engine: string
  durationMs: number
  inputChars: number
  outputChars: number
  estimatedTokens: number
  estimatedCost: number
}

export interface UsageSummary {
  totalCalls: number
  totalTokens: number
  totalCost: number
  byProvider: Record<string, { calls: number; tokens: number; cost: number }>
  byEngine: Record<string, { calls: number; tokens: number; cost: number }>
  last7Days: { date: string; calls: number; tokens: number }[]
}

const USAGE_KEY = 'hubforge.usage'

// Cost per 1K tokens (approximate, as of 2024)
const COST_PER_1K: Record<string, { input: number; output: number }> = {
  'zai': { input: 0, output: 0 },           // Free (shared)
  'zai-key': { input: 0, output: 0 },       // Free tier
  'openai': { input: 0.00015, output: 0.0006 },  // gpt-4o-mini
  'anthropic': { input: 0.003, output: 0.015 },   // claude-3-5-sonnet
  'gemini': { input: 0, output: 0 },              // Free tier
  'groq': { input: 0, output: 0 },                // Free tier
  'local': { input: 0, output: 0 },               // Free (local)
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4)
}

function estimateCost(provider: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_1K[provider] || COST_PER_1K['zai']
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output
}

export function trackUsage(record: Omit<UsageRecord, 'timestamp' | 'estimatedTokens' | 'estimatedCost'>): void {
  if (typeof window === 'undefined') return
  try {
    const tokens = estimateTokens('x'.repeat(record.inputChars) + 'x'.repeat(record.outputChars))
    const cost = estimateCost(record.provider, estimateTokens('x'.repeat(record.inputChars)), estimateTokens('x'.repeat(record.outputChars)))
    const full: UsageRecord = {
      ...record,
      timestamp: new Date().toISOString(),
      estimatedTokens: tokens,
      estimatedCost: cost,
    }
    const records = getUsageRecords()
    records.push(full)
    // Keep last 500 records
    if (records.length > 500) records.shift()
    localStorage.setItem(USAGE_KEY, JSON.stringify(records))
  } catch {}
}

export function getUsageRecords(): UsageRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function getUsageSummary(): UsageSummary {
  const records = getUsageRecords()
  const byProvider: Record<string, { calls: number; tokens: number; cost: number }> = {}
  const byEngine: Record<string, { calls: number; tokens: number; cost: number }> = {}

  for (const r of records) {
    if (!byProvider[r.provider]) byProvider[r.provider] = { calls: 0, tokens: 0, cost: 0 }
    byProvider[r.provider].calls++
    byProvider[r.provider].tokens += r.estimatedTokens
    byProvider[r.provider].cost += r.estimatedCost

    if (!byEngine[r.engine]) byEngine[r.engine] = { calls: 0, tokens: 0, cost: 0 }
    byEngine[r.engine].calls++
    byEngine[r.engine].tokens += r.estimatedTokens
    byEngine[r.engine].cost += r.estimatedCost
  }

  // Last 7 days
  const last7Days: { date: string; calls: number; tokens: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    const dayRecords = records.filter((r) => r.timestamp.slice(0, 10) === day)
    last7Days.push({
      date: day,
      calls: dayRecords.length,
      tokens: dayRecords.reduce((a, r) => a + r.estimatedTokens, 0),
    })
  }

  return {
    totalCalls: records.length,
    totalTokens: records.reduce((a, r) => a + r.estimatedTokens, 0),
    totalCost: records.reduce((a, r) => a + r.estimatedCost, 0),
    byProvider,
    byEngine,
    last7Days,
  }
}

export function clearUsage(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(USAGE_KEY) } catch {}
}

// Optimization tips based on usage
export function getOptimizationTips(summary: UsageSummary): string[] {
  const tips: string[] = []
  const providers = Object.entries(summary.byProvider)

  // If using paid providers, suggest free alternatives
  const paidProviders = providers.filter(([p, _]) => p === 'openai' || p === 'anthropic')
  if (paidProviders.length > 0) {
    const paidCost = paidProviders.reduce((a, [_, v]) => a + v.cost, 0)
    if (paidCost > 0.10) {
      tips.push(`You've spent $${paidCost.toFixed(2)} on ${paidProviders.map(([p]) => p).join('/')}. Switch to Z.ai (free) or Groq (free tier) to save costs.`)
    }
  }

  // If reasoning engine dominates, suggest caching
  const reasoning = summary.byEngine['reasoning']
  if (reasoning && reasoning.calls > 5) {
    tips.push(`Reasoning engine ran ${reasoning.calls} times. Similar problems are cached automatically to reduce calls.`)
  }

  // If high token usage, suggest shorter problems
  if (summary.totalTokens > 50000) {
    tips.push(`You've used ~${(summary.totalTokens / 1000).toFixed(0)}K tokens. Shorter, more specific problem descriptions reduce token usage by up to 50%.`)
  }

  // If no usage yet
  if (summary.totalCalls === 0) {
    tips.push('Start by creating a program. Your AI consumption will be tracked here automatically.')
  }

  return tips
}
