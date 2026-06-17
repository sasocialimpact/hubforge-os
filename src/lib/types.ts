// Shared types used by the frontend to render the reasoning loop.
// Mirrors the mini-service event protocol.

import type { ProviderConfig } from './providers'

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
  clarifyingQuestions?: ClarifyingQuestion[]
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
  answers?: Record<string, string>
  outputTypes?: OutputType[]
  provider?: string
  structuredOutputs?: StructuredOutputs
}

// ---- Output types & structured deliverables ----
export type OutputType = 'strategy' | 'toc' | 'logframe' | 'evaluation-plan'

export const OUTPUT_OPTIONS: { id: OutputType; label: string; description: string; icon: string }[] = [
  { id: 'strategy', label: 'Strategy document', description: 'A written strategy with objectives, activities, risks, and targets.', icon: 'FileText' },
  { id: 'toc', label: 'Theory of Change diagram', description: 'A visual flowchart: Inputs → Activities → Outputs → Outcomes → Impact.', icon: 'Workflow' },
  { id: 'logframe', label: 'Logframe table', description: 'A 4×4 logical framework with indicators and means of verification.', icon: 'Table2' },
  { id: 'evaluation-plan', label: 'Evaluation plan', description: 'Evaluation questions, design, indicators, data collection, and timeline.', icon: 'ClipboardCheck' },
]

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
