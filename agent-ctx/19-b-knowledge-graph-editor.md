# Task 19-b: Knowledge Graph Editor

**Agent**: main (Z.ai Code)
**Date**: 2025

## Summary

Built the Knowledge Graph Editor — a new "Knowledge" tab in the admin dashboard at `/admin` that lets the platform owner add/edit/remove knowledge graph items (evidence, historical cases, frameworks, improvement heuristics) and adjust the evaluation rubric weights through a web interface, WITHOUT touching code. Custom items are stored in Supabase (or in-memory fallback) and merged with the built-in Social Impact Pack at runtime, so admin edits take effect on the next reasoning run.

## Files created

- `src/lib/server/knowledge-store.ts` — shared store for knowledge overrides. 30-second TTL cache. Functions: `refreshCache`, `listOverrides`, `addOverride`, `removeOverride`, `setRubricOverride` (singleton — replaces existing rubric), `getRubricOverride`, `clearRubricOverride`. Writes to platform Supabase `knowledge_overrides` table; falls back to in-memory array (same pattern as `memory-store.ts`).
- `src/lib/knowledge-overrides.ts` — server-side merge layer. Exports `getMergedPack()` (returns a `DomainPack` with built-in + custom items, and the admin-adjusted rubric swapped in if one exists), `getMergedRubric()`, `hasRubricOverride()`. Per-type normalizers validate and clamp incoming shapes. Falls back to the built-in pack on any error so the engines never block.
- `src/app/api/admin/knowledge/route.ts` — CRUD endpoint. `GET ?type=...&admin_key=...` lists overrides. `POST {type, item}` validates per-type required fields and adds. `DELETE ?id=...` removes. Admin-key auth (constant-time compare, 403 if missing). Type whitelist: `evidence | cases | frameworks | heuristics`.
- `src/app/api/admin/rubric/route.ts` — rubric weights endpoint. `GET` returns `{override, builtIn, effective, overrideId, source}`. `POST {criteria}` validates: non-empty array, max 20, unique names, weights in [0,1], sum within 0.001 of 1.0. `DELETE` clears the override (reset to built-in).
- `src/components/admin/knowledge-editor.tsx` — the KnowledgeEditor client component with 5 sub-tabs (Evidence, Cases, Frameworks, Rubric, Heuristics). Each tab lists built-in items (read-only, "built-in" badge) + custom items (amber border, "custom" badge, red trash button). Add forms per type. Rubric tab has per-criterion sliders, weight sum indicator (green/red), Save (disabled if sum != 1.0), Reset to built-in, Add/remove criterion.

## Files modified

- `src/app/api/run-step/route.ts` — now calls `getMergedPack()` once per request and passes the merged pack to ALL engines (retrieval, rule, reasoning, critique, improvement, evaluation). Added `sourceUrl` to the evidence output shape. Removed direct `socialImpactPack` import.
- `src/app/api/interview/route.ts` — supervisor engine now uses the merged pack (custom frameworks visible during decomposition).
- `src/app/api/feedback/route.ts` — feedback + evaluation engines now use the merged pack (admin-adjusted rubric applied after feedback).
- `src/app/api/v1/reason/route.ts` — public batch-reason API loads merged pack once for all 8 engines + structure.
- `src/app/api/v1/knowledge/route.ts` — open-data endpoint now returns the merged pack (custom items included) so third-party consumers see the full effective knowledge graph.
- `src/app/admin/page.tsx` — added Network icon + KnowledgeEditor import; added `knowledgeRefreshKey` state (incremented in `fetchAll`); added "Knowledge" tab between Quality and Users.
- `supabase-schema.sql` — added `knowledge_overrides` table (id TEXT PK, type TEXT, item JSONB, created_at TIMESTAMPTZ, created_by TEXT), indexes on type and created_at, RLS enabled + service-role policy. `CREATE TABLE IF NOT EXISTS` so re-running is safe.

## What the admin can now edit

**Evidence Library (Tab 1):** Add custom evidence sources with title, type (8 options: Empirical Study, Methodology Handbook, Institutional Framework, etc.), summary, and optional sourceUrl. Custom items appear alongside the 10 built-in sources and are surfaced to the reasoning engine's evidence layer on the next run. Each item shows title, type badge, summary, and clickable source URL.

**Historical Cases (Tab 2):** Add custom cases with problem, context, outcome, and lesson. Merged with the 8 built-in cases (BRAC ultra-poor, Pratham TaRL, GiveDirectly, M-Pesa, Last Mile Health, etc.) and surface in the reasoning engine's historicalMemory layer.

**Frameworks (Tab 3):** Add custom frameworks with name, description, whenToUse, and keyElements (one per line, parsed into an array). Merged with the 6 built-in frameworks (Theory of Change, Logframe, Outcome Mapping, MSC, Impact Evaluation, Survey Design).

**Evaluation Rubric (Tab 4):** Adjust the 6 criterion weights via sliders (0-1, step 0.05). Edit criterion names, descriptions, and scoring guides. Add/remove criteria (1-20). Weight sum indicator turns green when sum = 1.0 (within 0.001 tolerance), red otherwise with the exact delta. Save button disabled if sum != 1.0 or no changes. Reset to built-in button removes the override. "custom override active" / "using built-in" badge. The evaluation engine reads the admin-adjusted rubric at runtime — changing weights changes how every future strategy is scored.

**Improvement Heuristics (Tab 5):** Add custom heuristics with name and description. Merged with the 9 built-in heuristics (find weak assumptions, detect missing evidence, replace vague outputs, etc.). The critique engine applies them on the next run.

## Data flow

```
Admin Knowledge Editor (Knowledge tab in /admin)
   ↓ (POST /api/admin/knowledge or /api/admin/rubric)
knowledge-store.ts (writes to Supabase knowledge_overrides OR in-memory cache)
   ↓ (read on next reasoning run)
knowledge-overrides.ts getMergedPack()
   ↓ (merges built-in socialImpactPack + custom overrides)
/api/run-step (and /api/interview, /api/feedback, /api/v1/reason)
   ↓ (passes merged pack to retrievalEngine, evaluationEngine, etc.)
Engines use the merged pack — admin edits take effect immediately
```

## Auth

Matches the existing pattern: `HUBFORGE_ADMIN_KEY` env var required (constant-time compare, 403 if missing/wrong). Same gating as `/api/analytics`, `/api/admin/sessions`, `/api/admin/quality-stats`.

## Lint status

`bun run lint` → **0 errors, 0 warnings**.

## Verified

- `GET /admin` → HTTP 200 (page compiles and renders).
- `GET /api/admin/knowledge?admin_key=test` → HTTP 403 (correct — HUBFORGE_ADMIN_KEY not set in dev, matches existing pattern).
- `GET /api/admin/rubric?admin_key=test` → HTTP 403 (same).

## Backwards compatibility

- Every engine route falls back to the built-in `socialImpactPack` if the merge layer throws — no runtime regression.
- When the override list is empty, the merged pack is identical to the built-in pack — existing reasoning runs are unaffected.
- The `supabase-schema.sql` script uses `CREATE TABLE IF NOT EXISTS` so it's safe to re-run on existing Supabase projects.
- The 30-second TTL cache means the engines never block on Supabase, and mutations update the cache immediately so admin edits take effect on the next reasoning run (not after 30s).

## Notes for next agent

- The `knowledge_overrides` table uses `id TEXT PRIMARY KEY` (format: `ko_<timestamp>_<random>`), not UUID, because IDs are generated server-side in `genId()` and we want them sortable/legible in the admin UI.
- The rubric is a singleton: `setRubricOverride` deletes any existing rubric override before inserting the new one. If a race condition ever inserts two, `getRubricOverride` returns the most recent by insertion order.
- The retrieval engine's response now includes `sourceUrl` for each evidence item (previously omitted). The reasoning engine's prompt builder already references evidence by index (E1, E2, ...), so custom evidence is automatically cited by the LLM in generated strategies.
- The Knowledge Editor's Rubric tab allows editing criterion names. If an admin renames a criterion that the evaluation engine's LLM was trained to expect (e.g. "Effectiveness" → "Efficacy"), the LLM may score it differently. This is by design — the admin is intentionally reshaping the rubric.
- The in-memory fallback store is reset on server restart (same as `memory-store.ts`). For persistent storage, set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` env vars and run the `supabase-schema.sql` script.
