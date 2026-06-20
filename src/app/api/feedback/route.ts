// POST /api/feedback - incorporate user feedback and re-evaluate.
//
// Body:
//   {
//     currentDraft: string,        // required - the current draft to revise
//     feedback: string,            // required - user feedback text (max 5000 chars)
//     outputTypes: OutputType[],   // required - for structure re-extraction
//     providerConfig?: ProviderConfig,
//     sessionId?: string,          // optional - if provided, append the entry
//                                  //   to that session's feedback_history so
//                                  //   the Feedback Analysis admin tab can
//                                  //   surface it (with scoreBefore/scoreAfter)
//     scoreBefore?: number         // optional - the score before this feedback
//                                  //   round (from the deliverable the user
//                                  //   was looking at when they typed feedback)
//   }
//
// Response:
//   {
//     improved: string,            // revised draft
//     addressed: string[],         // list of changes the feedback engine made
//     evaluation: EvaluationResult, // new score (the "scoreAfter")
//     structured: StructuredOutputs,
//     savedToSession?: boolean     // true if sessionId was provided and the
//                                  //   entry was appended to the session record
//   }
import { NextRequest, NextResponse } from 'next/server'
import { feedbackEngine, evaluationEngine, structureEngine, normalizeConfig, type ProviderConfig, type OutputType } from '@/lib/engine-access'
import { getMergedPack } from '@/lib/knowledge-overrides'
import { getPlatformClient } from '@/lib/server/platform-supabase'
import { appendFeedbackToMemory } from '@/lib/server/memory-store'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      currentDraft, feedback, outputTypes, providerConfig,
      sessionId, scoreBefore,
    } = body as {
      currentDraft: string
      feedback: string
      outputTypes: OutputType[]
      providerConfig?: ProviderConfig
      sessionId?: string
      scoreBefore?: number
    }
    if (!currentDraft || !feedback) return NextResponse.json({ error: 'currentDraft and feedback are required' }, { status: 400 })
    if (feedback.length > 5000) return NextResponse.json({ error: 'feedback too long (max 5000 chars)' }, { status: 400 })
    const config = normalizeConfig(providerConfig)
    const pack = await getMergedPack()
    const { improved, feedbackAddressed } = await feedbackEngine(config, currentDraft, feedback, pack)
    const evaluation = await evaluationEngine(config, improved, pack, 80)
    const structured = await structureEngine(config, improved, outputTypes)

    // If the caller provided a sessionId, persist this feedback entry back to
    // the session record so the Feedback Analysis admin tab can surface it
    // (with scoreBefore/scoreAfter + timestamp).
    let savedToSession = false
    if (sessionId) {
      const entry = {
        feedback,
        addressed: feedbackAddressed || [],
        scoreBefore: typeof scoreBefore === 'number' ? scoreBefore : null,
        scoreAfter: evaluation?.overall ?? null,
        createdAt: new Date().toISOString(),
      }
      // Org Supabase (user's own DB) - first priority.
      try {
        const { maybeGetOrgSupabaseClient } = await import('@/lib/server/org-supabase')
        const orgClient = await maybeGetOrgSupabaseClient(req)
        if (orgClient) {
          // Fetch the existing feedback_history, append the entry, update.
          // We can't use jsonb_insert via PostgREST easily, so fetch-modify-update.
          const { data: existing } = await orgClient
            .from('reasoning_sessions')
            .select('id, feedback_history')
            .eq('session_id', sessionId)
            .limit(1)
          const row = existing?.[0]
          if (row) {
            const newHistory = Array.isArray(row.feedback_history) ? [...row.feedback_history, entry] : [entry]
            await orgClient
              .from('reasoning_sessions')
              .update({ feedback_history: newHistory, final_score: entry.scoreAfter ?? 0, threshold_met: !!evaluation?.thresholdMet })
              .eq('id', row.id)
            savedToSession = true
          }
        }
      } catch (e) {
        console.warn('[/api/feedback] org-supabase save failed:', e)
      }

      // Platform Supabase - second priority.
      if (!savedToSession) {
        try {
          const supabase = await getPlatformClient()
          if (supabase) {
            const { data: existing } = await supabase
              .from('reasoning_sessions')
              .select('id, feedback_history')
              .eq('session_id', sessionId)
              .limit(1)
            const row = existing?.[0]
            if (row) {
              const newHistory = Array.isArray(row.feedback_history) ? [...row.feedback_history, entry] : [entry]
              await supabase
                .from('reasoning_sessions')
                .update({ feedback_history: newHistory, final_score: entry.scoreAfter ?? 0, threshold_met: !!evaluation?.thresholdMet })
                .eq('id', row.id)
              savedToSession = true
            }
          }
        } catch (e) {
          console.warn('[/api/feedback] platform-supabase save failed:', e)
        }
      }

      // In-memory fallback - last priority.
      if (!savedToSession) {
        try {
          savedToSession = appendFeedbackToMemory(sessionId, entry)
        } catch (e) {
          console.warn('[/api/feedback] memory save failed:', e)
        }
      }
    }

    return NextResponse.json({
      improved,
      addressed: feedbackAddressed,
      evaluation,
      structured,
      savedToSession,
    })
  } catch (e: any) {
    console.error('[/api/feedback] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
