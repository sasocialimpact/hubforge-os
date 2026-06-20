# Task 19-c: Feedback Pattern Analysis + Prompt A/B Testing

**Agent**: main (Z.ai Code)
**Task ID**: 19-c
**Date**: 2025

## Summary

Built two new admin systems for HubForge OS:

1. **Feedback Pattern Analysis** - A new "Feedback" tab in the admin dashboard that surfaces patterns in user feedback across all reasoning sessions. Detects 18 keyword themes (sustainability, indicators, budget, risks, assumptions, vague, specific, evidence, stakeholder, timeline, monitoring, target, beneficiary, methodology, data, logframe, theory of change, exit). Auto-generates concrete prompt-edit suggestions for the top 5 patterns.

2. **Prompt A/B Testing** - A new "Prompts" tab that lets the admin manage prompt versions per engine (10 engines) and run side-by-side A/B tests. Each version has a system prompt + user prompt template (with placeholder substitution). Only one version can be active per engine at a time. The A/B test runs the same problem through two versions and shows both outputs with quality scores, critique issues, and a winner banner with one-click promotion.

## Files created

- `src/lib/server/prompt-store.ts` - Shared store for prompt versions. In-memory + Supabase `prompt_versions` table. Lazily seeds built-in versions per engine on first read. Enforces single-active-per-engine invariant. Rolling avg_score + run_count tracking.
- `src/app/api/admin/feedback-analysis/route.ts` - GET endpoint. Reads feedback_history JSONB across all sessions, groups by keyword patterns, returns patterns + recent feedback + suggested improvements.
- `src/app/api/admin/prompts/route.ts` - GET (list, optional engine_id filter), POST (create new version), PATCH (?action=activate&id=...). Admin-key auth.
- `src/app/api/admin/ab-test/route.ts` - POST endpoint. Runs the same problem through 2 prompt versions sequentially, returns both outputs with scores + winner. Updates both versions' avg_score + run_count.
- `src/components/admin/feedback-analysis.tsx` - The FeedbackAnalysis client component. Overview cards, bar chart of patterns, suggested improvements with copy buttons, recent feedback list with score before/after.
- `src/components/admin/prompt-manager.tsx` - The PromptManager client component. Engine selector, version history, active prompt preview, create/fork form, A/B test console with side-by-side results.
- `src/app/global-error.tsx` - Minimal Next.js global error boundary (also satisfies Turbopack's VAR_MODULE_GLOBAL_ERROR template variable).

## Files modified

- `src/lib/engines.ts` - Added `ReasoningPromptOverride` interface and optional `promptOverride` parameter to `reasoningEngine`. When provided, swaps the system prompt and substitutes placeholders in the user prompt template. Backwards-compatible.
- `src/lib/engine-access.ts` - Re-exports `ReasoningPromptOverride` type.
- `src/lib/server/memory-store.ts` - Extended `MemoryRecord.feedbackHistory` to `FeedbackHistoryEntry[]` (with optional scoreBefore/scoreAfter/createdAt). Added `appendFeedbackToMemory(sessionId, entry)` helper.
- `src/lib/api-client.ts` - `callFeedback` now accepts optional `opts?: { sessionId?: string; scoreBefore?: number }` 5th parameter.
- `src/components/general-mode.tsx` - Added `currentSessionId` state. Fixed latent bug where `saveMemory` used `s-${Date.now()}` instead of `loopSessionId` (the IDs diverged). `handleFeedback` now captures `deliverable.evaluation.overall` as `scoreBefore` and passes `{ sessionId, scoreBefore }` to `callFeedback`.
- `src/app/api/feedback/route.ts` - Accepts optional `sessionId` and `scoreBefore` in body. After computing the revised draft + evaluation, appends the feedback entry (with scoreBefore/scoreAfter/createdAt) to the session record's feedback_history. Writes to org Supabase / platform Supabase / in-memory (priority order). Also updates final_score + threshold_met on the session row.
- `src/app/admin/page.tsx` - Added MessageSquare + FlaskConical icons, FeedbackAnalysis + PromptManager imports, feedbackRefreshKey + promptsRefreshKey state, "Feedback" and "Prompts" tabs (between Quality and Knowledge).
- `supabase-schema.sql` - Added `prompt_versions` table (id, engine_id, label, system_prompt, user_prompt_template, active, created_at, created_by, avg_score, run_count) with indexes and RLS.

## What the admin can now do

### Feedback tab

- **Overview**: Total feedback count, sessions with feedback (vs total sessions), feedback rate (color-coded), distinct patterns detected.
- **Top feedback patterns**: Horizontal bar chart of the most common feedback themes. Click any pattern to expand and see up to 5 example feedback texts.
- **Suggested improvements**: Auto-generated from the top 5 patterns. Each suggestion is a copy-pasteable line the admin can add to the Reasoning Engine prompt (e.g. "Add to the Reasoning Engine prompt: 'Always include a detailed sustainability/exit strategy section with a named responsible party...'"). Click Copy to copy to clipboard.
- **Recent feedback**: Scrollable list (h-480px) of the 100 most recent feedback entries. Each row shows date, session ID, score before -> after (with delta, color-coded), problem (truncated), feedback text (truncated). Click to expand and see the full feedback + the list of changes the Feedback Engine made.

### Prompts tab

- **Engine selector**: Dropdown to pick which of the 10 engines' prompts to manage (supervisor, retrieval, rule, reasoning, critique, improvement, evaluation, memory, structure, feedback).
- **Active prompt preview**: Shows the currently active system prompt + user prompt template with copy-to-clipboard buttons.
- **Version history**: Scrollable list of all saved versions for the selected engine. Each row shows label, date, created by, avg score (from A/B tests), run count, active badge (green), prompt preview (truncated). Activate button on non-active versions (auto-deactivates the prior one).
- **Create new version**: Toggle form with label input, system prompt textarea, user prompt template textarea (with placeholder hint), "activate immediately" checkbox, Save button. "Fork active" button pre-fills the form with the active version's prompts.
- **A/B test console**: Problem textarea (pre-filled with a sample literacy program problem), version A dropdown (defaults to active), version B dropdown (defaults to most recent non-active), Run button. Results panel shows winner banner (with "Promote winner" button), two side-by-side panels with score (large, color-coded), threshold pass/fail, duration, critique issue count, top 3 critique issues with severity badges, and an expandable improved draft.

## Data flow

```
User clicks "Improve" on a generated strategy
   ↓
general-mode.tsx handleFeedback()
   ↓ (passes sessionId + scoreBefore)
callFeedback() → /api/feedback
   ↓ (computes revised draft + new evaluation)
   ↓ (appends entry to session's feedback_history with scoreBefore/scoreAfter/createdAt)
   ↓ (updates session's final_score + threshold_met)
reasoning_sessions.feedback_history JSONB (or in-memory store)
   ↓
/api/admin/feedback-analysis (GET)
   ↓ (groups by keyword patterns, generates suggestions)
FeedbackAnalysis component (Feedback tab)

Admin creates a new prompt version
   ↓ (POST /api/admin/prompts)
prompt-store.ts (writes to Supabase prompt_versions OR in-memory cache)
   ↓
Admin runs an A/B test
   ↓ (POST /api/admin/ab-test with versionA + versionB)
   ↓ (loads both versions, runs supervisor + retrieval shared, then reasoning with each version's prompts via promptOverride)
   ↓ (critique + improvement + evaluation on each result)
   ↓ (updates both versions' avg_score + run_count)
PromptManager component (Prompts tab)
```

## Auth

Matches the existing pattern: `HUBFORGE_ADMIN_KEY` env var required (constant-time compare, 403 if missing/wrong). Same gating as `/api/analytics`, `/api/admin/sessions`, `/api/admin/quality-stats`, `/api/admin/knowledge`, `/api/admin/rubric`.

## Lint status

`bun run lint` -> **0 errors, 0 warnings**.

## Verified

- `GET /` -> HTTP 200 (home page renders).
- `GET /admin` -> HTTP 200 (admin page renders, login card visible).
- `GET /api/admin/feedback-analysis?admin_key=test` -> HTTP 403 (correct - admin key not set in dev).
- `GET /api/admin/prompts?admin_key=test` -> HTTP 403 (same).
- With a temporary HUBFORGE_ADMIN_KEY set:
  - `GET /api/admin/feedback-analysis?admin_key=...` -> HTTP 200, returns `{ totalFeedback: 0, sessionsWithFeedback: 0, totalSessions: 0, patterns: [], recent: [], suggestedImprovements: [], source: 'memory' }` (correct - no feedback yet).
  - `GET /api/admin/prompts?admin_key=...` -> HTTP 200, returns 10 seeded built-in versions (one per engine, all initially active).
  - `GET /api/admin/prompts?admin_key=...&engine_id=reasoning` -> HTTP 200, returns only reasoning versions.
  - `POST /api/admin/prompts` with `{ engineId: 'reasoning', label: 'v2.1 - test', systemPrompt: '...', userPromptTemplate: '...', active: false }` -> HTTP 200, returns the new version with id `pv_<timestamp>_<random>`.
  - `PATCH /api/admin/prompts?action=activate&id=pv_...` -> HTTP 200, returns the activated version. Verified the single-active invariant: after activating the new version, only that version is active for the reasoning engine.
  - `GET /api/admin/ab-test?admin_key=test` -> HTTP 405 (correct - only POST allowed).

## Backwards compatibility

- `reasoningEngine` without `promptOverride` behaves identically to before (the override is optional and only applied when provided).
- Existing `feedback_history` entries (shape `{ feedback, addressed }`) still work in the analysis - the new `scoreBefore`/`scoreAfter`/`createdAt` fields are optional and default to null.
- `callFeedback` without the `opts` parameter still works - the new fields are optional.
- The `prompt_versions` table uses `CREATE TABLE IF NOT EXISTS` so re-running the schema script is safe.
- The in-memory prompt store seeds built-in versions on first read - existing installs see the same prompts they had before.
- The latent `saveMemory` ID mismatch bug fix (using `loopSessionId` instead of `s-${Date.now()}`) is a no-op for existing flows: the only consumer of the session ID was the analytics `setAnalyticsSession` call, which already used `loopSessionId`. Now the saved session ID matches, so `/api/feedback` can find the session record by ID.

## Notes for next agent

- The `prompt_versions` table uses `id TEXT PRIMARY KEY` (format: `pv_<timestamp>_<random>` or `pv_builtin_<engineId>`), not UUID, so IDs are sortable and legible in the admin UI.
- The single-active-per-engine invariant is enforced at the application layer (in `prompt-store.ts`). For Supabase, this means the `UPDATE prompt_versions SET active=false WHERE engine_id=? AND active=true` runs before the insert/update of the new active version. For higher concurrency, consider adding a partial unique index: `CREATE UNIQUE INDEX ... ON prompt_versions (engine_id) WHERE active = TRUE`.
- The A/B test runs sequentially (not in parallel) to avoid shared Z.ai key rate-limit contention. Each run takes ~30-60s, so a full A/B test is ~60-120s. The endpoint has `maxDuration = 180` (3 minutes) to accommodate this.
- The `promptOverride.userPromptTemplate` uses square-bracket placeholders (`[USER PROBLEM]`, `[DECOMPOSITION]`, etc.) that match the placeholders documented in `engine-prompts.ts`. Placeholders that don't appear in the template are simply not substituted - the admin controls what data the LLM sees.
- The Feedback Analysis endpoint reads up to 10,000 sessions from Supabase. For larger installs, consider adding a `WHERE feedback_history IS NOT NULL` filter at the DB level (PostgREST supports this via `?feedback_history=neq.null` but it's slower than a dedicated column - a future enhancement could add a `has_feedback` boolean column).
- The `recordRun` function in `prompt-store.ts` updates the rolling average as `prev + (score - prev) / n` (incremental mean). This is numerically stable for the expected scale (single-digit runs per version per day).
