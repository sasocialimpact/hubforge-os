// GET /api/v1/knowledge - List the knowledge graph layers (frameworks, rules, evidence).
// This is the open data layer: third parties can query what HubForge knows.
// Returns the merged pack: built-in Social Impact Pack items + admin-defined
// overrides (custom evidence / cases / frameworks / heuristics).
import { NextResponse } from 'next/server'
import { getMergedPack } from '@/lib/knowledge-overrides'

export const maxDuration = 10

export async function GET() {
  const pack = await getMergedPack()
  return NextResponse.json({
    pack: pack.name,
    version: pack.version || '1.0.0',
    layers: {
      frameworks: pack.frameworks.map((f: any) => ({
        name: f.name,
        description: f.description,
        whenToUse: f.whenToUse,
        keyElements: f.keyElements,
      })),
      decisionRules: pack.decisionRules.map((r: any) => ({
        name: r.name,
        check: r.check,
        passCondition: r.passCondition,
        failAction: r.failAction,
      })),
      evidence: pack.evidence.map((e: any) => ({
        title: e.title,
        type: e.type,
        summary: e.summary,
        sourceUrl: e.sourceUrl,
      })),
      historicalMemory: pack.historicalMemory || [],
      reasoningPatterns: (pack.reasoningPatterns || []).map((p: any) => ({
        name: p.name,
        description: p.description,
      })),
      improvementHeuristics: (pack.improvementHeuristics || []).map((h: any) => ({
        name: h.name,
        description: h.description,
      })),
    },
  })
}
