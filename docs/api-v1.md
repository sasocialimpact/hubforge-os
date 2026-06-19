# HubForge OS — Public API v1

> The Win32 moment. Call HubForge's 9-engine kernel programmatically.
> Base URL: `https://your-deployment.vercel.app`
> No auth required for now (shared Z.ai key). Bring your own provider key for unlimited use.

## Quick Start

```bash
curl -X POST https://your-deployment.vercel.app/api/v1/reason \
  -H "Content-Type: application/json" \
  -d '{
    "problem": "Design a literacy program for 500 children in rural Kenya with $50k and 18 months.",
    "outputTypes": ["strategy", "toc", "logframe"]
  }'
```

Response:
```json
{
  "strategy": "# Strategy Document\n## Executive Summary\n...",
  "evaluation": { "overall": 85, "thresholdMet": true, "iterations": 1 },
  "structured": {
    "toc": { "targetPopulation": "...", "inputs": [...], ... },
    "logframe": { "goal": {...}, "purpose": {...}, "outputs": [...] }
  },
  "provider": "Z.ai (shared, free)",
  "durationMs": 45000,
  "rateLimit": { "used": 1, "limit": 5, "remaining": 4 }
}
```

## Endpoints

### POST /api/v1/reason
Run the full 9-engine reasoning pipeline on a problem.

**Request:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `problem` | string | Yes | — | The problem to solve (max 10000 chars) |
| `providerConfig` | object | No | `{provider:"zai"}` | AI provider config (see below) |
| `outputTypes` | string[] | No | `["strategy"]` | What to produce: `strategy`, `toc`, `logframe`, `evaluation-plan` |
| `maxIterations` | number | No | `2` | Max reasoning iterations (1-3) |
| `qualityThreshold` | number | No | `80` | Score needed to stop iterating (0-100) |

**Provider config:**
```json
// Use shared Z.ai key (free, rate-limited):
{ "provider": "zai" }

// Use your own Z.ai key (free, unlimited):
{ "provider": "zai-key", "apiKey": "your-key" }

// Use OpenAI:
{ "provider": "openai", "apiKey": "sk-...", "model": "gpt-4o-mini" }

// Use local Ollama:
{ "provider": "local", "baseUrl": "http://localhost:11434/v1", "model": "gemma2:9b" }
```

**Response:**
| Field | Type | Description |
|-------|------|-------------|
| `strategy` | string | The strategy document (markdown) |
| `evaluation` | object | `{ overall: 0-100, thresholdMet: boolean, iterations: number }` |
| `structured` | object | `{ toc: {...}, logframe: {...} }` if requested |
| `decomposition` | object | Problem decomposition from Supervisor engine |
| `retrieval` | object | Frameworks + evidence pulled from knowledge graph |
| `ruleChecks` | object | Results of 5 decision rules |
| `provider` | string | Human-readable provider label |
| `durationMs` | number | Total pipeline duration |
| `rateLimit` | object | `{ used, limit, remaining }` — shared key users only |

### POST /api/v1/structure
Extract Theory of Change + Logframe from a strategy document.

```bash
curl -X POST .../api/v1/structure \
  -H "Content-Type: application/json" \
  -d '{ "draft": "# Strategy...", "outputTypes": ["toc", "logframe"] }'
```

### GET /api/v1/knowledge
List the knowledge graph layers (frameworks, rules, evidence, historical cases).

```bash
curl .../api/v1/knowledge
```

### GET /api/v1/packs
List all installed domain packs.

```bash
curl .../api/v1/packs
```

### GET /api/v1/health
API health check + endpoint list.

## Rate Limits

- **Shared key (free):** 5 strategies per day per profile. Pass `X-Hubforge-Profile-Id` header to track.
- **Own key:** Unlimited (your provider handles rate limits).
- Rate limit info is returned in every `/api/v1/reason` response.

## SDK (coming soon)

```typescript
import { HubForge } from '@hubforge/sdk'

const hf = new HubForge({ provider: 'zai' })
const result = await hf.reason({
  problem: 'Design a literacy program...',
  outputTypes: ['strategy', 'toc', 'logframe'],
})
console.log(result.strategy)
console.log(result.structured.logframe)
```

## Building Domain Packs

See [docs/knowledge-graph-schema.md](../docs/knowledge-graph-schema.md) for the open pack format.

## License

Apache-2.0 — free for commercial and non-commercial use.
