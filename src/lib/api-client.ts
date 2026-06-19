// API client - replaces socket.io with sequential fetch calls.
// Every call is tracked for consumption visibility.
// Cacheable calls (interview, retrieval, structure, search) are wrapped with
// smart-cache to cut LLM cost ~30% on repeat/similar queries.
import type { ProviderConfig, OutputType, ClarifyingQuestion, StructuredOutputs, EvaluationResult, Decomposition } from './types'
import { trackUsage } from './usage-tracker'
import { orgSupabaseHeaders } from './org-supabase'
import { cache } from './smart-cache'

async function apiCall(path: string, body: any): Promise<any> {
  const start = Date.now()
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...orgSupabaseHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) { const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })); throw new Error(err.error || `Request failed: ${res.status}`) }
  const json = await res.json()
  // Track usage (client-side, for the user to see their consumption)
  const duration = Date.now() - start
  const inputChars = JSON.stringify(body).length
  const outputChars = JSON.stringify(json).length
  const engine = body.step || path.split('/').pop() || 'unknown'
  const provider = body.providerConfig?.provider || 'zai'
  try { trackUsage({ provider, engine, durationMs: duration, inputChars, outputChars }) } catch {}
  return json
}

export async function callInterview(problem: string, providerConfig: ProviderConfig): Promise<{ decomposition: Decomposition; questions: ClarifyingQuestion[]; provider: string }> {
  // Interview results are cacheable for 24h - the decomposition + questions
  // for the same problem don't change day-to-day.
  return cache.interview(problem, providerConfig.provider, () =>
    apiCall('/api/interview', { problem, providerConfig })
  )
}
export async function callRetrieval(problem: string, decomposition: Decomposition): Promise<any> {
  // Retrieval is deterministic (knowledge graph lookup) - cache 7 days.
  return cache.retrieval(problem, JSON.stringify(decomposition).slice(0, 100), () =>
    apiCall('/api/run-step', { step: 'retrieval', problem, decomposition })
  )
}
export async function callRuleChecks(problem: string): Promise<any> {
  // Rule checks are deterministic - no LLM call, no need to cache.
  return apiCall('/api/run-step', { step: 'rule', problem })
}
export async function callReasoning(params: { problem: string; decomposition: Decomposition; retrieval: any; priorCritique: string | null; priorDraft: string | null; iteration: number; maxIterations: number; outputTypes: OutputType[]; answers: Record<string, string>; providerConfig: ProviderConfig; orgContext?: string; contextBlocks?: string }): Promise<string> {
  // Reasoning is NOT cached - must be fresh each time (iteration-aware).
  const r = await apiCall('/api/run-step', { ...params, step: 'reasoning' }); return r.output
}
export async function callCritique(draft: string, providerConfig: ProviderConfig): Promise<any> {
  // Critique is NOT cached - needs to evaluate the current draft.
  const r = await apiCall('/api/run-step', { step: 'critique', draft, providerConfig }); return r.output
}
export async function callImprovement(draft: string, critique: any, providerConfig: ProviderConfig): Promise<string> {
  // Improvement is NOT cached - needs to act on the current critique.
  const r = await apiCall('/api/run-step', { step: 'improvement', draft, critique, providerConfig }); return r.output
}
export async function callEvaluation(improved: string, providerConfig: ProviderConfig, threshold = 80): Promise<EvaluationResult> {
  // Evaluation is NOT cached - needs to score the current improved draft.
  const r = await apiCall('/api/run-step', { step: 'evaluation', improved, providerConfig, threshold }); return r.output
}
export async function callStructure(finalDraft: string, outputTypes: OutputType[], providerConfig: ProviderConfig): Promise<StructuredOutputs> {
  // Structure extraction is cacheable for 24h - same draft → same ToC/Logframe.
  const draftHash = String(hashCode(finalDraft))
  return cache.structure(draftHash, outputTypes.join(','), () =>
    apiCall('/api/structure', { finalDraft, outputTypes, providerConfig })
  )
}
export async function callFeedback(currentDraft: string, feedback: string, outputTypes: OutputType[], providerConfig: ProviderConfig): Promise<{ improved: string; addressed: string[]; evaluation: EvaluationResult; structured: StructuredOutputs }> {
  // Feedback is NOT cached - user feedback is unique each time.
  return apiCall('/api/feedback', { currentDraft, feedback, outputTypes, providerConfig })
}
export async function callWebSearch(problem: string, decomposition: any, providerConfig: ProviderConfig): Promise<{ demographic: any[]; previousPrograms: any[]; evidence: any[]; summary: string }> {
  // Web search results (demographics, previous programs) change slowly - cache 7 days.
  return cache.webSearch(problem.slice(0, 200), 'all', () =>
    apiCall('/api/search', { problem, decomposition, providerConfig })
  )
}

// Simple string hash (matches smart-cache.ts makeKey logic).
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export async function getMemory(): Promise<any[]> {
  try {
    const res = await fetch('/api/memory', { headers: { ...orgSupabaseHeaders() } })
    const data = await res.json()
    return data.memory ?? []
  } catch { return [] }
}
export async function clearMemory(): Promise<void> {
  try {
    await fetch('/api/memory', { method: 'DELETE', headers: { ...orgSupabaseHeaders() } })
  } catch {}
}
export async function saveMemory(record: any): Promise<void> {
  try { await apiCall('/api/memory', { record }) } catch {}
}
