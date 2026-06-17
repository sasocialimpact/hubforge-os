// HubForge OS — Core Intelligence Engine
// The 8 sub-engines + provider router + interview + structured output + feedback.
// Each engine is a thin wrapper around a routed LLM call (or a deterministic check).

import ZAI from 'z-ai-web-dev-sdk'
import type { DomainPack } from './knowledge.ts'

// ============================================================
// Provider Router
// Supports: Z.ai (default, no key) | OpenAI | Anthropic (Claude via OpenAI-compat) |
//           Google Gemini | Groq | Local (Ollama / LM Studio / any OpenAI-compat server)
// ============================================================

export type ProviderId = 'zai' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'local'

export interface ProviderConfig {
  provider: ProviderId
  apiKey?: string
  baseUrl?: string
  model?: string
}

const DEFAULT_BASE_URLS: Record<Exclude<ProviderId, 'zai'>, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  groq: 'https://api.groq.com/openai/v1',
  local: 'http://localhost:11434/v1',
}

const DEFAULT_MODELS: Record<Exclude<ProviderId, 'zai'>, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
  gemini: 'gemini-1.5-flash',
  groq: 'llama-3.3-70b-versatile',
  local: 'gemma2:9b',
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  zai: 'Z.ai (built-in)',
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
  gemini: 'Google Gemini',
  groq: 'Groq',
  local: 'Local model (Ollama / LM Studio)',
}

export function providerLabel(p: ProviderId): string {
  return PROVIDER_LABELS[p] ?? p
}

export function normalizeConfig(config?: ProviderConfig): ProviderConfig {
  const provider = config?.provider ?? 'zai'
  if (provider === 'zai') return { provider }
  const baseUrl = (config?.baseUrl?.trim() || DEFAULT_BASE_URLS[provider])
  const model = (config?.model?.trim() || DEFAULT_MODELS[provider])
  const apiKey = config?.apiKey?.trim() || ''
  return { provider, baseUrl, model, apiKey }
}

export function describeProvider(config?: ProviderConfig): string {
  const c = normalizeConfig(config)
  if (c.provider === 'zai') return 'Z.ai built-in'
  return `${PROVIDER_LABELS[c.provider]} · ${c.model} @ ${c.baseUrl}`
}

let zaiInstance: any = null
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create()
  return zaiInstance
}

// The single LLM entry point. Routes to Z.ai SDK or an OpenAI-compatible fetch.
export async function llm(config: ProviderConfig, systemPrompt: string, userPrompt: string): Promise<string> {
  const c = normalizeConfig(config)
  if (c.provider === 'zai') {
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })
    return completion.choices[0]?.message?.content ?? ''
  }
  // OpenAI-compatible endpoint
  const url = `${c.baseUrl}/chat/completions`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (c.apiKey) headers['Authorization'] = `Bearer ${c.apiKey}`
  const body = {
    model: c.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Provider ${c.provider} returned ${res.status}: ${txt.slice(0, 300)}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

// Try to extract a JSON object from an LLM response.
export function extractJSON<T = any>(text: string): T | null {
  if (!text) return null
  let t = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const objStart = t.indexOf('{')
  const arrStart = t.indexOf('[')
  let start = -1
  let openChar = ''
  let closeChar = ''
  if (objStart === -1 && arrStart === -1) return null
  if (objStart === -1) { start = arrStart; openChar = '['; closeChar = ']' }
  else if (arrStart === -1) { start = objStart; openChar = '{'; closeChar = '}' }
  else {
    start = Math.min(objStart, arrStart)
    openChar = start === objStart ? '{' : '['
    closeChar = start === objStart ? '}' : ']'
  }
  let depth = 0
  let inStr = false
  let escape = false
  for (let i = start; i < t.length; i++) {
    const ch = t[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inStr) { escape = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === openChar) depth++
    else if (ch === closeChar) {
      depth--
      if (depth === 0) {
        const slice = t.slice(start, i + 1)
        try { return JSON.parse(slice) as T } catch { return null }
      }
    }
  }
  return null
}

// ============================================================
// Output type definitions (for structured deliverables)
// ============================================================

export type OutputType = 'strategy' | 'toc' | 'logframe' | 'evaluation-plan'

export const OUTPUT_LABELS: Record<OutputType, { label: string; description: string }> = {
  strategy: { label: 'Strategy document', description: 'A written strategy with objectives, activities, risks, and targets.' },
  toc: { label: 'Theory of Change diagram', description: 'A visual flowchart: Inputs → Activities → Outputs → Outcomes → Impact, with assumptions.' },
  logframe: { label: 'Logframe table', description: 'A 4×4 logical framework: Goal, Purpose, Outputs, Activities with indicators and verification.' },
  'evaluation-plan': { label: 'Evaluation plan', description: 'Evaluation questions, design, indicators, data collection, and timeline.' },
}

// ============================================================
// Engine 1 — Supervisor Engine
// Decomposes the problem AND identifies what's missing (clarifying questions).
// ============================================================
export interface ClarifyingQuestion {
  id: string
  question: string
  why: string
  defaultAssumption: string
}

export interface Decomposition {
  problemStatement: string
  objectives: string[]
  scope: string
  stakeholders: { role: string; description: string }[]
  keyConsiderations: string[]
  suggestedFrameworks: string[]
  clarifyingQuestions: ClarifyingQuestion[]
}

export async function supervisorEngine(
  config: ProviderConfig,
  problem: string,
  pack: DomainPack,
  answers?: Record<string, string>
): Promise<Decomposition> {
  const frameworkList = pack.frameworks.map((f) => `- ${f.name}: ${f.description}`).join('\n')
  const answersBlock = answers && Object.keys(answers).length > 0
    ? `\n\nThe user previously answered these clarifying questions — incorporate their answers:\n${Object.entries(answers).map(([id, a]) => `- ${id}: ${a}`).join('\n')}`
    : ''

  const system = `You are the SUPERVISOR ENGINE of HubForge OS, a recursive reasoning operating system for the ${pack.name}.
Your job: (1) decompose the user's problem into a structured brief, and (2) identify what critical information is MISSING by asking clarifying questions.

Asking good questions is essential. A program officer may not be an M&E expert. Ask only what truly changes the output — 2 to 4 questions. For each, provide a sensible default assumption the system can use if the user skips it.

Respond with VALID JSON ONLY. No prose, no markdown fences. Shape:
{
  "problemStatement": "concise restatement",
  "objectives": ["..."],
  "scope": "what is in/out of scope",
  "stakeholders": [{"role": "...", "description": "..."}],
  "keyConsiderations": ["..."],
  "suggestedFrameworks": ["Framework Name 1", ...],
  "clarifyingQuestions": [
    {"id": "q1", "question": "What is...", "why": "We need this because...", "defaultAssumption": "If skipped, we will assume..."}
  ]
}

Available frameworks in the ${pack.name}:
${frameworkList}`

  const user = `Decompose this problem for the ${pack.domain} domain:${answersBlock}

${problem}`

  const raw = await llm(config, system, user)
  const parsed = extractJSON<Decomposition>(raw)
  if (parsed) {
    if (!parsed.clarifyingQuestions) parsed.clarifyingQuestions = []
    return parsed
  }
  return {
    problemStatement: problem,
    objectives: ['Produce an expert-grade response to the stated problem.'],
    scope: 'As stated by the user.',
    stakeholders: [],
    keyConsiderations: [],
    suggestedFrameworks: pack.frameworks.slice(0, 2).map((f) => f.name),
    clarifyingQuestions: [],
  }
}

// ============================================================
// Engine 2 — Retrieval Engine (deterministic, no LLM)
// ============================================================
export interface RetrievalResult {
  frameworks: DomainPack['frameworks']
  decisionRules: DomainPack['decisionRules']
  evidence: DomainPack['evidence']
  historicalMemory: DomainPack['historicalMemory']
  reasoningPatterns: DomainPack['reasoningPatterns']
  improvementHeuristics: DomainPack['improvementHeuristics']
  procedures: DomainPack['procedures']
}

export function retrievalEngine(
  _problem: string,
  decomposition: Decomposition,
  pack: DomainPack
): RetrievalResult {
  const suggested = new Set((decomposition.suggestedFrameworks || []).map((n) => n.toLowerCase()))
  const frameworks = pack.frameworks.filter((f) => suggested.has(f.name.toLowerCase()))
  const finalFrameworks = frameworks.length > 0 ? frameworks : pack.frameworks.slice(0, 3)
  return {
    frameworks: finalFrameworks,
    decisionRules: pack.decisionRules,
    evidence: pack.evidence,
    historicalMemory: pack.historicalMemory,
    reasoningPatterns: pack.reasoningPatterns,
    improvementHeuristics: pack.improvementHeuristics,
    procedures: pack.procedures,
  }
}

// ============================================================
// Engine 3 — Rule Engine (deterministic, no LLM)
// ============================================================
export interface RuleCheckResult {
  rule: string
  passed: boolean
  note: string
}

export function ruleEngine(problem: string, pack: DomainPack): RuleCheckResult[] {
  const p = problem.toLowerCase()
  const results: RuleCheckResult[] = []
  for (const rule of pack.decisionRules) {
    let passed = false
    let note = ''
    switch (rule.name) {
      case 'SMART Goal Validation':
        passed = /\b(by|within|target|increase|reduce|%\d|%\s)/i.test(problem)
        note = passed ? 'Problem references a measurable target or time horizon.' : 'No explicit measurable target detected — Reasoning Engine must add SMART targets.'
        break
      case 'Stakeholder Coverage':
        passed = /\b(farmer|beneficiar|communit|patient|student|women|youth|household|government|partner)/i.test(p)
        note = passed ? 'At least one stakeholder group named.' : 'No stakeholder group explicitly named — Reasoning Engine must enumerate.'
        break
      case 'Assumption Explicitness':
        passed = /\b(assum|given that|provided that|if .+ holds)/i.test(p)
        note = passed ? 'Problem hints at assumptions.' : 'No assumptions stated — Critique Engine will demand explicit assumptions.'
        break
      case 'Evidence Citation':
        passed = false
        note = 'User problem cites no evidence — Reasoning Engine must ground claims in the Evidence Library.'
        break
      case 'Risk Identification':
        passed = /\b(risk|threat|shock|uncertain|hazard)/i.test(p)
        note = passed ? 'Problem mentions risk explicitly.' : 'No risk language detected — Critique Engine will require risk analysis.'
        break
      default:
        passed = true
        note = 'Rule checked.'
    }
    results.push({ rule: rule.name, passed, note })
  }
  return results
}

// ============================================================
// Engine 4 — Reasoning Engine
// ============================================================
export async function reasoningEngine(
  config: ProviderConfig,
  problem: string,
  decomposition: Decomposition,
  retrieval: RetrievalResult,
  priorCritique: string | null,
  priorDraft: string | null,
  pack: DomainPack,
  iteration: number,
  maxIterations: number,
  outputTypes: OutputType[],
  answers?: Record<string, string>
): Promise<string> {
  const frameworksText = retrieval.frameworks
    .map((f) => `### ${f.name}\n${f.description}\nWhen to use: ${f.whenToUse}\nKey elements: ${f.keyElements.join(', ')}${f.template ? `\nTemplate: ${f.template}` : ''}`)
    .join('\n\n')
  const rulesText = retrieval.decisionRules.map((r) => `- ${r.name}: ${r.check} (pass: ${r.passCondition}; fail: ${r.failAction})`).join('\n')
  const evidenceText = retrieval.evidence.map((e) => `- ${e.title} (${e.type}): ${e.summary}`).join('\n')
  const memoryText = retrieval.historicalMemory.map((m) => `- Problem: ${m.problem}\n  Context: ${m.context}\n  Outcome: ${m.outcome}\n  Lesson: ${m.lesson}`).join('\n')
  const patternsText = retrieval.reasoningPatterns.map((p) => `- ${p.name}: ${p.description}`).join('\n')
  const answersBlock = answers && Object.keys(answers).length > 0
    ? `\n## User's answers to clarifying questions (treat as authoritative input)\n${Object.entries(answers).map(([id, a]) => `- ${id}: ${a}`).join('\n')}`
    : ''
  const outputGuidance = outputTypes.length > 0
    ? `\n## Requested deliverables\nThe user wants: ${outputTypes.map((o) => OUTPUT_LABELS[o].label).join(', ')}. Produce a single unified Markdown strategy document that serves as the source for all requested deliverables. Use clear sections (##) for each logical part. If a Theory of Change is requested, include a section titled "## Theory of Change" with bullet lists for Inputs, Activities, Outputs, Outcomes, Impact, Assumptions, and External Factors. If a Logframe is requested, include a section "## Logframe" with a Markdown table.`
    : ''

  const system = `You are the REASONING ENGINE of HubForge OS, operating with the ${pack.name}.
Your task is to produce an expert-grade draft response to the user's problem using the retrieved knowledge.

Iteration: ${iteration} of ${maxIterations}.

REQUIREMENTS:
1. Ground every empirical claim in the Evidence Library or Historical Memory. Cite sources inline like [Source: <title>].
2. Apply the retrieved Frameworks explicitly. Name them as you use them.
3. Satisfy every Decision Rule. If a rule's pass condition requires a measurable target, state one.
4. Use the Reasoning Patterns to structure your analysis.
5. Be specific. Replace vague outputs with measurable targets.
6. Output in well-structured Markdown with clear ## sections.`

  const user = `# PROBLEM
${problem}${answersBlock}
${outputGuidance}

# DECOMPOSITION (from Supervisor Engine)
- Problem statement: ${decomposition.problemStatement}
- Objectives: ${decomposition.objectives.join('; ')}
- Scope: ${decomposition.scope}
- Stakeholders: ${decomposition.stakeholders.map((s) => `${s.role} (${s.description})`).join('; ')}
- Key considerations: ${decomposition.keyConsiderations.join('; ')}

# RETRIEVED KNOWLEDGE

## Frameworks
${frameworksText}

## Decision Rules (must satisfy)
${rulesText}

## Evidence Library
${evidenceText}

## Historical Memory (prior cases)
${memoryText}

## Reasoning Patterns
${patternsText}
${priorDraft && priorCritique ? `

# PRIOR ITERATION (iteration ${iteration - 1})
You produced a draft that was critiqued. You MUST address every critique point.

## Prior Draft
${priorDraft}

## Critique to Address
${priorCritique}
` : ''}

# TASK
Produce the best expert-grade draft response you can. Be specific, evidence-grounded, and structured.`

  return await llm(config, system, user)
}

// ============================================================
// Engine 5 — Critique Engine
// ============================================================
export interface CritiqueIssue {
  severity: 'high' | 'medium' | 'low'
  heuristic: string
  description: string
}

export interface CritiqueResult {
  issues: CritiqueIssue[]
  summary: string
}

export async function critiqueEngine(config: ProviderConfig, draft: string, pack: DomainPack): Promise<CritiqueResult> {
  const heuristicsText = pack.improvementHeuristics.map((h) => `- ${h.name}: ${h.description}`).join('\n')
  const system = `You are the CRITIQUE ENGINE of HubForge OS, operating with the ${pack.name}.
Find weaknesses in the draft using the Improvement Heuristics. Be rigorous and specific. Quote the offending text where possible.

Respond with VALID JSON ONLY. Shape:
{
  "issues": [{"severity": "high|medium|low", "heuristic": "<name>", "description": "<what is wrong and where>"}],
  "summary": "<one or two sentence summary>"
}

Improvement Heuristics:
${heuristicsText}`
  const user = `Critique this draft:\n\n${draft}`
  const raw = await llm(config, system, user)
  const parsed = extractJSON<CritiqueResult>(raw)
  if (parsed && Array.isArray(parsed.issues)) return parsed
  return { issues: [{ severity: 'medium', heuristic: 'General', description: 'Critique engine could not produce a structured critique; manual review required.' }], summary: 'Critique parsing failed.' }
}

// ============================================================
// Engine 6 — Improvement Engine
// ============================================================
export async function improvementEngine(config: ProviderConfig, draft: string, critique: CritiqueResult, pack: DomainPack): Promise<string> {
  const issuesText = critique.issues.map((i) => `- [${i.severity.toUpperCase()}] (${i.heuristic}) ${i.description}`).join('\n')
  const system = `You are the IMPROVEMENT ENGINE of HubForge OS, operating with the ${pack.name}.
You receive a draft and a critique. Produce an IMPROVED draft that fixes every critique issue while preserving strengths. Keep structure clean. Output full improved draft in Markdown.`
  const user = `# DRAFT TO IMPROVE\n${draft}\n\n# CRITIQUE TO ADDRESS (fix every issue)\n${issuesText}\n\nSummary: ${critique.summary}\n\n# TASK\nProduce the improved draft.`
  return await llm(config, system, user)
}

// ============================================================
// Engine 7 — Evaluation Engine
// ============================================================
export interface EvaluationResult {
  scores: { criterion: string; score: number; weight: number; rationale: string }[]
  overall: number
  thresholdMet: boolean
  notes: string
}

export async function evaluationEngine(config: ProviderConfig, draft: string, pack: DomainPack, threshold: number): Promise<EvaluationResult> {
  const rubricText = pack.evaluationCriteria.map((c) => `- ${c.criterion} (weight ${c.weight}): ${c.description}\n  Scoring: ${c.scoringGuide}`).join('\n')
  const system = `You are the EVALUATION ENGINE of HubForge OS, operating with the ${pack.name}.
Score the draft against the rubric. Each criterion 0-100. Respond with VALID JSON ONLY. Shape:
{"scores": [{"criterion": "<exact name>", "score": <0-100>, "weight": <weight>, "rationale": "<1 sentence>"}], "overall": <weighted avg>, "notes": "<1-2 sentences>"}

Rubric:
${rubricText}

Threshold for delivery: ${threshold}.`
  const user = `Score this draft:\n\n${draft}`
  const raw = await llm(config, system, user)
  const parsed = extractJSON<{ scores: any[]; overall: number; notes: string }>(raw)
  if (parsed && Array.isArray(parsed.scores) && parsed.scores.length > 0) {
    const weightByName = new Map(pack.evaluationCriteria.map((c) => [c.criterion.toLowerCase(), c.weight]))
    const scores = parsed.scores.map((s) => {
      const w = weightByName.get(String(s.criterion).toLowerCase()) ?? s.weight ?? 0
      return { criterion: s.criterion, score: Number(s.score) || 0, weight: w, rationale: String(s.rationale ?? '') }
    })
    const totalW = scores.reduce((a, s) => a + s.weight, 0) || 1
    const overall = Math.round(scores.reduce((a, s) => a + s.score * s.weight, 0) / totalW)
    return { scores, overall, thresholdMet: overall >= threshold, notes: parsed.notes ?? '' }
  }
  return {
    scores: pack.evaluationCriteria.map((c) => ({ criterion: c.criterion, score: 60, weight: c.weight, rationale: 'Evaluation parse failed; neutral score.' })),
    overall: 60, thresholdMet: 60 >= threshold, notes: 'Evaluation parsing failed.',
  }
}

// ============================================================
// Engine 8 — Memory Engine
// ============================================================
export interface MemoryRecord {
  id: string
  timestamp: string
  problem: string
  iterations: number
  finalScore: number
  thresholdMet: boolean
  decomposition: Decomposition
  retrieval: { frameworks: string[]; rules: string[]; evidence: string[] }
  trace: { iteration: number; ruleChecks?: RuleCheckResult[]; draft?: string; critique?: CritiqueResult; improved?: string; evaluation?: EvaluationResult }[]
  finalDraft: string
  answers?: Record<string, string>
  outputTypes?: OutputType[]
  provider?: string
  structuredOutputs?: StructuredOutputs
}

const memoryStore: MemoryRecord[] = []

export function memoryEngine(record: MemoryRecord): void {
  memoryStore.push(record)
  if (memoryStore.length > 50) memoryStore.shift()
}
export function getMemory(): MemoryRecord[] { return [...memoryStore].reverse() }
export function clearMemory(): void { memoryStore.length = 0 }

// ============================================================
// Structure Engine — converts the final markdown into renderable
// structured data for diagrams (ToC, Logframe).
// ============================================================
export interface ToCData {
  targetPopulation: string
  inputs: string[]
  activities: string[]
  outputs: string[]
  outcomes: string[]
  impact: string
  assumptions: string[]
  externalFactors: string[]
}

export interface LogframeRow {
  level: string
  description: string
  ovi: string
  mov: string
  assumptions: string
}

export interface LogframeData {
  goal: LogframeRow
  purpose: LogframeRow
  outputs: LogframeRow[]
  activities: LogframeRow[]
}

export interface StructuredOutputs {
  toc?: ToCData
  logframe?: LogframeData
}

export async function structureEngine(
  config: ProviderConfig,
  finalDraft: string,
  outputTypes: OutputType[]
): Promise<StructuredOutputs> {
  const result: StructuredOutputs = {}
  const wantToc = outputTypes.includes('toc')
  const wantLogframe = outputTypes.includes('logframe')

  if (wantToc) {
    try {
      const system = `You are the STRUCTURE ENGINE of HubForge OS. Extract a Theory of Change from the strategy document and return VALID JSON ONLY. Shape:
{"targetPopulation": "...", "inputs": ["..."], "activities": ["..."], "outputs": ["..."], "outcomes": ["..."], "impact": "...", "assumptions": ["..."], "externalFactors": ["..."]}
Each list should have 2-6 concise items derived from the document. If a field is not present, infer it from context or use an empty string/array.`
      const user = `Extract the Theory of Change from:\n\n${finalDraft}`
      const raw = await llm(config, system, user)
      const parsed = extractJSON<ToCData>(raw)
      if (parsed) result.toc = {
        targetPopulation: String(parsed.targetPopulation ?? ''),
        inputs: arr(parsed.inputs), activities: arr(parsed.activities), outputs: arr(parsed.outputs),
        outcomes: arr(parsed.outcomes), impact: String(parsed.impact ?? ''),
        assumptions: arr(parsed.assumptions), externalFactors: arr(parsed.externalFactors),
      }
    } catch { /* leave undefined */ }
  }

  if (wantLogframe) {
    try {
      const system = `You are the STRUCTURE ENGINE of HubForge OS. Extract a Logical Framework from the strategy document and return VALID JSON ONLY. Shape:
{"goal": {"level":"Goal","description":"...","ovi":"...","mov":"...","assumptions":"..."}, "purpose": {...}, "outputs": [{...}], "activities": [{...}]}
Goal and Purpose are single rows; outputs and activities are arrays of 2-5 rows each. Infer fields from the document where needed.`
      const user = `Extract the Logframe from:\n\n${finalDraft}`
      const raw = await llm(config, system, user)
      const parsed = extractJSON<any>(raw)
      if (parsed) {
        result.logframe = {
          goal: row(parsed.goal, 'Goal'),
          purpose: row(parsed.purpose, 'Purpose'),
          outputs: (Array.isArray(parsed.outputs) ? parsed.outputs : []).map((r: any) => row(r, 'Output')),
          activities: (Array.isArray(parsed.activities) ? parsed.activities : []).map((r: any) => row(r, 'Activity')),
        }
      }
    } catch { /* leave undefined */ }
  }

  return result
}

function arr(v: any): string[] { return Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [] }
function row(r: any, level: string): LogframeRow {
  return { level, description: String(r?.description ?? ''), ovi: String(r?.ovi ?? ''), mov: String(r?.mov ?? ''), assumptions: String(r?.assumptions ?? '') }
}

// ============================================================
// Feedback Engine — incorporates user feedback into a new draft.
// ============================================================
export async function feedbackEngine(
  config: ProviderConfig,
  currentDraft: string,
  feedback: string,
  pack: DomainPack
): Promise<{ improved: string; feedbackAddressed: string[] }> {
  const system = `You are the FEEDBACK ENGINE of HubForge OS, operating with the ${pack.name}.
The user reviewed the deliverable and gave feedback. Revise the draft to address the feedback. Preserve strengths. Do not introduce unsupported claims. Output the full revised draft in Markdown.

After the draft, on a new line, output a line starting with "ADDRESSED:" followed by a JSON array of strings describing what you changed, e.g.:
ADDRESSED: ["Made assumptions about market access explicit", "Added a risk row on input prices"]`
  const user = `# CURRENT DRAFT\n${currentDraft}\n\n# USER FEEDBACK\n${feedback}\n\n# TASK\nRevise the draft to address the feedback. Then output the ADDRESSED: line.`
  const raw = await llm(config, system, user)
  // Split draft from ADDRESSED marker
  const idx = raw.indexOf('ADDRESSED:')
  let improved = raw
  let addressed: string[] = []
  if (idx >= 0) {
    improved = raw.slice(0, idx).trim()
    const after = raw.slice(idx + 'ADDRESSED:'.length).trim()
    const parsed = extractJSON<string[]>(after)
    if (Array.isArray(parsed)) addressed = parsed
  }
  return { improved, feedbackAddressed: addressed }
}
