# HubForge OS - Developer Documentation

> Complete guide for developers building on HubForge OS.
> Last updated: June 2026 | Version: 0.2.0 | License: Apache-2.0

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
│  localStorage:          │ fetch()                       │
│  - providerConfig       │                               │
│  - orgProfile           │                               │
│  - programs             │                               │
│  - contextBlocks        │                               │
│  - usage data           │                               │
│  - analytics queue      │                               │
└─────────────────────────┼───────────────────────────────┘
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
│  │  Supabase (optional) or in-memory fallback       │  │
│  │  - reasoning_sessions                            │  │
│  │  - user_profiles                                 │  │
│  │  - analytics_events                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key design decisions

1. **No socket.io** - The frontend orchestrates the reasoning loop via sequential HTTP API calls. This works on Vercel's serverless platform (no persistent connections needed).

2. **API keys in browser** - User API keys (OpenAI, Groq, etc.) are stored in localStorage and sent directly to the provider. They never touch HubForge servers.

3. **localStorage-first** - All user data (programs, org profile, context blocks, usage) is stored in localStorage. Supabase is optional for persistence across devices.

4. **Serverless-friendly** - Each API route is a standalone function with `maxDuration` set. No state between requests.

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
**Validation:** step + problem required, max 10000 chars
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
Session persistence (Supabase or in-memory fallback).

- **GET** - List all sessions (max 50)
- **POST** - Save a session `{ record: { id, problem, finalDraft, ... } }`
- **DELETE** - Clear all sessions

**maxDuration:** 10 seconds

---

### GET/POST /api/profile
User profile management.

- **POST** - Save/update profile `{ profileId, name, email, organization, country, role }`
- **GET** (with `?admin_key=XXX`) - List all users (admin only)
- **GET** (without admin_key) - Returns user count only

**maxDuration:** 10 seconds

---

### GET/POST /api/analytics
Event tracking.

- **POST** - Track an event `{ eventType, eventCategory, eventData, ... }`
- **GET** (with `?admin_key=XXX&days=30`) - Dashboard data (admin only)

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

### context-blocks.ts
- `ContextBlock` interface (5 types: geography, donor, sector, organization, stakeholder)
- CRUD: `getBlocks()`, `saveBlock()`, `deleteBlock()`
- `saveSearchAsBlock()`: auto-create block from web search results
- `getBlocksContext()`: format blocks as LLM context string

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

Run `supabase-schema.sql` in your Supabase SQL editor:

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

**Without Supabase:** All data falls back to in-memory (lost on redeploy). The app still works.

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
- User API keys stored in browser `localStorage` only
- Keys sent directly to AI provider (OpenAI, Groq, etc.) via `fetch()`
- Keys NEVER sent to HubForge OS servers
- Keys NEVER logged to console

### Input Validation
All API routes validate inputs:
- `problem`: required, string, max 10000 chars
- `feedback`: required, max 5000 chars
- `eventType`: alphanumeric + underscore only, max 100 chars
- All analytics fields: sanitized with `.slice()` length limits
- `user_agent` and `referrer`: truncated to 500 chars

### Admin Protection
- Admin endpoints require `admin_key` query parameter
- Default key: `hubforge-admin-2024` (change via `HUBFORGE_ADMIN_KEY` env var)
- Wrong key returns 403

### Rate Limiting
- Not implemented (Vercel handles per-IP limits)
- `maxDuration` on all routes prevents infinite execution

### Data Encryption
- HTTPS/TLS 1.3 in transit (Vercel default)
- Supabase: AES-256 at rest
- localStorage: not encrypted (browser security model)

---

## 17. Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `SUPABASE_URL` | No | - | Supabase project URL for persistence |
| `SUPABASE_SERVICE_KEY` | No | - | Supabase service role key |
| `HUBFORGE_ADMIN_KEY` | No | `hubforge-admin-2024` | Admin dashboard password |

Copy `.env.example` to `.env.local` and fill in values.

**Without any env vars:** App works with in-memory storage and default admin key.

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
