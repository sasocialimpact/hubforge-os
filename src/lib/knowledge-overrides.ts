// Knowledge Graph merge layer.
//
// Server-side helper that fetches admin-defined knowledge overrides
// (custom evidence / cases / frameworks / heuristics / rubric weights)
// from the knowledge store and merges them with the built-in Social
// Impact Pack at runtime.
//
// The retrieval engine and evaluation engine call getMergedPack() before
// running, so the admin's edits take effect on the very next reasoning
// run - no code changes, no redeploy.
//
// Falls back to the built-in pack if the store is unreachable.

import { socialImpactPack } from './knowledge'
import type {
  DomainPack,
  EvidenceSource,
  HistoricalCase,
  Framework,
  ImprovementHeuristic,
  EvaluationCriterion,
} from './knowledge'
import { listOverrides } from './server/knowledge-store'

// Normalise an arbitrary override item into a typed shape, dropping
// fields the engines don't expect. We are deliberately permissive on
// input (the admin form may submit partial shapes) and strict on output.
function asEvidence(item: any): EvidenceSource {
  return {
    title: String(item?.title ?? '').trim() || 'Untitled evidence',
    type: String(item?.type ?? 'Custom').trim(),
    summary: String(item?.summary ?? '').trim(),
    ...(item?.sourceUrl ? { sourceUrl: String(item.sourceUrl) } : {}),
  }
}

function asCase(item: any): HistoricalCase {
  return {
    problem: String(item?.problem ?? '').trim() || 'Untitled case',
    context: String(item?.context ?? '').trim(),
    outcome: String(item?.outcome ?? '').trim(),
    lesson: String(item?.lesson ?? '').trim(),
  }
}

function asFramework(item: any): Framework {
  return {
    name: String(item?.name ?? '').trim() || 'Untitled framework',
    layer: 2,
    description: String(item?.description ?? '').trim(),
    whenToUse: String(item?.whenToUse ?? '').trim(),
    keyElements: Array.isArray(item?.keyElements)
      ? item.keyElements.map((s: any) => String(s)).filter(Boolean)
      : [],
    ...(item?.template ? { template: String(item.template) } : {}),
  }
}

function asHeuristic(item: any): ImprovementHeuristic {
  return {
    name: String(item?.name ?? '').trim() || 'Untitled heuristic',
    layer: 8,
    description: String(item?.description ?? '').trim(),
  }
}

function asRubric(item: any): EvaluationCriterion[] | null {
  const criteria = item?.criteria
  if (!Array.isArray(criteria) || criteria.length === 0) return null
  const out: EvaluationCriterion[] = []
  for (const c of criteria) {
    if (!c || typeof c !== 'object') continue
    const criterion = String(c.criterion ?? '').trim()
    if (!criterion) continue
    const weight = Number.isFinite(c.weight) ? Math.max(0, Math.min(1, Number(c.weight))) : 0
    out.push({
      criterion,
      weight,
      description: String(c.description ?? '').trim(),
      scoringGuide: String(c.scoringGuide ?? '').trim(),
    })
  }
  return out.length > 0 ? out : null
}

// Returns the merged DomainPack: built-in items + admin-defined overrides.
// On any error, returns the built-in pack unchanged so the engines never
// block on a knowledge-store outage.
export async function getMergedPack(): Promise<DomainPack> {
  try {
    const overrides = await listOverrides()
    const customEvidence = overrides
      .filter((o) => o.type === 'evidence')
      .map((o) => asEvidence(o.item))
    const customCases = overrides
      .filter((o) => o.type === 'cases')
      .map((o) => asCase(o.item))
    const customFrameworks = overrides
      .filter((o) => o.type === 'frameworks')
      .map((o) => asFramework(o.item))
    const customHeuristics = overrides
      .filter((o) => o.type === 'heuristics')
      .map((o) => asHeuristic(o.item))

    const rubricOverride = overrides.find((o) => o.type === 'rubric')
    const customRubric = rubricOverride ? asRubric(rubricOverride.item) : null

    return {
      ...socialImpactPack,
      evidence: [...socialImpactPack.evidence, ...customEvidence],
      historicalMemory: [...socialImpactPack.historicalMemory, ...customCases],
      frameworks: [...socialImpactPack.frameworks, ...customFrameworks],
      improvementHeuristics: [
        ...socialImpactPack.improvementHeuristics,
        ...customHeuristics,
      ],
      evaluationCriteria:
        customRubric && customRubric.length > 0
          ? customRubric
          : socialImpactPack.evaluationCriteria,
    }
  } catch (e) {
    console.error('[knowledge-overrides] getMergedPack failed, using built-in:', e)
    return socialImpactPack
  }
}

// Returns just the merged rubric (used by the admin UI to show the
// effective rubric and by the evaluation engine).
export async function getMergedRubric(): Promise<EvaluationCriterion[]> {
  const pack = await getMergedPack()
  return pack.evaluationCriteria
}

// Lightweight check: is a rubric override currently active?
export async function hasRubricOverride(): Promise<boolean> {
  try {
    const overrides = await listOverrides('rubric')
    return overrides.length > 0
  } catch {
    return false
  }
}
