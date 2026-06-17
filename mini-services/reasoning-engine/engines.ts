// HubForge OS — Core Intelligence Engine
// The 8 sub-engines that form the recursive reasoning loop.
// Each engine is a thin wrapper around an LLM call (or a deterministic check).

import ZAI from 'z-ai-web-dev-sdk'
import type { DomainPack } from './knowledge.ts'

let zaiInstance: any = null
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create()
  return zaiInstance
}

async function llm(systemPrompt: string, userPrompt: string): Promise<string> {
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

// Try to extract a JSON object from an LLM response.
// Handles ```json fenced blocks, leading/trailing prose, and partial JSON.
export function extractJSON<T = any>(text: string): T | null {
  if (!text) return null
  // Strip code fences
  let t = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  // Find the first { ... } or [ ... ] block
  const objStart = t.indexOf('{')
  const arrStart = t.indexOf('[')
  let start = -1
  let openChar = ''
  let closeChar = ''
  if (objStart === -1 && arrStart === -1) return null
  if (objStart === -1) {
    start = arrStart
    openChar = '['
    closeChar = ']'
  } else if (arrStart === -1) {
    start = objStart
    openChar = '{'
    closeChar = '}'
  } else {
    start = Math.min(objStart, arrStart)
    openChar = start === objStart ? '{' : '['
    closeChar = start === objStart ? '}' : ']'
  }
  // Find matching close by scanning with depth tracking
  let depth = 0
  let inStr = false
  let escape = false
  for (let i = start; i < t.length; i++) {
    const c = t[i]
    if (escape) {
      escape = false
      continue
    }
    if (c === '\\' && inStr) {
      escape = true
      continue
    }
    if (c === '"') {
      inStr = !inStr
      continue
    }
    if (inStr) continue
    if (c === openChar) depth++
    else if (c === closeChar) {
      depth--
      if (depth === 0) {
        const slice = t.slice(start, i + 1)
        try {
          return JSON.parse(slice) as T
        } catch {
          return null
        }
      }
    }
  }
  return null
}

// ============================================================
// Engine 1 — Supervisor Engine
// Decomposes the problem into objectives, scope, stakeholders,
// and key considerations.
// ============================================================
export interface Decomposition {
  problemStatement: string
  objectives: string[]
  scope: string
  stakeholders: { role: string; description: string }[]
  keyConsiderations: string[]
  suggestedFrameworks: string[]
}

export async function supervisorEngine(problem: string, pack: DomainPack): Promise<Decomposition> {
  const frameworkList = pack.frameworks.map((f) => `- ${f.name}: ${f.description}`).join('\n')
  const system = `You are the SUPERVISOR ENGINE of HubForge OS, a recursive reasoning operating system.
Your job is to decompose a user's problem into a structured brief that downstream engines can act on.
You are operating with the ${pack.name}. Use its frameworks as the available toolkit.

Respond with VALID JSON ONLY. No prose, no markdown fences. The JSON must have exactly this shape:
{
  "problemStatement": "a concise restatement of the problem",
  "objectives": ["objective 1", "objective 2", ...],
  "scope": "what is in and out of scope",
  "stakeholders": [{"role": "...", "description": "..."}],
  "keyConsiderations": ["consideration 1", ...],
  "suggestedFrameworks": ["Framework Name 1", "Framework Name 2", ...]
}

Available frameworks in the ${pack.name}:
${frameworkList}`

  const user = `Decompose this problem for the ${pack.domain} domain:

${problem}`

  const raw = await llm(system, user)
  const parsed = extractJSON<Decomposition>(raw)
  if (parsed) return parsed
  // Fallback: minimal decomposition
  return {
    problemStatement: problem,
    objectives: ['Produce an expert-grade response to the stated problem.'],
    scope: 'As stated by the user.',
    stakeholders: [],
    keyConsiderations: [],
    suggestedFrameworks: pack.frameworks.slice(0, 2).map((f) => f.name),
  }
}

// ============================================================
// Engine 2 — Retrieval Engine
// Pulls relevant frameworks, rules, evidence, and historical
// memory from the Pack's knowledge graph. NO LLM — pure retrieval.
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
  const suggested = new Set(
    (decomposition.suggestedFrameworks || []).map((n) => n.toLowerCase())
  )
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
// Applies the pack's decision rules as pre-generation gates.
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
        note = passed
          ? 'Problem references a measurable target or time horizon.'
          : 'No explicit measurable target detected — Reasoning Engine must add SMART targets.'
        break
      case 'Stakeholder Coverage':
        passed = /\b(farmer|beneficiary|communit|patient|student|women|youth|household|government|partner)/i.test(p)
        note = passed
          ? 'At least one stakeholder group named.'
          : 'No stakeholder group explicitly named — Reasoning Engine must enumerate.'
        break
      case 'Assumption Explicitness':
        passed = /\b(assum|given that|provided that|if .+ holds)/i.test(p)
        note = passed
          ? 'Problem hints at assumptions.'
          : 'No assumptions stated — Critique Engine will demand explicit assumptions.'
        break
      case 'Evidence Citation':
        passed = false // user problems rarely cite evidence
        note = 'User problem cites no evidence — Reasoning Engine must ground claims in the Evidence Library.'
        break
      case 'Risk Identification':
        passed = /\b(risk|threat|shock|uncertain|hazard)/i.test(p)
        note = passed
          ? 'Problem mentions risk explicitly.'
          : 'No risk language detected — Critique Engine will require risk analysis.'
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
// Generates a draft response using retrieved knowledge and any
// prior critique (for iterations > 1).
// ============================================================
export async function reasoningEngine(
  problem: string,
  decomposition: Decomposition,
  retrieval: RetrievalResult,
  priorCritique: string | null,
  priorDraft: string | null,
  pack: DomainPack,
  iteration: number
): Promise<string> {
  const frameworksText = retrieval.frameworks
    .map(
      (f) =>
        `### ${f.name}\n${f.description}\nWhen to use: ${f.whenToUse}\nKey elements: ${f.keyElements.join(', ')}${f.template ? `\nTemplate: ${f.template}` : ''}`
    )
    .join('\n\n')

  const rulesText = retrieval.decisionRules
    .map((r) => `- ${r.name}: ${r.check} (pass: ${r.passCondition}; fail: ${r.failAction})`)
    .join('\n')

  const evidenceText = retrieval.evidence
    .map((e) => `- ${e.title} (${e.type}): ${e.summary}`)
    .join('\n')

  const memoryText = retrieval.historicalMemory
    .map((m) => `- Problem: ${m.problem}\n  Context: ${m.context}\n  Outcome: ${m.outcome}\n  Lesson: ${m.lesson}`)
    .join('\n')

  const patternsText = retrieval.reasoningPatterns.map((p) => `- ${p.name}: ${p.description}`).join('\n')

  const system = `You are the REASONING ENGINE of HubForge OS, operating with the ${pack.name}.
Your task is to produce an expert-grade draft response to the user's problem using the retrieved knowledge.

Iteration: ${iteration} of ${process.env.MAX_ITERATIONS || 2}.

REQUIREMENTS:
1. Ground every empirical claim in the Evidence Library or Historical Memory. Cite sources inline like [Source: <title>].
2. Apply the retrieved Frameworks explicitly. Name them as you use them.
3. Satisfy every Decision Rule. If a rule's pass condition requires a measurable target, state one.
4. Use the Reasoning Patterns to structure your analysis (root cause, counterfactual, tradeoff, risk, contribution).
5. Be specific. Replace vague outputs ("improve livelihoods") with measurable targets ("raise median annual income by 25% by year 3").
6. Output in well-structured Markdown with clear sections.`

  const user = `# PROBLEM
${problem}

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
${
  priorDraft && priorCritique
    ? `

# PRIOR ITERATION (iteration ${iteration - 1})
You produced a draft that was critiqued. You MUST address every critique point.

## Prior Draft
${priorDraft}

## Critique to Address
${priorCritique}
`
    : ''
}

# TASK
Produce the best expert-grade draft response you can. Be specific, evidence-grounded, and structured.`

  return await llm(system, user)
}

// ============================================================
// Engine 5 — Critique Engine
// Inspects a draft against the Improvement Heuristics.
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

export async function critiqueEngine(
  draft: string,
  pack: DomainPack
): Promise<CritiqueResult> {
  const heuristicsText = pack.improvementHeuristics
    .map((h) => `- ${h.name}: ${h.description}`)
    .join('\n')

  const system = `You are the CRITIQUE ENGINE of HubForge OS, operating with the ${pack.name}.
Your job is to find weaknesses in the draft using the Improvement Heuristics below. Be rigorous and specific. Quote the offending text where possible.

Respond with VALID JSON ONLY. No prose, no markdown fences. Shape:
{
  "issues": [
    {"severity": "high|medium|low", "heuristic": "<heuristic name>", "description": "<what is wrong and where>"}
  ],
  "summary": "<one or two sentence summary of the draft's overall quality>"
}

Improvement Heuristics:
${heuristicsText}`

  const user = `Critique this draft:

${draft}`

  const raw = await llm(system, user)
  const parsed = extractJSON<CritiqueResult>(raw)
  if (parsed && Array.isArray(parsed.issues)) return parsed
  return {
    issues: [
      {
        severity: 'medium',
        heuristic: 'General',
        description: 'Critique engine could not produce a structured critique; manual review required.',
      },
    ],
    summary: 'Critique parsing failed.',
  }
}

// ============================================================
// Engine 6 — Improvement Engine
// Rewrites the draft to address the critique.
// (Implemented as a specialisation of the Reasoning Engine.)
// ============================================================
export async function improvementEngine(
  draft: string,
  critique: CritiqueResult,
  pack: DomainPack
): Promise<string> {
  const issuesText = critique.issues
    .map((i) => `- [${i.severity.toUpperCase()}] (${i.heuristic}) ${i.description}`)
    .join('\n')

  const system = `You are the IMPROVEMENT ENGINE of HubForge OS, operating with the ${pack.name}.
You receive a draft and a critique. You must produce an IMPROVED draft that fixes every critique issue while preserving the draft's strengths.

RULES:
1. Address EVERY critique issue. Do not skip any.
2. Do not introduce new unsupported claims.
3. Keep the structure clean and the markdown well-formed.
4. Output the full improved draft in Markdown (not a diff).`

  const user = `# DRAFT TO IMPROVE
${draft}

# CRITIQUE TO ADDRESS (fix every issue)
${issuesText}

Summary: ${critique.summary}

# TASK
Produce the improved draft.`

  return await llm(system, user)
}

// ============================================================
// Engine 7 — Evaluation Engine
// Scores the improved draft on the pack's rubric.
// ============================================================
export interface EvaluationResult {
  scores: { criterion: string; score: number; weight: number; rationale: string }[]
  overall: number
  thresholdMet: boolean
  notes: string
}

export async function evaluationEngine(
  draft: string,
  pack: DomainPack,
  threshold: number
): Promise<EvaluationResult> {
  const rubricText = pack.evaluationCriteria
    .map(
      (c) =>
        `- ${c.criterion} (weight ${c.weight}): ${c.description}\n  Scoring: ${c.scoringGuide}`
    )
    .join('\n')

  const system = `You are the EVALUATION ENGINE of HubForge OS, operating with the ${pack.name}.
Score the draft against the rubric. Each criterion is scored 0-100. The weighted average is the overall score.

Respond with VALID JSON ONLY. No prose, no markdown fences. Shape:
{
  "scores": [
    {"criterion": "<exact name>", "score": <0-100>, "weight": <weight>, "rationale": "<1 sentence>"}
  ],
  "overall": <weighted average 0-100>,
  "notes": "<1-2 sentence overall note>"
}

Rubric:
${rubricText}

Threshold for delivery: ${threshold}.`

  const user = `Score this draft:

${draft}`

  const raw = await llm(system, user)
  const parsed = extractJSON<{ scores: any[]; overall: number; notes: string }>(raw)
  if (parsed && Array.isArray(parsed.scores) && parsed.scores.length > 0) {
    // Re-attach weights from the rubric in case the LLM got them wrong
    const weightByName = new Map(pack.evaluationCriteria.map((c) => [c.criterion.toLowerCase(), c.weight]))
    const scores = parsed.scores.map((s) => {
      const w = weightByName.get(String(s.criterion).toLowerCase()) ?? s.weight ?? 0
      return { criterion: s.criterion, score: Number(s.score) || 0, weight: w, rationale: String(s.rationale ?? '') }
    })
    // Recompute overall as weighted average
    const totalW = scores.reduce((a, s) => a + s.weight, 0) || 1
    const overall = Math.round(scores.reduce((a, s) => a + s.score * s.weight, 0) / totalW)
    return {
      scores,
      overall,
      thresholdMet: overall >= threshold,
      notes: parsed.notes ?? '',
    }
  }
  // Fallback: neutral 60
  return {
    scores: pack.evaluationCriteria.map((c) => ({
      criterion: c.criterion,
      score: 60,
      weight: c.weight,
      rationale: 'Evaluation parse failed; neutral score assigned.',
    })),
    overall: 60,
    thresholdMet: 60 >= threshold,
    notes: 'Evaluation parsing failed; manual review required.',
  }
}

// ============================================================
// Engine 8 — Memory Engine
// Persists the reasoning trace. (In-memory store; persisted to disk.)
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
  trace: {
    iteration: number
    ruleChecks?: RuleCheckResult[]
    draft?: string
    critique?: CritiqueResult
    improved?: string
    evaluation?: EvaluationResult
  }[]
  finalDraft: string
}

const memoryStore: MemoryRecord[] = []

export function memoryEngine(record: MemoryRecord): void {
  memoryStore.push(record)
  // Keep last 50 in memory
  if (memoryStore.length > 50) memoryStore.shift()
}

export function getMemory(): MemoryRecord[] {
  return [...memoryStore].reverse()
}

export function clearMemory(): void {
  memoryStore.length = 0
}
