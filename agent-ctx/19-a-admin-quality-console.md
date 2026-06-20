# Task 19-a: Admin Quality Console

**Agent**: main (Z.ai Code)
**Date**: 2025

## Summary

Built the Admin Quality Console — a new "Quality" tab in the admin dashboard at `/admin` that lets the platform owner systematically inspect every generated strategy, its quality score, the critique issues found, the per-criterion evaluation breakdown, and the user feedback given. Turns "hoping outputs are good" into "systematically improving them."

## Files created

- `src/lib/server/memory-store.ts` — shared in-memory store for reasoning sessions (FIFO, max 500 records). Both `/api/memory` and `/api/admin/sessions` read from this when Supabase isn't configured.
- `src/app/api/admin/sessions/route.ts` — GET endpoint with pagination (limit/offset) and filtering (score range, provider, date range). Auth via `HUBFORGE_ADMIN_KEY` env var (constant-time compare). Falls back to in-memory store when Supabase not configured.
- `src/app/api/admin/quality-stats/route.ts` — GET endpoint returning aggregate quality stats: avg score, score distribution (5 buckets), avg iterations, threshold pass rate, common critique issues (top 10 with severity breakdown), provider comparison (count + avg score + pass rate per provider).
- `src/components/admin/quality-console.tsx` — the QualityConsole client component with overview cards, score distribution chart, provider comparison table, common issues list, filter controls (slider + select + date range), and a scrollable session list with expandable rows showing full problem / critique / eval breakdown / user feedback.

## Files modified

- `src/app/api/memory/route.ts` — now uses shared memory-store module + platform-supabase client; POST accepts and stores 4 new JSONB fields (critique, evaluationBreakdown, feedbackHistory, outputTypes); GET selects the new columns.
- `src/components/general-mode.tsx` — hoisted `lastCritique` variable outside the iteration loop; extended `saveMemory()` call to pass critique / evaluationBreakdown / feedbackHistory / outputTypes; added `feedbackHistory` to the `runLoop` useCallback deps.
- `src/app/admin/page.tsx` — added Gauge icon + QualityConsole import; added `qualityRefreshKey` state incremented on refresh; added a "Quality" tab between Analytics and Users; added a signed-in-as-admin sub-header.
- `supabase-schema.sql` — added 4 new JSONB columns to `reasoning_sessions` (critique, evaluation_breakdown, feedback_history, output_types); added indexes on `final_score` and `provider`; added an idempotent `DO $$ ... END$$` block that ALTER TABLEs the new columns in if they don't exist yet.

## What the admin can now see

**Overview cards (top of Quality tab):**
- Total strategies generated
- Average quality score (color-coded by score)
- Threshold pass rate (green if ≥70%, amber otherwise)
- Strategies below threshold (red if >0, with "needs attention" hint)

**Score distribution chart:** Bar chart with 5 buckets (0-49 red, 50-69 orange, 70-79 amber, 80-89 emerald, 90-100 dark emerald), each bar showing count above and bucket label below, with a threshold indicator footer.

**Provider comparison table:** Per-provider row showing provider name, run count (with mini bar), avg score (color-coded), and pass rate (with mini bar - green/amber).

**Common critique issues:** Top 10 most frequent heuristics found across all strategies, each with: heuristic name, total count, proportional bar, and per-severity count badges (H/M/L color-coded).

**Filter controls:** Dual-handle slider for score range (0-100, step 5); provider dropdown auto-populated from data; date range (from/to); Clear button when filters active.

**Session list:** Scrollable table (h-[520px], sticky header) with columns: expand toggle, date, problem (truncated to 80 chars), score (color-coded), provider, threshold (PASS/FAIL badge), iterations. Click any row to expand an animated (framer-motion) detail panel showing:
- Full problem text (scrollable)
- Critique issues (severity badge + heuristic + description)
- Evaluation breakdown (per-criterion bars with score + rationale, plus overall score)
- User feedback history (each entry: feedback text + addressed list)

## Data flow

```
general-mode.tsx saveMemory()
   ↓ (POST with critique, evaluationBreakdown, feedbackHistory, outputTypes)
/api/memory
   ↓ (inserts to reasoning_sessions table OR shared in-memory store)
/api/admin/sessions + /api/admin/quality-stats
   ↓ (reads from same data source)
QualityConsole component (Quality tab in /admin)
```

## Auth

Matches the existing pattern: `HUBFORGE_ADMIN_KEY` env var required (constant-time compare, 403 if missing/wrong). Same gating as `/api/analytics`.

## Lint status

`bun run lint` → **0 errors, 0 warnings**.

## Backwards compatibility

- Existing `reasoning_sessions` rows without the new JSONB columns are handled gracefully — null fields render as "No critique issues recorded" / "No per-criterion scores recorded" / "No user feedback recorded" placeholders.
- The `supabase-schema.sql` script can be safely re-run on existing Supabase projects — the `DO $$ ... END$$` block adds the new columns idempotently.
- The in-memory store is bounded to 500 records (FIFO eviction) so it doesn't grow unbounded.

## Notes for next agent

- The `/api/memory` POST now writes to the new JSONB columns. Any client code that calls `saveMemory()` with the old shape still works (new fields are nullable).
- The QualityConsole's session list is limited to 100 rows per fetch (configurable via `limit` query param, max 200). For paginated loading past 100, the offset query param is supported by the API but not yet exposed in the UI — a future enhancement could add a "Load more" button.
- The `feedbackHistory` saved at run time will typically be `[]` (since the save happens right after the loop, before the user gives feedback). A future enhancement could re-save the session record after each feedback round to capture the complete feedback history.
