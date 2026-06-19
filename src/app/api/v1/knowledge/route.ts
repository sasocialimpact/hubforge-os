// GET /api/v1/knowledge - List the knowledge graph layers (frameworks, rules, evidence).
// This is the open data layer: third parties can query what HubForge knows.
import { NextResponse } from 'next/server'
import { socialImpactPack } from '@/lib/engine-access'

export const maxDuration = 10

export async function GET() {
  return NextResponse.json({
    pack: socialImpactPack.name,
    version: socialImpactPack.version || '1.0.0',
    layers: {
      frameworks: socialImpactPack.frameworks.map((f: any) => ({
        name: f.name,
        description: f.description,
        whenToUse: f.whenToUse,
        keyElements: f.keyElements,
      })),
      decisionRules: socialImpactPack.decisionRules.map((r: any) => ({
        name: r.name,
        check: r.check,
        passCondition: r.passCondition,
        failAction: r.failAction,
      })),
      evidence: socialImpactPack.evidence.map((e: any) => ({
        title: e.title,
        type: e.type,
        summary: e.summary,
      })),
      historicalMemory: socialImpactPack.historicalMemory || [],
      reasoningPatterns: (socialImpactPack.reasoningPatterns || []).map((p: any) => ({
        name: p.name,
        description: p.description,
      })),
      improvementHeuristics: (socialImpactPack.improvementHeuristics || []).map((h: any) => ({
        name: h.name,
        description: h.description,
      })),
    },
  })
}
