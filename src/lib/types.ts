// Shared types used by the frontend to render the reasoning loop.
// Mirrors the mini-service event protocol.

export type EngineId =
  | 'supervisor'
  | 'retrieval'
  | 'rule'
  | 'reasoning'
  | 'critique'
  | 'improvement'
  | 'evaluation'
  | 'memory'

export interface EngineMeta {
  id: EngineId
  name: string
  short: string
  description: string
  layer: string
  cost: 'deterministic' | 'cheap' | 'expensive'
  usesLLM: boolean
  icon: string // lucide icon name
}

export const ENGINE_DEFS: EngineMeta[] = [
  {
    id: 'supervisor',
    name: 'Supervisor Engine',
    short: 'Supervisor',
    description: 'Decomposes the problem into objectives, scope, stakeholders, and considerations.',
    layer: 'Core · Orchestration',
    cost: 'expensive',
    usesLLM: true,
    icon: 'Workflow',
  },
  {
    id: 'retrieval',
    name: 'Retrieval Engine',
    short: 'Retrieval',
    description: 'Pulls relevant frameworks, rules, evidence, and historical memory from the Knowledge Graph.',
    layer: 'Core · Knowledge',
    cost: 'cheap',
    usesLLM: false,
    icon: 'Database',
  },
  {
    id: 'rule',
    name: 'Rule Engine',
    short: 'Rule',
    description: 'Deterministic gates. No AI. Cheapest layer of the cost hierarchy.',
    layer: 'Core · Deterministic',
    cost: 'deterministic',
    usesLLM: false,
    icon: 'ShieldCheck',
  },
  {
    id: 'reasoning',
    name: 'Reasoning Engine',
    short: 'Reasoning',
    description: 'Generates an expert-grade draft using retrieved knowledge and prior critique.',
    layer: 'Core · Generation',
    cost: 'expensive',
    usesLLM: true,
    icon: 'BrainCircuit',
  },
  {
    id: 'critique',
    name: 'Critique Engine',
    short: 'Critique',
    description: 'Inspects the draft against Improvement Heuristics for weak assumptions and missing evidence.',
    layer: 'Core · Self-Reflection',
    cost: 'expensive',
    usesLLM: true,
    icon: 'ScanSearch',
  },
  {
    id: 'improvement',
    name: 'Improvement Engine',
    short: 'Improvement',
    description: 'Rewrites the draft to fix every critique issue while preserving strengths.',
    layer: 'Core · Refinement',
    cost: 'expensive',
    usesLLM: true,
    icon: 'Wand2',
  },
  {
    id: 'evaluation',
    name: 'Evaluation Engine',
    short: 'Evaluation',
    description: 'Scores the improved draft on the pack rubric. Produces the quality score that gates the loop.',
    layer: 'Core · Scoring',
    cost: 'expensive',
    usesLLM: true,
    icon: 'Gauge',
  },
  {
    id: 'memory',
    name: 'Memory Engine',
    short: 'Memory',
    description: 'Persists the reasoning trace so future runs can learn from it.',
    layer: 'Core · Institutional',
    cost: 'deterministic',
    usesLLM: false,
    icon: 'Library',
  },
]

// ---- Event payloads ----
export interface LoopStartPayload {
  sessionId: string
  problem: string
  pack: {
    id: string
    name: string
    domain: string
    version: string
    description: string
    supports: string[]
  }
  maxIterations: number
  threshold: number
}

export interface EngineStartPayload {
  sessionId: string
  engine: EngineId
  iteration?: number
}

export interface EngineDonePayload {
  sessionId: string
  engine: EngineId
  iteration?: number
  output: any
}

export interface EngineErrorPayload {
  sessionId: string
  engine: EngineId
  iteration?: number
  error: string
}

export interface IterationDonePayload {
  sessionId: string
  iteration: number
  qualityScore: number
  thresholdMet: boolean
}

export interface LoopCompletePayload {
  sessionId: string
  record: MemoryRecord
}

export interface LoopErrorPayload {
  sessionId: string
  error: string
}

// ---- Domain types (mirrors engines.ts) ----
export interface Decomposition {
  problemStatement: string
  objectives: string[]
  scope: string
  stakeholders: { role: string; description: string }[]
  keyConsiderations: string[]
  suggestedFrameworks: string[]
}

export interface RuleCheckResult {
  rule: string
  passed: boolean
  note: string
}

export interface CritiqueIssue {
  severity: 'high' | 'medium' | 'low'
  heuristic: string
  description: string
}

export interface CritiqueResult {
  issues: CritiqueIssue[]
  summary: string
}

export interface EvaluationResult {
  scores: { criterion: string; score: number; weight: number; rationale: string }[]
  overall: number
  thresholdMet: boolean
  notes: string
}

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

// ---- A single timeline event the UI renders ----
export interface TimelineEvent {
  id: string
  ts: number
  type: 'engine:start' | 'engine:done' | 'engine:error' | 'iteration:done' | 'loop:complete' | 'loop:error'
  engine?: EngineId
  iteration?: number
  title: string
  payload?: any
}
