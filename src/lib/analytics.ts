// Analytics client - non-blocking event tracking
import { getProfileId } from './user-profile'

let sessionId: string | null = null
export function setAnalyticsSession(id: string | null) { sessionId = id }

const queue: any[] = []
let flushTimer: any = null

function scheduleFlush() { if (flushTimer) return; flushTimer = setTimeout(flush, 2000) }
async function flush() { flushTimer = null; if (queue.length === 0) return; const batch = queue.splice(0, queue.length); try { await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batch[0]) }); if (queue.length > 0) scheduleFlush() } catch {} }

export function track(eventType: string, options: { category?: string; data?: Record<string, any>; durationMs?: number } = {}) {
  try { queue.push({ eventType, eventCategory: options.category || 'engagement', eventData: options.data || {}, durationMs: options.durationMs, profileId: getProfileId(), sessionId, page: typeof window !== 'undefined' ? window.location.pathname : '/' }); scheduleFlush() } catch {}
}

export const analytics = {
  appOpen: () => track('app_open', { category: 'engagement', data: { referrer: typeof document !== 'undefined' ? document.referrer : null } }),
  pageView: (page?: string) => track('page_view', { category: 'engagement', data: { page: page || (typeof window !== 'undefined' ? window.location.pathname : '/') } }),
  onboardingStart: () => track('onboarding_start', { category: 'engagement' }),
  onboardingStep: (step: number, stepName: string) => track('onboarding_step', { category: 'engagement', data: { step, stepName } }),
  onboardingComplete: (data: { provider: string; hasKey: boolean; sharedProfile: boolean }) => track('onboarding_complete', { category: 'engagement', data }),
  installPromptShown: () => track('install_prompt_shown', { category: 'engagement' }),
  installAccepted: () => track('install_accepted', { category: 'engagement' }),
  installDismissed: () => track('install_dismissed', { category: 'engagement' }),
  modeSwitch: (mode: string) => track('mode_switch', { category: 'engagement', data: { mode } }),
  runStart: (data: { problemLength: number; outputTypes: string[]; provider: string; skippedInterview: boolean }) => track('run_start', { category: 'reasoning', data }),
  interviewQuestions: (data: { questionCount: number }) => track('interview_questions', { category: 'reasoning', data }),
  interviewSkipped: (data: { skippedCount: number }) => track('interview_skipped', { category: 'reasoning', data }),
  runComplete: (data: { finalScore: number; iterations: number; thresholdMet: boolean }, durationMs: number) => track('run_complete', { category: 'reasoning', data, durationMs }),
  runError: (data: { error: string; phase: string }) => track('run_error', { category: 'error', data }),
  outputViewed: (data: { tab: string; hasToc: boolean; hasLogframe: boolean }) => track('output_viewed', { category: 'output', data }),
  outputCopied: () => track('output_copied', { category: 'output' }),
  outputTabSwitch: (tab: string) => track('output_tab_switch', { category: 'output', data: { tab } }),
  feedbackGiven: (data: { feedbackLength: number }) => track('feedback_given', { category: 'feedback', data }),
  feedbackComplete: (data: { newScore: number; addressedCount: number }) => track('feedback_complete', { category: 'feedback', data }),
  settingsOpened: () => track('settings_opened', { category: 'engagement' }),
  providerChanged: (data: { from: string; to: string }) => track('provider_changed', { category: 'engagement', data }),
  apiError: (data: { endpoint: string; error: string }) => track('api_error', { category: 'error', data }),
}
