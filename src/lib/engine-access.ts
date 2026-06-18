// Shared engine access for API routes.
// Imports the engines from src/lib/ — works in both local dev and Vercel serverless.

import {
  supervisorEngine, retrievalEngine, ruleEngine, reasoningEngine,
  critiqueEngine, improvementEngine, evaluationEngine, structureEngine,
  feedbackEngine, describeProvider, normalizeConfig,
  type ProviderConfig, type OutputType,
} from './engines'
import { socialImpactPack } from './knowledge'

export {
  supervisorEngine, retrievalEngine, ruleEngine, reasoningEngine,
  critiqueEngine, improvementEngine, evaluationEngine, structureEngine,
  feedbackEngine, describeProvider, normalizeConfig,
  socialImpactPack,
}
export type { ProviderConfig, OutputType }
