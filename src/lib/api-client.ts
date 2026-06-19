// API client - replaces socket.io with sequential fetch calls.
// Every call is tracked for consumption visibility.
import type { ProviderConfig, OutputType, ClarifyingQuestion, StructuredOutputs, EvaluationResult, Decomposition } from './types'
import { trackUsage } from './usage-tracker'

async function apiCall(path: string, body: any): Promise<any> {
  const start = Date.now()
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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
  return apiCall('/api/interview', { problem, providerConfig })
}
export async function callRetrieval(problem: string, decomposition: Decomposition): Promise<any> {
  return apiCall('/api/run-step', { step: 'retrieval', problem, decomposition })
}
export async function callRuleChecks(problem: string): Promise<any> {
  return apiCall('/api/run-step', { step: 'rule', problem })
}
export async function callReasoning(params: { problem: string; decomposition: Decomposition; retrieval: any; priorCritique: string | null; priorDraft: string | null; iteration: number; maxIterations: number; outputTypes: OutputType[]; answers: Record<string, string>; providerConfig: ProviderConfig; orgContext?: string; contextBlocks?: string }): Promise<string> {
  const r = await apiCall('/api/run-step', { ...params, step: 'reasoning' }); return r.output
}
export async function callCritique(draft: string, providerConfig: ProviderConfig): Promise<any> {
  const r = await apiCall('/api/run-step', { step: 'critique', draft, providerConfig }); return r.output
}
export async function callImprovement(draft: string, critique: any, providerConfig: ProviderConfig): Promise<string> {
  const r = await apiCall('/api/run-step', { step: 'improvement', draft, critique, providerConfig }); return r.output
}
export async function callEvaluation(improved: string, providerConfig: ProviderConfig, threshold = 80): Promise<EvaluationResult> {
  const r = await apiCall('/api/run-step', { step: 'evaluation', improved, providerConfig, threshold }); return r.output
}
export async function callStructure(finalDraft: string, outputTypes: OutputType[], providerConfig: ProviderConfig): Promise<StructuredOutputs> {
  return apiCall('/api/structure', { finalDraft, outputTypes, providerConfig })
}
export async function callFeedback(currentDraft: string, feedback: string, outputTypes: OutputType[], providerConfig: ProviderConfig): Promise<{ improved: string; addressed: string[]; evaluation: EvaluationResult; structured: StructuredOutputs }> {
  return apiCall('/api/feedback', { currentDraft, feedback, outputTypes, providerConfig })
}
export async function callWebSearch(problem: string, decomposition: any, providerConfig: ProviderConfig): Promise<{ demographic: any[]; previousPrograms: any[]; evidence: any[]; summary: string }> {
  return apiCall('/api/search', { problem, decomposition, providerConfig })
}
export async function getMemory(): Promise<any[]> {
  try { const res = await fetch('/api/memory'); const data = await res.json(); return data.memory ?? [] } catch { return [] }
}
export async function clearMemory(): Promise<void> {
  try { await fetch('/api/memory', { method: 'DELETE' }) } catch {}
}
export async function saveMemory(record: any): Promise<void> {
  try { await apiCall('/api/memory', { record }) } catch {}
}
