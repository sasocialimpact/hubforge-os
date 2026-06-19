# HubForge OS — Knowledge Graph Schema Spec

> The open format for domain packs. Anyone can build one.
> Version: 1.0.0 | License: Apache-2.0

## What is a Domain Pack?

A domain pack is a bundle of domain knowledge that grounds HubForge's 9-engine reasoning pipeline. The Social Impact Pack (M&E for NGOs) is the first. Others could include:

- **Health Pack** — clinical guidelines, DHIS2 indicators, WHO frameworks
- **Education Pack** — FLN frameworks, EGRA/EGMA assessments, school quality standards
- **Climate Pack** — adaptation frameworks, IPCC evidence, vulnerability indices
- **Humanitarian Pack** — Sphere standards, HPC frameworks, needs assessment

A pack is a TypeScript/JavaScript module that exports a `DomainPack` object. It plugs directly into the kernel — no code changes needed.

## The `DomainPack` Interface

```typescript
interface DomainPack {
  // ── Identity ──
  id: string                    // e.g. "social-impact"
  name: string                  // e.g. "Social Impact Pack"
  version: string               // semver, e.g. "1.0.0"
  description: string
  license: string               // e.g. "Apache-2.0"

  // ── Layer 1: Frameworks ──
  frameworks: Framework[]

  // ── Layer 2: Decision Rules ──
  decisionRules: DecisionRule[]

  // ── Layer 3: Evidence Sources ──
  evidence: Evidence[]

  // ── Layer 4: Historical Memory ──
  historicalMemory: HistoricalCase[]

  // ── Layer 5: Reasoning Patterns ──
  reasoningPatterns: ReasoningPattern[]

  // ── Layer 6: Improvement Heuristics ──
  improvementHeuristics: ImprovementHeuristic[]

  // ── Layer 7: Evaluation Rubric ──
  evaluationRubric: EvaluationCriterion[]

  // ── Layer 8: Canonical Example ──
  canonicalExample?: { problem: string; expectedOutput: string }
}
```

## Layer Definitions

### Layer 1: Frameworks
```typescript
interface Framework {
  name: string                  // "Theory of Change"
  description: string
  whenToUse: string             // "Program design, strategy development..."
  keyElements: string[]         // ["Inputs", "Activities", "Outputs", "Outcomes", "Impact"]
  template?: string             // Markdown template the reasoning engine fills in
}
```

### Layer 2: Decision Rules
```typescript
interface DecisionRule {
  name: string                  // "SMART criteria check"
  check: string                 // Human-readable description of what's checked
  passCondition: string         // "All objectives are Specific, Measurable..."
  failAction: string            // "Flag objectives that aren't measurable"
}
```

### Layer 3: Evidence
```typescript
interface Evidence {
  title: string                 // "EGRA reading assessment methodology"
  type: 'methodology' | 'data' | 'case-study' | 'meta-analysis' | 'guideline'
  summary: string
  source?: string               // URL or citation
  year?: number
}
```

### Layer 4: Historical Memory
```typescript
interface HistoricalCase {
  title: string                 // "Literacy program in Marsabit, Kenya (2022)"
  context: string               // Background, geography, population
  approach: string              // What was done
  outcomes: string              // What happened (with numbers)
  lessons: string[]             // What worked / what didn't
  tags: string[]                // ["education", "kenya", "literacy"]
}
```

### Layer 5: Reasoning Patterns
```typescript
interface ReasoningPattern {
  name: string                  // "Causal chain reasoning"
  description: string           // "Link inputs → activities → outputs → outcomes"
}
```

### Layer 6: Improvement Heuristics
```typescript
interface ImprovementHeuristic {
  name: string                  // "Replace vague outputs with measurable targets"
  description: string           // "Change 'improve reading' to '75% of children..."
}
```

### Layer 7: Evaluation Rubric
```typescript
interface EvaluationCriterion {
  name: string                  // "Logical coherence"
  weight: number                // 0-1, must sum to 1.0 across all criteria
  description: string           // "Are the causal links plausible?"
  scoringGuide: string          // "0: no causal links ... 100: clear, evidence-based chain"
}
```

### Layer 8: Canonical Example
```typescript
{
  problem: "Design a climate adaptation strategy for smallholder farmers...",
  expectedOutput: "# Climate Adaptation Strategy\n## Executive Summary\n..."
}
```
Used for pack validation, regression testing, and demo data.

## How to Build a Pack

1. **Create the module** — export a `DomainPack` object
2. **Register it** — import in `engine-access.ts`
3. **Test it** — `curl -X POST /api/v1/reason -d '{"problem":"...","pack":"health"}'`
4. **Publish it** — commit to your repo, add to the HubForge Pack Registry (coming soon)

## Pack Discovery

- `GET /api/v1/packs` — lists all installed packs
- `GET /api/v1/knowledge` — returns the full knowledge graph for the default pack
- `GET /api/v1/knowledge?pack=health` — returns the knowledge graph for a specific pack (coming soon)

## Versioning

Packs use semantic versioning: MAJOR (breaking), MINOR (new content, backward compatible), PATCH (fixes).

## The Vision

When there are 50 domain packs — health, education, climate, humanitarian, agriculture, gender, governance, livelihoods, WASH, refugee response — HubForge becomes the connective tissue of the entire social sector. A consultant in Bangladesh builds a Climate Resilience Pack. An NGO in Kenya installs it. Their next climate program starts from the accumulated wisdom of every climate program that came before.

**That's when HubForge is an operating system, not an app.**
