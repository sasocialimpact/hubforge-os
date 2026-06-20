// Shared engine access for API routes.
// Imports the engines from src/lib/ - works in both local dev and Vercel serverless.

import {
  supervisorEngine, retrievalEngine, ruleEngine, reasoningEngine,
  critiqueEngine, improvementEngine, evaluationEngine, structureEngine,
  feedbackEngine, describeProvider, normalizeConfig,
  type ProviderConfig, type OutputType, type ReasoningPromptOverride,
} from './engines'
import { socialImpactPack } from './knowledge'
import { healthcarePack } from './healthcare-pack'
import { educationPack } from './education-pack'
import type { DomainPack } from './knowledge'

const PACKS: Record<string, DomainPack> = {
  'social-impact': socialImpactPack,
  'healthcare': healthcarePack,
  'education': educationPack,
}

export function getPack(id: string): DomainPack {
  return PACKS[id] ?? socialImpactPack
}

export function listPacks() {
  return Object.values(PACKS).map(p => ({
    id: p.id, name: p.name, domain: p.domain, version: p.version, description: p.description,
  }))
}

export {
  supervisorEngine, retrievalEngine, ruleEngine, reasoningEngine,
  critiqueEngine, improvementEngine, evaluationEngine, structureEngine,
  feedbackEngine, describeProvider, normalizeConfig,
  socialImpactPack, healthcarePack, educationPack,
}
export type { ProviderConfig, OutputType, ReasoningPromptOverride }
