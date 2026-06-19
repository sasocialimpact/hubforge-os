# HubForge OS - Developer Documentation

> Complete guide for developers building on HubForge OS.
> Last updated: June 2026 | Version: 0.3.0 | License: Apache-2.0

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [The 9-Engine Reasoning Pipeline](#3-the-9-engine-reasoning-pipeline)
4. [Knowledge Graph (8 Layers)](#4-knowledge-graph-8-layers)
5. [Domain Packs](#5-domain-packs)
6. [API Routes Reference](#6-api-routes-reference)
7. [Frontend Components](#7-frontend-components)
8. [Libraries Reference](#8-libraries-reference)
9. [AI Provider System](#9-ai-provider-system)
10. [Data Flow: End-to-End](#10-data-flow-end-to-end)
11. [Database Schema (Supabase)](#11-database-schema-supabase)
12. [PWA Configuration](#12-pwa-configuration)
13. [Analytics System](#13-analytics-system)
14. [Usage Tracking](#14-usage-tracking)
15. [Export System](#15-export-system)
16. [Security Model](#16-security-model)
17. [Environment Variables](#17-environment-variables)
18. [How to Extend](#18-how-to-extend)
19. [Testing](#19-testing)
20. [Deployment](#20-deployment)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ General Mode │  │  Geek Mode  │  │  Dashboard   │    │
│  │ (for users)  │  │ (for power  │  │ (programs)   │    │
│  │              │  │  users)     │  │              │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                 │             │
│  ┌──────┴──────────────────┴────────────────┴──────┐   │
│  │              API Client (src/lib/api-client.ts)  │   │
│  │  - Sequential HTTP calls (no socket.io)          │   │
│  │  - Usage tracking on every call                  │   │
│  │  - Error handling                                │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                               │
│  localStorage:          │ fetch() with optional           │
│  - providerConfig       │   X-Org-Supabase-Url            │
│  - orgSupabase (URL +   │   X-Org-Supabase-Key headers    │
│    anon key)            │                                 │
│  - orgProfile           │                                 │
│  - programs             │                                 │
│  - contextBlocks        │                                 │
│  - usage data           │                                 │
│  - analytics queue      │                                 │
└─────────────────────────┼───────────────────────────────┘
                          │
                ┌─────────┴──────────┐
                │ programs/blocks:   │
                │ browser talks to   │
                │ user's Supabase    │
                │ DIRECTLY (no API   │
                │ roundtrip)         │
                └─────────┬──────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              VERCEL (Serverless Functions)               │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │/api/     │ │/api/     │ │/api/     │ │/api/     │  │
│  │interview │ │run-step  │ │search    │ │structure │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │            │            │            │          │
│  ┌────┴────────────┴────────────┴────────────┴─────┐   │
│  │         Engines (src/lib/engines.ts)            │   │
│  │  Supervisor → Retrieval → Web Search → Rule    │   │
│  │  → Reasoning → Critique → Improvement →        │   │
│  │  Evaluation → Structure                        │   │
│  └────────────────────┬───────────────────────────┘   │
│                       │                                │
│  ┌────────────────────┴───────────────────────────┐   │
│  │         LLM Router (inside engines.ts)          │   │
│  │  Z.ai SDK | OpenAI | Anthropic | Gemini |      │   │
│  │  Groq | Local (Ollama)                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │/api/     │ │/api/     │ │/api/     │ │/api/     │  │
│  │memory    │ │profile   │ │analytics │ │feedback  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘  │
│       │            │            │                       │
│  ┌────┴────────────┴────────────┴───────────────────┐  │
│  │  3-tier persistence fallback (per request):      │  │
│  │                                                  │  │
│  │  1. org-supabase   ← X-Org-Supabase-* headers    │  │
│  │     (user's OWN Supabase — proxy to their DB)    │  │
│  │  2. platform-supabase ← SUPABASE_URL env vars    │  │
│  │     (shared fallback when user hasn't connected) │  │
│  │  3. in-memory store (per-instance, lost on cold  │  │
│  │     start)                                       │  │
│  │                                                  │  │
│  │  Each response includes a `source` field so the  │  │
│  │  caller can verify which path was taken.         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key design decisions

1. **No socket.io** - The frontend orchestrates the reasoning loop via sequential HTTP API calls. This works on Vercel's serverless platform (no persistent connections needed).

2. **API keys in browser** - User API keys (OpenAI, Groq, etc.) are stored in localStorage and sent directly to the provider. They never touch HubForge servers.

3. **localStorage-first** - All user data (programs, org profile, context blocks, usage) is stored in localStorage. Supabase (user-owned or platform-shared) is used for persistence across devices.

4. **User-owned data (3-tier fallback)** - Users can connect their OWN Supabase instance via the Data Storage dialog. When connected, their data (programs, reasoning sessions, context blocks, user profile, analytics events, lessons) lives in THEIR database. The three persistence API routes (`/api/memory`, `/api/profile`, `/api/analytics`) follow a strict priority chain: org-supabase (from request headers) → platform-supabase (env vars) → in-memory. Programs and context blocks bypass HubForge entirely — the browser talks directly to the user's Supabase using the public anon key (RLS protects the data).

5. **Serverless-friendly** - Each API route is a standalone function with `maxDuration` set. No state between requests.

---

## 2. Project Structure

```
hubforge-os/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # Main page (dashboard + General/Geek mode)
│   │   ├── layout.tsx                # Root layout (PWA meta, fonts, service worker)
│   │   ├── organization/page.tsx     # Org setup wizard (3 steps)
│   │   ├── admin/page.tsx            # Admin dashboard (analytics + users)
│   │   ├── help/page.tsx             # Help & documentation
│   │   ├── privacy/page.tsx          # Privacy policy
│   │   ├── terms/page.tsx            # Terms of service
│   │   ├── offline/page.tsx          # PWA offline fallback
│   │   ├── globals.css               # Tailwind + theme variables
│   │   └── api/                      # API routes (serverless functions)
│   │       ├── interview/route.ts    #   POST: Supervisor Engine
│   │       ├── run-step/route.ts     #   POST: 6 engines (retrieval/rule/reasoning/critique/improvement/evaluation)
│   │       ├── search/route.ts       #   POST: Web Search Engine
│   │       ├── structure/route.ts    #   POST: ToC + Logframe extraction
│   │       ├── feedback/route.ts     #   POST: Feedback incorporation
│   │       ├── memory/route.ts       #   GET/POST/DELETE: Session persistence
│   │       ├── profile/route.ts      #   GET/POST: User profiles
│   │       └── analytics/route.ts    #   GET/POST: Event tracking
│   │
│   ├── components/                   # React components
│   │   ├── general-mode.tsx          # Main user flow (input → interview → building → deliverable)
│   │   ├── geek-mode.tsx            # Builder's lab (6 tabs: Pipeline, Config, Compare, Prompts, Knowledge, Data)
│   │   ├── program-dashboard.tsx     # Program cards grid + templates
│   │   ├── settings-dialog.tsx       # AI provider settings
│   │   ├── onboarding.tsx            # First-run welcome (1 screen)
│   │   ├── command-palette.tsx       # Cmd+K palette
│   │   ├── install-prompt.tsx        # PWA install banner
│   │   ├── usage-panel.tsx           # AI consumption dashboard
│   │   ├── editable-deliverables.tsx # Editable ToC + Logframe
│   │   ├── deliverables.tsx          # Static ToC + Logframe (view mode)
│   │   ├── engine-pipeline.tsx       # 8-engine pipeline cards (Geek mode)
│   │   ├── timeline.tsx              # Reasoning trace timeline (Geek mode)
│   │   ├── voice-input.tsx           # Voice dictation (Web Speech API)
│   │   └── ui/                       # shadcn/ui components (60+ files)
│   │
│   ├── lib/                          # Core libraries
│   │   ├── engines.ts                # 8 Core Engines + LLM router + timeout/retry
│   │   ├── knowledge.ts              # Social Impact Pack knowledge graph (8 layers)
│   │   ├── engine-access.ts          # Bridge: API routes → engines
│   │   ├── api-client.ts             # Frontend API client (fetch wrappers + usage tracking)
│   │   ├── providers.ts              # 7 AI provider definitions + localStorage
│   │   ├── organization.ts           # Org profile type + context block formatter
│   │   ├── programs.ts               # Program CRUD + status management
│   │   ├── context-blocks.ts         # Reusable knowledge blocks
│   │   ├── web-search-engine.ts      # Web Search Engine (demographics, evidence)
│   │   ├── export-utils.ts           # Word/PDF/Excel export
│   │   ├── analytics.ts              # Event tracking client (non-blocking)
│   │   ├── usage-tracker.ts          # AI consumption tracking
│   │   ├── user-profile.ts           # User profile + localStorage
│   │   ├── program-templates.ts      # 5 pre-built program templates
│   │   ├── smart-cache.ts            # LLM response caching (built, not wired)
│   │   ├── social-impact-pack.ts     # Frontend pack metadata
│   │   ├── types.ts                  # Shared TypeScript types
│   │   ├── db.ts                     # Prisma client (unused, for future)
│   │   └── utils.ts                  # cn() helper (clsx + tailwind-merge)
│   │
│   ├── hooks/                        # React hooks
│   │   ├── use-mobile.ts             # Mobile detection
│   │   └── use-toast.ts              # Toast notifications
│   │
│   └── lib/__tests__/                # Unit tests
│       ├── engines.test.ts           # 50 tests: engines, retrieval, rules, JSON, knowledge
│       ├── frontend.test.ts          # 25 tests: providers, profiles, analytics, types
│       └── web-search.test.ts        # 10 tests: location/domain extraction
│
├── public/                           # Static assets
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker (offline caching)
│   ├── icon-192.png                  # App icon 192px
│   ├── icon-512.png                  # App icon 512px
│   ├── icon-1024.png                 # App icon 1024px (source)
│   ├── apple-touch-icon.png          # iOS icon 180px
│   ├── favicon-32.png                # Browser tab icon
│   └── logo.svg                      # Logo
│
├── prisma/
│   └── schema.prisma                 # Prisma schema (unused, for future DB)
│
├── mini-services/
│   └── reasoning-engine/             # Legacy socket.io service (not needed for deploy)
│       ├── engines.ts                # Copy of engines (same as src/lib/engines.ts)
│       ├── knowledge.ts              # Copy of knowledge (same as src/lib/knowledge.ts)
│       └── index.ts                  # Socket.io server (legacy)
│
├── vercel.json                       # Vercel deployment config (maxDuration per route)
├── .env.example                      # Environment variable template
├── supabase-schema.sql               # SQL to create Supabase tables
├── next.config.ts                    # Next.js config (standalone output, headers for SW)
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependencies and scripts
└── README.md                         # Project README
```

---

## 3. The 9-Engine Reasoning Pipeline

The core of HubForge OS is a recursive reasoning loop with 9 engines. The frontend orchestrates the loop by calling API routes sequentially.

### Pipeline flow

```
User input (problem text)
    │
    ▼
┌──────────────────┐
│ 1. SUPERVISOR    │  POST /api/interview
│ Decomposes       │  → objectives, scope, stakeholders
│ problem          │  → clarifying questions
│ Asks questions   │  LLM call (Z.ai/OpenAI/Groq/etc.)
└────────┬─────────┘
         │ decomposition
         ▼
┌──────────────────┐
│ 2. RETRIEVAL     │  POST /api/run-step { step: 'retrieval' }
│ Pulls from       │  → frameworks, decision rules, evidence
│ Knowledge Graph  │  → historical memory, reasoning patterns
│ (no LLM)         │  Deterministic (no API cost)
└────────┬─────────┘
         │ retrieval result
         ▼
┌──────────────────┐
│ 3. WEB SEARCH    │  POST /api/search
│ Searches live    │  → demographic data
│ web for context  │  → previous programs in area
│ (3 parallel)     │  → evidence/research
│                  │  3 web searches + LLM summary
└────────┬─────────┘
         │ web search results
         ▼
┌──────────────────┐
│ 4. RULE ENGINE   │  POST /api/run-step { step: 'rule' }
│ Deterministic    │  → SMART goal check
│ validation       │  → stakeholder coverage
│ (no LLM)         │  → assumption/risk/evidence checks
└────────┬─────────┘
         │ rule check results
         ▼
    ┌────────────────────────────────────┐
    │        RECURSIVE LOOP              │
    │  (repeats up to MAX_ITERATIONS)    │
    │                                    │
    │  ┌──────────────────┐              │
    │  │ 5. REASONING     │  LLM call    │
    │  │ Drafts strategy  │  (most       │
    │  │ using all context│   expensive) │
    │  └────────┬─────────┘              │
    │           │ draft                  │
    │           ▼                        │
    │  ┌──────────────────┐              │
    │  │ 6. CRITIQUE      │  LLM call    │
    │  │ Finds weaknesses │  Checks      │
    │  │ (7 heuristics)   │  assumptions,│
    │  └────────┬─────────┘  evidence,   │
    │           │ critique   vagueness   │
    │           ▼                        │
    │  ┌──────────────────┐              │
    │  │ 7. IMPROVEMENT   │  LLM call    │
    │  │ Rewrites to fix  │  Fixes every │
    │  │ every issue      │  critique    │
    │  └────────┬─────────┘  issue       │
    │           │ improved draft          │
    │           ▼                        │
    │  ┌──────────────────┐              │
    │  │ 8. EVALUATION    │  LLM call    │
    │  │ Scores 0-100 on  │  6 criteria: │
    │  │ 6-criterion       │  Evidence,   │
    │  │ rubric            │  SMART,      │
    │  └────────┬─────────┘  Feasibility, │
    │           │            Stakeholders,│
    │           │            Causal Logic,│
    │           │            Risks       │
    │           ▼                        │
    │    score >= threshold?             │
    │    YES → exit loop                 │
    │    NO → loop again                 │
    └────────────────────────────────────┘
         │ final draft + score
         ▼
┌──────────────────┐
│ 9. STRUCTURE     │  POST /api/structure
│ Extracts ToC     │  → Theory of Change JSON
│ + Logframe       │  → Logframe JSON
│ from strategy    │  LLM call
└────────┬─────────┘
         │ structured outputs
         ▼
    Deliverable view
    (strategy + ToC + Logframe)
    → Editable
    → Exportable (Word/PDF/Excel)
    → Feedback loop
```

### Engine implementations

All engines are in `src/lib/engines.ts`. Each engine:

1. Takes typed inputs
2. Constructs a system prompt + user prompt
3. Calls the LLM via the `llm()` function (with timeout + retry)
4. Parses the response (JSON extraction for structured outputs)
5. Returns typed outputs

```typescript
// Example: Reasoning Engine signature
export async function reasoningEngine(
  config: ProviderConfig,           // AI provider config
  problem: string,                  // User's problem text
  decomposition: Decomposition,     // From Supervisor
  retrieval: RetrievalResult,       // From Retrieval Engine
  priorCritique: string | null,     // From previous iteration's Critique
  priorDraft: string | null,        // From previous iteration's draft
  pack: DomainPack,                 // Knowledge pack
  iteration: number,                // Current iteration (1-5)
  maxIterations: number,            // Max iterations (configurable)
  outputTypes: OutputType[],        // What outputs to produce
  answers?: Record<string, string>, // User's interview answers
  webSearch?: WebSearchResult,      // Web search results
  orgContext?: string,              // Organization context
  contextBlocks?: string,           // Reusable context blocks
): Promise<string>                  // Returns the draft (Markdown)
```

### LLM Router

The `llm()` function routes to the correct provider:

```typescript
// Z.ai (default, uses SDK)
if (config.provider === 'zai') {
  const zai = await getZAI()
  const completion = await zai.chat.completions.create({ ... })
  return completion.choices[0]?.message?.content
}

// Z.ai with user's own key (OpenAI-compatible endpoint)
if (config.provider === 'zai-key') {
  // Falls through to OpenAI-compatible fetch
}

// All other providers (OpenAI, Anthropic, Gemini, Groq, Local)
const res = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}`, ... },
  body: JSON.stringify({ model, messages, temperature }),
})
```

### Timeout + Retry

Every LLM call has:
- **90-second timeout** (configurable in Geek Mode)
- **2 retries** with exponential backoff (3s, 6s)
- **Empty response check** (throws if LLM returns empty)

```typescript
const LLM_TIMEOUT_MS = 90000
const LLM_MAX_RETRIES = 2

for (let attempt = 1; attempt <= LLM_MAX_RETRIES + 1; attempt++) {
  try {
    // Call LLM with timeout
    const result = await withTimeout(llmCall, LLM_TIMEOUT_MS)
    if (!result.trim()) throw new Error('Empty response')
    return result
  } catch (e) {
    if (attempt <= LLM_MAX_RETRIES) {
      await new Promise(r => setTimeout(r, attempt * 3000))
    }
  }
}
```

---

## 4. Knowledge Graph (8 Layers)

The Social Impact Pack knowledge graph is defined in `src/lib/knowledge.ts`. It has 8 layers that feed different engines:

| Layer | Name | Contents | Used by |
|-------|------|----------|---------|
| 1 | Domain Knowledge | Sectors (Education, Health, WASH, etc.) | Supervisor |
| 2 | Framework Knowledge | 6 frameworks (ToC, Logframe, Outcome Mapping, MSC, Impact Eval, Survey Design) | Retrieval Engine |
| 3 | Procedural Knowledge | Program design process, evaluation process | Supervisor |
| 4 | Decision Rules | 5 deterministic rules (SMART, Stakeholders, Assumptions, Evidence, Risk) | Rule Engine |
| 5 | Evidence Libraries | 5 evidence sources (OECD-DAC, Better Evaluation, Innosight, World Bank, CGAP) | Reasoning Engine |
| 6 | Historical Memory | 3 past cases (farmer livelihoods, girls' education, rural healthcare) | Reasoning Engine |
| 7 | Reasoning Patterns | 6 patterns (Root Cause, Counterfactual, Tradeoff, Risk, Comparative, Contribution) | Reasoning Engine |
| 8 | Improvement Heuristics | 6 heuristics (Weak assumptions, Missing evidence, Vague→measurable, Causal logic, Inconsistency, Reduce uncertainty) | Critique Engine |

### Adding to the knowledge graph

Edit `src/lib/knowledge.ts`:

```typescript
export const socialImpactPack: DomainPack = {
  // ... existing fields ...
  frameworks: [
    // Add a new framework
    {
      name: 'My New Framework',
      layer: 2,
      description: 'What it does',
      whenToUse: 'When to use it',
      keyElements: ['element1', 'element2'],
      template: 'IF... THEN... PROVIDED THAT...',
    },
  ],
  decisionRules: [
    // Add a new rule
    {
      name: 'My Rule',
      layer: 4,
      check: 'What to check',
      passCondition: 'When it passes',
      failAction: 'What to do if it fails',
    },
  ],
  // ... etc for evidence, historicalMemory, reasoningPatterns, improvementHeuristics
}
```

---

## 5. Domain Packs

A Domain Pack is a self-contained knowledge module. The Social Impact Pack is the first. To create a new pack:

1. Create a new file: `src/lib/health-pack.ts`
2. Define the pack with the same `DomainPack` interface
3. Import it in the API routes you want to use it with
4. Add a pack selector in the UI (optional)

```typescript
// src/lib/health-pack.ts
import type { DomainPack } from './knowledge'

export const healthPack: DomainPack = {
  id: 'health',
  name: 'Health Pack',
  domain: 'Health',
  version: '0.1.0',
  description: 'Domain intelligence for health programs',
  supports: ['Clinical reasoning', 'Diagnostic support', ...],
  domainKnowledge: [...],
  frameworks: [...],
  procedures: [...],
  decisionRules: [...],
  evidence: [...],
  historicalMemory: [...],
  reasoningPatterns: [...],
  improvementHeuristics: [...],
  evaluationCriteria: [...],
}
```

---

## 6. API Routes Reference

### POST /api/interview
Runs the Supervisor Engine to decompose the problem and generate clarifying questions.

**Request:**
```json
{
  "problem": "Design a literacy program for 1000 children in Kenya",
  "providerConfig": { "provider": "zai" }
}
```

**Response:**
```json
{
  "decomposition": {
    "problemStatement": "...",
    "objectives": ["..."],
    "scope": "...",
    "stakeholders": [{ "role": "...", "description": "..." }],
    "keyConsiderations": ["..."],
    "suggestedFrameworks": ["Theory of Change"]
  },
  "questions": [
    {
      "id": "q1",
      "question": "What is your target age group?",
      "why": "Age determines the pedagogical approach",
      "defaultAssumption": "If skipped, we assume grades 1-3"
    }
  ],
  "provider": "Z.ai (shared, free)"
}
```

**Validation:** problem required, max 10000 chars
**maxDuration:** 60 seconds

---

### POST /api/run-step
Runs one of 6 engines. The `step` field determines which engine.

**Request (retrieval):**
```json
{
  "step": "retrieval",
  "problem": "Design a literacy program...",
  "decomposition": { "suggestedFrameworks": ["Theory of Change"] }
}
```

**Request (reasoning):**
```json
{
  "step": "reasoning",
  "problem": "Design a literacy program...",
  "decomposition": { ... },
  "retrieval": { "frameworks": [...], "evidence": [...] },
  "priorCritique": null,
  "priorDraft": null,
  "iteration": 1,
  "maxIterations": 2,
  "outputTypes": ["strategy", "toc", "logframe"],
  "answers": { "q1": "Grades 1-3" },
  "providerConfig": { "provider": "zai" },
  "orgContext": "## Organization Context\nName: REAP...",
  "contextBlocks": "## Geography: Marsabit\n...",
  "webSearch": { "demographic": [...], "summary": "..." }
}
```

**Response (reasoning):**
```json
{
  "output": "# Strategy Document\n\n## Executive Summary\n..."
}
```

**Steps:** `retrieval` | `rule` | `reasoning` | `critique` | `improvement` | `evaluation`

**Validation:** Step is required and must be one of the six known steps. Inputs are then validated per-step — the route splits steps into two sets defined in `src/app/api/run-step/route.ts`:

```typescript
const PROBLEM_STEPS = new Set(['retrieval', 'rule', 'reasoning'])
const DRAFT_STEPS  = new Set(['critique', 'improvement', 'evaluation'])
```

| Step | Set | Required input fields | Notes |
|------|-----|-----------------------|-------|
| `retrieval`  | PROBLEM_STEPS | `problem` (max 10000 chars) + `decomposition` | Deterministic, no LLM |
| `rule`       | PROBLEM_STEPS | `problem` (max 10000 chars) | Deterministic, no LLM |
| `reasoning`  | PROBLEM_STEPS | `problem` (max 10000 chars) + `decomposition`, `retrieval`, `iteration`, `maxIterations`, `outputTypes` | LLM call |
| `critique`   | DRAFT_STEPS   | `draft` (string) | Operates on a draft, not the original `problem` |
| `improvement`| DRAFT_STEPS   | `draft` (string) + `critique` | Rewrites the draft given the critique |
| `evaluation` | DRAFT_STEPS   | `improved` (string) | Scores the improved draft on the rubric |

This split fixes a regression where `critique`/`improvement`/`evaluation` were incorrectly rejected with `problem is required` because they don't take `problem` — they operate on the draft/critique/improved text instead.

**maxDuration:** 60 seconds

---

### POST /api/search
Web Search Engine - searches for demographics, previous programs, and evidence.

**Request:**
```json
{
  "problem": "Design a literacy program in Marsabit, Kenya",
  "decomposition": { ... },
  "providerConfig": { "provider": "zai" }
}
```

**Response:**
```json
{
  "demographic": [{ "title": "...", "url": "...", "snippet": "...", "source": "..." }],
  "previousPrograms": [...],
  "evidence": [...],
  "summary": "Marsabit has a literacy rate of..."
}
```

**maxDuration:** 60 seconds

---

### POST /api/structure
Extracts Theory of Change and Logframe from the final strategy document.

**Request:**
```json
{
  "finalDraft": "# Strategy Document\n...",
  "outputTypes": ["toc", "logframe"],
  "providerConfig": { "provider": "zai" }
}
```

**Response:**
```json
{
  "toc": {
    "targetPopulation": "...",
    "inputs": ["..."],
    "activities": ["..."],
    "outputs": ["..."],
    "outcomes": ["..."],
    "impact": "...",
    "assumptions": ["..."],
    "externalFactors": ["..."]
  },
  "logframe": {
    "goal": { "level": "Goal", "description": "...", "ovi": "...", "mov": "...", "assumptions": "..." },
    "purpose": { ... },
    "outputs": [{ ... }],
    "activities": [{ ... }]
  }
}
```

**maxDuration:** 60 seconds

---

### POST /api/feedback
Incorporates user feedback into a revised draft.

**Request:**
```json
{
  "currentDraft": "# Strategy...\n...",
  "feedback": "Make assumptions about market access more explicit",
  "outputTypes": ["strategy", "toc"],
  "providerConfig": { "provider": "zai" }
}
```

**Response:**
```json
{
  "improved": "# Revised Strategy...\n...",
  "addressed": ["Made market access assumptions explicit", "Added risk row on input prices"],
  "evaluation": { "overall": 89, "thresholdMet": true, ... },
  "structured": { "toc": { ... }, "logframe": { ... } }
}
```

**Validation:** currentDraft + feedback required, feedback max 5000 chars
**maxDuration:** 60 seconds

---

### GET/POST/DELETE /api/memory
Session persistence via the **3-tier fallback chain**:

1. **org-supabase** (preferred) — credentials read from `X-Org-Supabase-Url` / `X-Org-Supabase-Key` request headers (see `src/lib/server/org-supabase.ts`). Reads/writes go to the user's OWN Supabase. HubForge platform never persists the data.
2. **platform-supabase** (fallback) — `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` env vars. Used when the user hasn't connected their own DB but the operator has configured platform Supabase.
3. **in-memory store** (last resort) — per-instance array, lost on cold start. App still works with zero Supabase config.

Each response includes a `source` field (`'org-supabase'` | `'platform-supabase'` | `'memory'` | `'error'`) so callers can verify which path was taken.

- **GET** - List all sessions (max 50)
- **POST** - Save a session `{ record: { id, problem, finalDraft, ... } }`
- **DELETE** - Clear all sessions

**Request headers (optional):** `X-Org-Supabase-Url`, `X-Org-Supabase-Key` — sent automatically by `orgSupabaseHeaders()` in `src/lib/org-supabase.ts` whenever the user has connected their own Supabase.
**maxDuration:** 10 seconds

---

### GET/POST /api/profile
User profile management. Same **3-tier fallback chain** as `/api/memory` (org-supabase from headers → platform-supabase from env → in-memory). Responses include a `source` field.

- **POST** - Save/update profile `{ profileId, name, email, organization, country, role }`
- **GET** (with `?admin_key=XXX`) - List all users (admin only). Admin GET always uses **platform-supabase only** — the admin dashboard is platform-level, not per-user.
- **GET** (without admin_key) - Returns user count only

**Request headers (optional):** `X-Org-Supabase-Url`, `X-Org-Supabase-Key` for non-admin requests.
**maxDuration:** 10 seconds

---

### GET/POST /api/analytics
Event tracking. Same **3-tier fallback chain** as `/api/memory`. Responses include a `source` field. Falls through gracefully: if the org-supabase insert errors out (e.g. table missing, network blip), the route logs a warning and continues down the chain to platform-supabase / in-memory rather than returning a 500.

- **POST** - Track an event `{ eventType, eventCategory, eventData, ... }`
- **GET** (with `?admin_key=XXX&days=30`) - Dashboard data (admin only). Admin GET always uses **platform-supabase only**.

**Request headers (optional):** `X-Org-Supabase-Url`, `X-Org-Supabase-Key` — automatically attached by `analytics.ts` on every flush.
**eventType validation:** alphanumeric + underscore only, max 100 chars
**maxDuration:** 10 seconds

---

## 7. Frontend Components

### General Mode (`general-mode.tsx`)
The main user flow. 4 phases:

```
input → interview → building → deliverable
```

**Key state:**
- `phase`: 'input' | 'interview' | 'building' | 'deliverable'
- `problem`: string (user's problem text)
- `outputTypes`: OutputType[] (strategy, toc, logframe, evaluation-plan)
- `questions`: ClarifyingQuestion[] (from Supervisor)
- `answers`: Record<string, string> (user's answers)
- `deliverable`: { draft, evaluation, structured, outputTypes }

**Progress checklist:**
9 steps shown as a visual checklist with checkmarks during the building phase.

**Auto-save:**
- After generation: saves as a Program to localStorage
- Web search results: saved as context blocks
- Session: saved to memory API

---

### Geek Mode (`geek-mode.tsx`)
Builder's lab with 6 tabs:

| Tab | What it does |
|-----|-------------|
| Pipeline | Run the loop, see timeline, click outputs to inspect |
| Config | Sliders for iterations/threshold/temperature/timeout + per-engine provider selection |
| Compare | A/B test same problem on multiple providers |
| Prompts | See actual system + user prompts for each engine |
| Knowledge | View/add/export knowledge pack items |
| Data | Raw JSON inspector for any engine output |

**Per-engine provider selection:**
Each LLM engine can use a different provider. Override stored in `engineProviders` state:
```typescript
const [engineProviders, setEngineProviders] = useState<Record<LLMEngine, ProviderId | null>>(
  () => Object.fromEntries(LLM_ENGINES.map(e => [e, null]))
)
```

---

## 8. Libraries Reference

### engines.ts
The heart of the system. Contains:
- `ProviderId` type: 'zai' | 'zai-key' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'local'
- `ProviderConfig` interface
- `normalizeConfig()`: fills defaults for each provider
- `llm()`: the single LLM entry point with timeout + retry
- `extractJSON()`: robust JSON extraction from LLM responses
- `supervisorEngine()`: decompose problem + ask questions
- `retrievalEngine()`: pull from knowledge graph (deterministic, no LLM)
- `ruleEngine()`: validate against decision rules (deterministic, no LLM)
- `reasoningEngine()`: generate draft strategy (LLM)
- `critiqueEngine()`: find weaknesses (LLM)
- `improvementEngine()`: fix weaknesses (LLM)
- `evaluationEngine()`: score on rubric (LLM)
- `structureEngine()`: extract ToC + Logframe (LLM)
- `feedbackEngine()`: incorporate user feedback (LLM)

### providers.ts
7 AI provider definitions:
- Z.ai (shared, free) - QUICK START badge
- Z.ai (own key) - RECOMMENDED badge
- Groq (free tier) - FREE TIER badge
- OpenAI - pay per use
- Anthropic (Claude) - pay per use
- Google Gemini - free tier
- Local (Ollama) - FREE FOREVER badge

Each provider has: `id`, `label`, `description`, `needsKey`, `defaultModel`, `defaultBaseUrl`, `docsUrl`, `badge`, `badgeColor`.

### organization.ts
- `OrganizationProfile` interface (15 fields)
- `getOrgProfile()`: read from localStorage
- `storeOrgProfile()`: write to localStorage
- `getOrgContextBlock()`: format org profile as LLM context string

### programs.ts
- `Program` interface (id, title, status, problem, draft, evaluation, structured, etc.)
- CRUD: `getPrograms()`, `getProgram()`, `saveProgram()`, `deleteProgram()`
- `createProgram()`: factory function
- `duplicateProgram()`: copy as starting point
- `PROGRAM_STATUSES`: 6 statuses (draft, in_review, submitted, funded, active, closed)
- `saveAllPrograms(programs)`: overwrite all local programs (used after a Supabase pull+merge)
- `syncProgramsFromSupabase()`: async pull+merge — pulls all programs from the user's own Supabase, merges with local by `updatedAt` (preferring the newer), writes the merged list back to localStorage, and returns it. Call on dashboard mount (only does network work if the user has connected their own Supabase).

**Org-Supabase sync:** `saveProgram()` and `deleteProgram()` now fire-and-forget call `syncProgramToSupabase(updated)` / `deleteProgramFromSupabase(id)` from `org-supabase-sync.ts`. These are no-ops when the user hasn't connected their own Supabase. localStorage remains the source of truth for instant UI feedback; the Supabase write happens in the background.

### context-blocks.ts
- `ContextBlock` interface (5 types: geography, donor, sector, organization, stakeholder)
- CRUD: `getBlocks()`, `saveBlock()`, `deleteBlock()`
- `saveSearchAsBlock()`: auto-create block from web search results
- `getBlocksContext()`: format blocks as LLM context string
- `syncBlocksFromSupabase()`: async pull+merge — pulls context blocks from the user's own Supabase, merges with local by `(type, name)` preferring the newer `updatedAt`, writes the merged list back to localStorage, and returns it. Exposed for future use (dashboard mount, settings sync button).

**Org-Supabase sync:** `saveBlock()` and `deleteBlock()` now fire-and-forget call `syncBlockToSupabase(block)` / `deleteBlockFromSupabase(block)` from `org-supabase-sync.ts`. No-ops when the user hasn't connected their own Supabase.

### org-supabase.ts (client-side config)
Browser-side persistence for the user's OWN Supabase connection. Stored in `localStorage` under `hubforge.orgSupabase` as `{ url, anonKey }`. The anon key is used (not the service role key) because it's designed to be public with RLS policies controlling access.

- `OrgSupabaseConfig` interface (`url`, `anonKey`)
- `getOrgSupabase()`: read config from localStorage (or null)
- `storeOrgSupabase(config)`: write config
- `clearOrgSupabase()`: remove config (called on disconnect)
- `hasOrgSupabase()`: boolean check
- `ORG_SUPABASE_URL_HEADER` / `ORG_SUPABASE_KEY_HEADER`: header-name constants (`'X-Org-Supabase-Url'`, `'X-Org-Supabase-Key'`) — kept in sync with `src/lib/server/org-supabase.ts`
- `orgSupabaseHeaders()`: returns a fresh `{ [HEADER]: value }` object to spread into any `fetch()` call that persists data. Returns `{}` when the user hasn't connected — safe to call unconditionally.
- `ORG_SUPABASE_SQL`: the setup SQL string shown in the Data Storage dialog. The user runs this in their own Supabase SQL editor. Creates **6 tables** — `programs`, `reasoning_sessions`, `context_blocks`, `lessons`, `user_profiles`, `analytics_events` — each with indexes and an RLS policy allowing the anon key to read/write. See [Section 11](#11-database-schema-supabase) for the full SQL.

### org-supabase-sync.ts (browser-side sync)
Direct supabase-js client for the user's OWN Supabase. Used for programs and context blocks — the large JSON blobs that would be wasteful to round-trip through HubForge's API routes. The anon key is safe to ship to the browser because RLS protects the data.

- `getOrgSupabaseBrowser()`: returns a cached `SupabaseClient` (re-created only if creds change). Null if not connected.
- `resetOrgSupabaseBrowser()`: drop the cached client — call after the user disconnects so a future reconnect uses fresh creds.

**Programs:**
- `syncProgramToSupabase(program)`: upsert into `programs` table (onConflict: `program_id`). Fire-and-forget.
- `deleteProgramFromSupabase(programId)`: delete by `program_id`.
- `pullProgramsFromSupabase()`: select all programs ordered by `updated_at` desc, limit 200. Returns `[]` on error or if not connected.

**Context blocks:**
- `syncBlockToSupabase(block)`: upsert by `(block_type, name)` — selects existing row first, then update or insert. Fire-and-forget.
- `deleteBlockFromSupabase(block)`: delete by `(block_type, name)`.
- `pullBlocksFromSupabase()`: select all blocks ordered by `updated_at` desc, limit 200.

**Merge helpers (for cross-device sync):**
- `mergePrograms(local, remote)`: returns a merged list keyed by `id`, preferring the entry with the newer `updatedAt`. Result sorted by `updatedAt` desc.
- `mergeBlocks(local, remote)`: same logic keyed by `${type}::${name}`.

### server/org-supabase.ts (server-side helper)
Server-only module for reading org-supplied Supabase credentials from request headers and building a per-org Supabase client. Used by the three persistence API routes (`/api/memory`, `/api/profile`, `/api/analytics`). Lazy-imports `@supabase/supabase-js` so routes still load even if the package weren't installed.

- `ORG_SUPABASE_URL_HEADER` / `ORG_SUPABASE_KEY_HEADER`: header-name constants (mirrored from the client-side `org-supabase.ts`)
- `OrgSupabaseCreds` interface (`url`, `anonKey`)
- `getOrgSupabaseCredsFromRequest(req)`: extract creds from request headers. Returns null if either header is missing or the URL doesn't pass a basic `https://host.tld` sanity check.
- `getOrgSupabaseClient(creds)`: build (or fetch from cache) a `SupabaseClient` for the given creds.
  - **Cache:** in-memory array keyed by `(url, anonKey)`. Bounded to **8 entries** with a **30-minute TTL** to prevent memory leaks across serverless invocations. Oldest entries are evicted when the cache is full.
  - Returns null if `@supabase/supabase-js` can't be imported or `createClient` throws.
- `maybeGetOrgSupabaseClient(req)`: convenience wrapper — creds from request, then client. Returns null at any point if creds are missing.

### export-utils.ts
- `exportStrategyToWord()`: Markdown → .docx (uses `docx` library)
- `exportLogframeToExcel()`: Logframe JSON → .xlsx (uses `xlsx` library)
- `exportToCToExcel()`: ToC JSON → .xlsx
- `exportStrategyToPDF()`: Markdown → .pdf (uses `jspdf`)
- `exportFullReportToPDF()`: Strategy + ToC + Logframe → .pdf

### api-client.ts
Frontend API client. Every call is tracked for usage:
```typescript
async function apiCall(path: string, body: any): Promise<any> {
  const start = Date.now()
  const res = await fetch(path, { method: 'POST', ... })
  const json = await res.json()
  // Track usage
  trackUsage({
    provider: body.providerConfig?.provider || 'zai',
    engine: body.step || path.split('/').pop(),
    durationMs: Date.now() - start,
    inputChars: JSON.stringify(body).length,
    outputChars: JSON.stringify(json).length,
  })
  return json
}
```

### usage-tracker.ts
- `trackUsage()`: record an API call (provider, engine, duration, chars)
- `getUsageSummary()`: aggregate by provider, engine, 7-day chart
- `getOptimizationTips()`: suggestions to reduce cost
- `clearUsage()`: reset

### analytics.ts
Non-blocking event tracker:
- `track()`: queue event, flush every 2 seconds
- `analytics.*`: convenience methods (appOpen, runStart, runComplete, etc.)
- Never throws, never blocks UI

---

## 9. AI Provider System

### Provider IDs
```typescript
type ProviderId = 'zai' | 'zai-key' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'local'
```

### Provider Config
```typescript
interface ProviderConfig {
  provider: ProviderId
  apiKey?: string    // stored in browser localStorage only
  baseUrl?: string   // OpenAI-compatible endpoint
  model?: string     // model name
}
```

### How keys work

1. User selects provider in Settings dialog
2. If provider needs key, API key field appears
3. Key stored in `localStorage` under `hubforge.providerConfig`
4. Key sent directly to provider with each API call (via fetch)
5. Key NEVER sent to HubForge servers

### Adding a new provider

1. Add to `ProviderId` type in `providers.ts` and `engines.ts`
2. Add to `DEFAULT_BASE_URLS` and `DEFAULT_MODELS` in `engines.ts`
3. Add to `PROVIDER_LABELS` in `engines.ts`
4. Add to `PROVIDERS` array in `providers.ts` with metadata
5. If the provider is OpenAI-compatible, it works automatically via the `fetch()` path in `llm()`
6. If not OpenAI-compatible, add custom routing in `llm()`

---

## 10. Data Flow: End-to-End

```
1. User types problem in General Mode
   → stored in `problem` state

2. User clicks "Help me build it"
   → POST /api/interview (Supervisor Engine)
   → Returns decomposition + clarifying questions

3. User answers questions (or skips)
   → Answers stored in `answers` state

4. User clicks "Build my strategy + ToC"
   → runLoop() starts

5. runLoop() calls sequentially:
   a. POST /api/run-step { step: 'retrieval' }
      → Returns frameworks, rules, evidence from knowledge graph
   
   b. POST /api/search
      → Returns demographics, previous programs, evidence from web
      → Auto-saved as context block
   
   c. For each iteration (1 to maxIterations):
      i.   POST /api/run-step { step: 'rule' }
      ii.  POST /api/run-step { step: 'reasoning' }
           → Includes: orgContext, webSearch, retrieval, answers
      iii. POST /api/run-step { step: 'critique' }
      iv.  POST /api/run-step { step: 'improvement' }
      v.   POST /api/run-step { step: 'evaluation' }
      vi.  If score >= threshold: break
   
   d. POST /api/structure
      → Returns ToC JSON + Logframe JSON

6. Deliverable shown to user
   → Strategy (Markdown, rendered)
   → ToC (visual diagram, editable)
   → Logframe (table, editable)

7. Auto-save:
   → Program saved to localStorage (programs.ts)
   → Session saved to /api/memory (if Supabase configured)
   → Web search saved as context block (context-blocks.ts)

8. User can:
   → Edit ToC/Logframe inline
   → Export to Word/PDF/Excel
   → Give feedback → POST /api/feedback → revised draft

9. Every API call tracked:
   → usage-tracker.ts records provider, engine, duration, tokens
   → Usage panel shows consumption + optimization tips

10. Every user action tracked:
    → analytics.ts records events (app_open, run_start, etc.)
    → Admin dashboard shows funnel, scores, errors
```

---

## 11. Database Schema (Supabase)

HubForge OS uses a **3-tier fallback chain** for persistence. There are two Supabase schemas (platform and org), and every persistence call tries them in order before falling back to in-memory:

```
┌─────────────────────────────────────────────────────────────────┐
│ Persistence fallback chain (per request to /api/memory,         │
│ /api/profile, /api/analytics):                                  │
│                                                                 │
│  1. org-supabase        ─► user's OWN Supabase                  │
│     (X-Org-Supabase-*       (programs, sessions, blocks,        │
│      request headers)        lessons, profile, analytics)       │
│         │                                                       │
│         │ if missing/error, fall through                        │
│         ▼                                                       │
│  2. platform-supabase   ─► operator's shared Supabase           │
│     (SUPABASE_URL /          (sessions, profile, analytics)     │
│      SUPABASE_SERVICE_KEY)                                     │
│         │                                                       │
│         │ if env vars not set, fall through                     │
│         ▼                                                       │
│  3. in-memory store     ─► per-instance array                   │
│                                 (lost on cold start)            │
└─────────────────────────────────────────────────────────────────┘
```

Programs and context blocks skip tiers 2 and 3 entirely on the write path — the browser talks DIRECTLY to the user's Supabase via `org-supabase-sync.ts` (no HubForge API roundtrip). localStorage is the local source of truth; the Supabase write is fire-and-forget.

Each API response includes a `source` field (`'org-supabase'` | `'platform-supabase'` | `'memory'` | `'error'`) so callers can verify which path was taken.

---

### 11.1 Platform Supabase (operator-managed fallback)

Used when the user hasn't connected their own Supabase but the operator has configured `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` env vars. Stores **3 tables** only (sessions, profiles, analytics). The admin dashboard always reads from this schema regardless of whether the user has connected their own DB.

Schema SQL is in `supabase-schema.sql` at the repo root:

```sql
-- Reasoning sessions
CREATE TABLE reasoning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  problem TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  iterations INTEGER DEFAULT 0,
  final_score INTEGER DEFAULT 0,
  threshold_met BOOLEAN DEFAULT FALSE,
  final_draft TEXT,
  structured_outputs JSONB,
  provider TEXT
);

-- User profiles
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT UNIQUE NOT NULL,
  name TEXT, email TEXT, organization TEXT,
  country TEXT, role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  profile_id TEXT, session_id TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT,
  event_data JSONB,
  page TEXT, duration_ms INTEGER
);
```

---

### 11.2 Org Supabase (user-owned, full data ownership)

When the user connects their OWN Supabase instance via the Data Storage dialog, the app uses their database exclusively — HubForge's platform Supabase is bypassed. The user runs a setup script that creates **6 tables** so they own every piece of their data: programs, reasoning sessions, context blocks, lessons, user profile, and analytics events.

**Source of truth:** the `ORG_SUPABASE_SQL` constant exported from `src/lib/org-supabase.ts`. The Data Storage dialog shows this script with a copy button. Always copy from there — the snippet below is for reference and may lag behind the constant.

```sql
-- 1. Programs — strategies, ToC, logframes
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id TEXT UNIQUE NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'draft',
  problem TEXT,
  draft TEXT,
  evaluation JSONB,
  structured_outputs JSONB,
  output_types JSONB,
  feedback_history JSONB DEFAULT '[]',
  tags JSONB DEFAULT '{}',
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reasoning sessions
CREATE TABLE IF NOT EXISTS reasoning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  problem TEXT NOT NULL,
  iterations INTEGER DEFAULT 0,
  final_score INTEGER DEFAULT 0,
  threshold_met BOOLEAN DEFAULT FALSE,
  final_draft TEXT,
  structured_outputs JSONB,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Context blocks — reusable knowledge (geography, donor, sector, ...)
CREATE TABLE IF NOT EXISTS context_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_type TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  tags JSONB DEFAULT '[]',
  auto_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Lessons — what worked, what didn't
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id TEXT,
  what_worked TEXT,
  what_didnt_work TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User profile (this device's profile)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT UNIQUE NOT NULL,
  name TEXT, email TEXT, organization TEXT,
  country TEXT, role TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- 6. Analytics events (the user's own private analytics)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT DEFAULT 'engagement',
  event_data JSONB DEFAULT '{}',
  page TEXT,
  duration_ms INTEGER,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (one per frequently-queried column)
CREATE INDEX IF NOT EXISTS idx_programs_status   ON programs (status);
CREATE INDEX IF NOT EXISTS idx_programs_updated  ON programs (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created  ON reasoning_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_type       ON context_blocks (block_type);
CREATE INDEX IF NOT EXISTS idx_analytics_type    ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events (created_at DESC);

-- Row Level Security + anon-key access policies.
-- The anon key is designed to be public; RLS policies below allow it to
-- read/write all rows. Tighten further if you want per-user isolation.
ALTER TABLE programs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reasoning_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_blocks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON programs           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON reasoning_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON context_blocks     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON lessons            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON user_profiles      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON analytics_events   FOR ALL USING (true) WITH CHECK (true);
```

---

### 11.3 Without any Supabase

If the user hasn't connected their own Supabase AND the operator hasn't set `SUPABASE_URL` / `SUPABASE_SERVICE_KEY`, all data falls back to **in-memory** (lost on redeploy/cold start). The app still works — programs and context blocks continue to persist in localStorage on the user's device.

---

## 12. PWA Configuration

### manifest.json (`public/manifest.json`)
```json
{
  "name": "HubForge OS - Social Impact",
  "short_name": "HubForge",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#d97706",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "purpose": "any maskable" }
  ]
}
```

### Service Worker (`public/sw.js`)
- Caches app shell on install (/, manifest, icons)
- Cache-first for static assets, network-first for API calls
- Falls back to cached "/" for navigation when offline

### Registration (`src/app/layout.tsx`)
Inline script in `<head>` registers the service worker on page load.

### next.config.ts
Custom headers for `/sw.js` (correct Content-Type, Service-Worker-Allowed) and `/manifest.json`.

---

## 13. Analytics System

### Client-side (`src/lib/analytics.ts`)
- Non-blocking: events queued, flushed every 2 seconds
- Never throws: all errors silently caught
- Events: app_open, page_view, mode_switch, onboarding_*, run_*, output_*, feedback_*, settings_*, provider_changed, install_*, error

### Server-side (`src/app/api/analytics/route.ts`)
- POST: validates eventType (alphanumeric + underscore only), sanitizes all fields with `.slice()` length limits
- GET (admin): builds dashboard data (daily active users, conversion funnel, quality scores, provider usage, recent errors)

### Admin Dashboard (`src/app/admin/page.tsx`)
- Login with admin key (stored in localStorage)
- Stats: total users, unique (30d), returning, sessions, avg score, avg time, errors
- Charts: daily active users (30-day bar chart), conversion funnel, quality score distribution
- Tables: output types, providers, top events, recent errors
- Export: CSV download of all users

---

## 14. Usage Tracking

### How it works
Every API call in `api-client.ts` is tracked:
```typescript
trackUsage({
  provider: body.providerConfig?.provider || 'zai',
  engine: body.step || path.split('/').pop(),
  durationMs: Date.now() - start,
  inputChars: JSON.stringify(body).length,
  outputChars: JSON.stringify(json).length,
})
```

### What it shows
- Total API calls
- Estimated tokens (chars / 4)
- Estimated cost (per provider rates)
- 7-day bar chart
- Breakdown by provider and engine
- Optimization tips (e.g., "Switch to Z.ai free to save $X")

### Cost rates
```typescript
const COST_PER_1K = {
  'zai': { input: 0, output: 0 },        // Free
  'zai-key': { input: 0, output: 0 },     // Free
  'openai': { input: 0.00015, output: 0.0006 },  // gpt-4o-mini
  'anthropic': { input: 0.003, output: 0.015 },   // claude-3-5-sonnet
  'gemini': { input: 0, output: 0 },              // Free tier
  'groq': { input: 0, output: 0 },                // Free tier
  'local': { input: 0, output: 0 },               // Free
}
```

---

## 15. Export System

All export functions are in `src/lib/export-utils.ts` and run client-side (no server needed).

### Word (.docx)
Uses the `docx` library. Parses Markdown into Word paragraphs:
- `#` → Heading 1
- `##` → Heading 2
- `-` → Bullet list
- `1.` → Numbered list
- `**bold**` → bold run
- `` `code` `` → monospace run

### PDF
Uses `jspdf`. Generates paginated PDF with:
- Title page (HubForge OS, date)
- Strategy document (Markdown rendered to PDF text)
- Theory of Change (if available)
- Logframe (if available)

### Excel (.xlsx)
Uses `xlsx` library.
- Logframe: 5-column table (Level, Description, OVI, MoV, Assumptions)
- ToC: Sectioned spreadsheet (Inputs, Activities, Outputs, Outcomes, Impact, Assumptions)

---

## 16. Security Model

### API Key Storage
- User AI provider keys (OpenAI, Groq, etc.) stored in browser `localStorage` only
- Keys sent directly to AI provider via `fetch()`
- Keys NEVER sent to HubForge OS servers
- Keys NEVER logged to console

### Org Supabase Credentials
Users who connect their OWN Supabase instance via the Data Storage dialog store their `{ url, anonKey }` in browser `localStorage` under `hubforge.orgSupabase`.

- **The anon key is designed to be public.** Row Level Security (RLS) policies on the user's tables are what actually protect the data — not secrecy of the anon key. The setup script in `ORG_SUPABASE_SQL` enables RLS and creates permissive anon policies; users can tighten these further in their Supabase dashboard if they want per-user isolation.
- **The anon key is never sent to HubForge servers EXCEPT** as the request headers `X-Org-Supabase-Url` and `X-Org-Supabase-Key` on the three persistence API routes (`/api/memory`, `/api/profile`, `/api/analytics`). On those routes the HubForge serverless function acts as a **proxy** — it reads the headers, builds a per-org Supabase client, forwards the query to the user's DB, and returns the result. The user's data is never persisted to HubForge-operated storage during this proxy hop.
- **Programs and context blocks skip the HubForge proxy entirely.** The browser talks directly to the user's Supabase via `org-supabase-sync.ts` (using the cached supabase-js client). No HubForge API roundtrip occurs for these large JSON blobs — this is both a privacy win (HubForge never sees the bytes) and a performance win.
- **Server-side client cache is bounded.** The per-org Supabase client cache in `src/lib/server/org-supabase.ts` is capped at **8 entries** with a **30-minute TTL**. Oldest entries are evicted when the cache is full, preventing memory leaks across serverless invocations and bounding the worst-case memory footprint per warm instance.
- **Sanity check on the URL.** `getOrgSupabaseCredsFromRequest()` rejects any URL that doesn't match a basic `https://host.tld` pattern, so a malicious header can't redirect the server to a file:// URL or similar.

### Input Validation
All API routes validate inputs:

- **`POST /api/run-step`** uses **step-specific validation** (see [Section 6](#6-api-routes-reference)):
  - `PROBLEM_STEPS = { retrieval, rule, reasoning }` require `problem` (string, max 10000 chars).
  - `DRAFT_STEPS = { critique, improvement, evaluation }` require their respective inputs instead:
    - `critique` requires `draft`
    - `improvement` requires `draft` + `critique`
    - `evaluation` requires `improved`
  - `step` itself must be one of the six known strings; anything else returns 400.
  - This fixes a regression where critique/improvement/evaluation were incorrectly rejected with `problem is required`.
- `POST /api/feedback`: `currentDraft` + `feedback` required, `feedback` max 5000 chars
- `POST /api/analytics`: `eventType` alphanumeric + underscore only, max 100 chars
- All analytics fields: sanitized with `.slice()` length limits
- `user_agent` and `referrer`: truncated to 500 chars
- Org-supabase URL header: must match `https://host.tld` basic pattern

### Admin Protection
- Admin endpoints require `admin_key` query parameter
- Default key: `hubforge-admin-2024` (change via `HUBFORGE_ADMIN_KEY` env var)
- Wrong key returns 403
- Admin GET on `/api/profile` and `/api/analytics` always reads from **platform-supabase only** — never from a user's org-supabase, even if the request carries org-supabase headers. This keeps the admin dashboard platform-level and prevents an admin-key holder from accidentally reading an individual user's connected DB.

### Rate Limiting
- Not implemented (Vercel handles per-IP limits)
- `maxDuration` on all routes prevents infinite execution

### Data Encryption
- HTTPS/TLS 1.3 in transit (Vercel default)
- Supabase: AES-256 at rest (applies to both platform and org schemas)
- localStorage: not encrypted (browser security model)

---

## 17. Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `SUPABASE_URL` | No | - | Supabase project URL — **platform fallback only** |
| `SUPABASE_SERVICE_KEY` | No | - | Supabase service role key — **platform fallback only** |
| `HUBFORGE_ADMIN_KEY` | No | `hubforge-admin-2024` | Admin dashboard password |

Copy `.env.example` to `.env.local` and fill in values.

**`SUPABASE_URL` / `SUPABASE_SERVICE_KEY` are for the PLATFORM fallback only.** They are used by the three persistence API routes (`/api/memory`, `/api/profile`, `/api/analytics`) and by the admin dashboard when a user hasn't connected their OWN Supabase. They are never consulted when a request carries valid `X-Org-Supabase-Url` / `X-Org-Supabase-Key` headers (org-supabase takes priority). Users who connect their own Supabase via the Data Storage dialog do NOT need these env vars to be set — their data flows directly to their own database. See [Section 11](#11-database-schema-supabase) for the full 3-tier fallback chain.

**Without any env vars:** App works with in-memory storage and default admin key. Users who connect their own Supabase still get full persistence even with zero env vars set.

---

## 18. How to Extend

### Add a new Domain Pack

1. Create `src/lib/health-pack.ts` with `DomainPack` interface
2. Import in `src/lib/engine-access.ts`
3. Add pack selector in the UI (or hardcode for now)
4. Update API routes to use the new pack

### Add a new engine

1. Implement the engine function in `src/lib/engines.ts`
2. Add a new `step` case in `src/app/api/run-step/route.ts`
3. Add the call in `src/lib/api-client.ts`
4. Call it in the frontend loop (`general-mode.tsx` or `geek-mode.tsx`)

### Add a new output type

1. Add to `OutputType` in `src/lib/types.ts`
2. Add to `OUTPUT_OPTIONS` in `src/lib/types.ts`
3. Add handling in `reasoningEngine()` (include in prompt)
4. Add handling in `structureEngine()` (extract from draft)
5. Add a renderer component for the output

### Add a new AI provider

1. Add to `ProviderId` type in `providers.ts` and `engines.ts`
2. Add to `DEFAULT_BASE_URLS`, `DEFAULT_MODELS`, `PROVIDER_LABELS` in `engines.ts`
3. Add to `PROVIDERS` array in `providers.ts`
4. If OpenAI-compatible: works automatically. If not: add custom routing in `llm()`

### Add a new export format

1. Implement the export function in `src/lib/export-utils.ts`
2. Add a button in the deliverable view (`general-mode.tsx`)

### Add a new page

1. Create `src/app/my-page/page.tsx`
2. Add `'use client'` if it has interactivity
3. Add link in footer or navigation

### Add a new API route

1. Create `src/app/api/my-route/route.ts`
2. Export `async function POST(req: NextRequest)` (and/or GET)
3. Add `export const maxDuration = 60`
4. Add input validation
5. Wrap in try/catch
6. Add to `api-client.ts` if called from frontend

---

## 19. Testing

### Run tests
```bash
bun test src/lib/__tests__/
```

### Test files

| File | Tests | What's covered |
|------|-------|---------------|
| `engines.test.ts` | 50 | normalizeConfig, describeProvider, retrievalEngine, ruleEngine, extractJSON, socialImpactPack |
| `frontend.test.ts` | 25 | PROVIDERS, providerDisplayLabel, ProviderConfig, user-profile, analytics, api-client, types |
| `web-search.test.ts` | 10 | extractLocation, extractDomain, query generation |

### Adding tests

```typescript
import { describe, test, expect } from 'bun:test'
import { myFunction } from '../my-module'

describe('myFunction', () => {
  test('does the right thing', () => {
    expect(myFunction('input')).toBe('expected')
  })
})
```

---

## 20. Deployment

### To Vercel (recommended)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. No env vars needed for basic setup
4. Click Deploy
5. Get URL like `hubforge-os.vercel.app`

### Environment variables for production

Set in Vercel → Project → Settings → Environment Variables:

```
HUBFORGE_ADMIN_KEY=your-secret-admin-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Build verification

```bash
bun run build   # Must succeed with no errors
bun run lint    # Must pass with no errors
bun test        # All 85 tests must pass
```

### Cost

| Service | Free tier | What it covers |
|---------|-----------|---------------|
| Vercel (Hobby) | 100GB bandwidth, 100GB-hr serverless | Hosting + API routes |
| Supabase (Free) | 500MB database, 50k MAU | Persistent memory |
| GitHub (Free) | Unlimited public repos | Code hosting |
| Z.ai | Built-in | Default LLM |
| **Total** | **$0/month** | Everything |

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start dev server (port 3000) |
| `bun run build` | Production build |
| `bun run lint` | ESLint check |
| `bun test` | Run all tests |
| `bun run db:push` | Push Prisma schema to DB |

| File | Purpose |
|------|---------|
| `src/lib/engines.ts` | All 8 engines + LLM router |
| `src/lib/knowledge.ts` | Social Impact Pack knowledge graph |
| `src/lib/api-client.ts` | Frontend API calls + usage tracking |
| `src/lib/providers.ts` | AI provider definitions |
| `src/components/general-mode.tsx` | Main user flow |
| `src/components/geek-mode.tsx` | Builder's lab |
| `src/app/page.tsx` | Main page (header, dashboard, mode toggle) |
| `src/app/layout.tsx` | PWA config, fonts, service worker |

---

*HubForge OS - Build systems that think better.*
