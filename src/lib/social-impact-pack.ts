// Frontend-facing Social Impact Pack metadata.
// Mirrors the mini-service's knowledge.ts for display purposes.

export interface PackMeta {
  id: string
  name: string
  domain: string
  version: string
  description: string
  supports: string[]
  layers: {
    frameworks: number
    decisionRules: number
    evidence: number
    historicalMemory: number
    reasoningPatterns: number
    improvementHeuristics: number
  }
  frameworkNames: string[]
  ruleNames: string[]
  evaluationCriteria: { criterion: string; weight: number; description: string }[]
}

export const socialImpactPackMeta: PackMeta = {
  id: 'social-impact',
  name: 'Social Impact Pack',
  domain: 'Social Impact',
  version: '0.1.0',
  description:
    'Domain intelligence for program design, monitoring, evaluation, research design, learning systems, and institutional memory in social-impact organizations.',
  supports: [
    'Program design',
    'Monitoring systems',
    'Evaluation frameworks',
    'Research design',
    'Learning systems',
    'Institutional memory',
  ],
  layers: {
    frameworks: 6,
    decisionRules: 5,
    evidence: 5,
    historicalMemory: 3,
    reasoningPatterns: 6,
    improvementHeuristics: 6,
  },
  frameworkNames: [
    'Theory of Change',
    'Logical Framework Analysis (Logframe)',
    'Outcome Mapping',
    'Most Significant Change (MSC)',
    'Impact Evaluation Methods',
    'Survey Design',
  ],
  ruleNames: [
    'SMART Goal Validation',
    'Stakeholder Coverage',
    'Assumption Explicitness',
    'Evidence Citation',
    'Risk Identification',
  ],
  evaluationCriteria: [
    { criterion: 'Evidence Base', weight: 0.2, description: 'Claims supported by cited evidence and prior cases.' },
    { criterion: 'Measurability (SMART)', weight: 0.2, description: 'Targets are Specific, Measurable, Achievable, Relevant, Time-bound.' },
    { criterion: 'Feasibility', weight: 0.2, description: 'Strategy is implementable with realistic resources, capacity, and timeline.' },
    { criterion: 'Stakeholder Coverage', weight: 0.15, description: 'Primary beneficiaries, implementers, and influencers are addressed.' },
    { criterion: 'Causal Logic (Theory of Change)', weight: 0.15, description: 'Inputs → activities → outputs → outcomes → impact chain is explicit and testable.' },
    { criterion: 'Risk & Assumption Awareness', weight: 0.1, description: 'Material risks and key assumptions are identified with mitigations.' },
  ],
}

// Canonical example from the HubForge OS source documents.
export const CANONICAL_EXAMPLE =
  'Design a climate adaptation strategy for smallholder farmers facing increasing drought frequency in sub-Saharan Africa.'

export const EXAMPLE_PROBLEMS: { label: string; problem: string }[] = [
  {
    label: 'Climate adaptation (canonical)',
    problem: CANONICAL_EXAMPLE,
  },
  {
    label: 'Girls’ education program',
    problem:
      'Design a 3-year program to raise secondary-school completion rates among girls in rural South Asia, where early marriage and safety concerns are primary barriers.',
  },
  {
    label: 'Rural healthcare access',
    problem:
      'Design a healthcare access program for a rural population of 250,000 with no clinic within 4 hours’ travel, high maternal mortality, and low trust in government services.',
  },
  {
    label: 'Youth employment evaluation',
    problem:
      'Design an impact evaluation for a youth-employment program serving 5,000 participants across 12 cities, with a budget of $400K and a 2-year window.',
  },
]
