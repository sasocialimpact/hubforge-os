'use client'

// Prompt Manager - admin UI for Prompt A/B Testing.
//
// Two main panels:
//   1. Version Manager - engine selector, active prompt preview, version
//      history with avg score, create-new-version form, activate button.
//   2. A/B Test Console - input a problem, pick two versions, run the same
//      problem through both, see outputs + scores side-by-side + winner.
//
// Pulls from /api/admin/prompts (GET, POST, PATCH ?action=activate) and
// /api/admin/ab-test (POST). Style matches quality-console.tsx +
// knowledge-editor.tsx: amber accent, mono headers, dark-mode aware.

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, Plus, Loader2, CheckCircle2, AlertTriangle, Save,
  RotateCcw, Copy, Check, FlaskConical, Trophy, ArrowRight, Sparkles,
  Layers, Clock, Star, ChevronDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface PromptVersion {
  id: string
  engineId: string
  label: string
  systemPrompt: string
  userPromptTemplate: string
  active: boolean
  createdAt: string
  createdBy: string | null
  avgScore: number | null
  runCount: number
}

interface AbTestResultItem {
  versionId: string
  label: string
  engineId: string
  draft: string
  improved: string
  critique: any
  evaluation: any
  durationMs: number
  error?: string
}

interface AbTestResponse {
  resultA: AbTestResultItem
  resultB: AbTestResultItem
  winner: 'A' | 'B' | 'tie' | null
  scoreDelta: number
  provider: string
  durationMs: number
  error?: string
}

const ENGINE_ID_OPTIONS = [
  { value: 'supervisor', label: 'Supervisor Engine' },
  { value: 'retrieval', label: 'Retrieval Engine (no LLM)' },
  { value: 'rule', label: 'Rule Engine (no LLM)' },
  { value: 'reasoning', label: 'Reasoning Engine' },
  { value: 'critique', label: 'Critique Engine' },
  { value: 'improvement', label: 'Improvement Engine' },
  { value: 'evaluation', label: 'Evaluation Engine' },
  { value: 'memory', label: 'Memory Engine (no LLM)' },
  { value: 'structure', label: 'Structure Engine' },
  { value: 'feedback', label: 'Feedback Engine' },
]

interface Props {
  adminKey: string
  refreshKey: number
}

function truncate(s: string, n: number): string {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

function scoreColor(score: number | null): string {
  if (score == null) return 'text-muted-foreground'
  if (score < 50) return 'text-red-600 dark:text-red-400'
  if (score < 70) return 'text-orange-600 dark:text-orange-400'
  if (score < 80) return 'text-amber-600 dark:text-amber-400'
  if (score < 90) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-emerald-700 dark:text-emerald-300'
}

export function PromptManager({ adminKey, refreshKey }: Props) {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [engineId, setEngineId] = useState<string>('reasoning')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activateLoading, setActivateLoading] = useState<string | null>(null)

  // Create form state
  const [newLabel, setNewLabel] = useState('')
  const [newSystemPrompt, setNewSystemPrompt] = useState('')
  const [newUserPromptTemplate, setNewUserPromptTemplate] = useState('')
  const [newActive, setNewActive] = useState(false)
  const [creating, setCreating] = useState(false)

  // A/B test state
  const [abProblem, setAbProblem] = useState('Design a 12-month literacy program for 500 out-of-school girls in rural northern Kenya, ages 9-14, with a budget under $80,000.')
  const [abVersionA, setAbVersionA] = useState<string>('')
  const [abVersionB, setAbVersionB] = useState<string>('')
  const [abRunning, setAbRunning] = useState(false)
  const [abResult, setAbResult] = useState<AbTestResponse | null>(null)
  const [abError, setAbError] = useState('')

  const fetchVersions = useCallback(async (key: string, eng: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/prompts?admin_key=${encodeURIComponent(key)}&engine_id=${encodeURIComponent(eng)}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      const list: PromptVersion[] = json.versions || []
      setVersions(list)
      // Auto-select A = active, B = most recent non-active (or first other).
      const active = list.find((v) => v.active)
      const others = list.filter((v) => !v.active)
      setAbVersionA(active?.id ?? list[0]?.id ?? '')
      setAbVersionB(others[0]?.id ?? list[1]?.id ?? list[0]?.id ?? '')
      setError('')
    } catch (e: any) {
      setError(e.message)
      setVersions([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!adminKey) return
    fetchVersions(adminKey, engineId)
  }, [adminKey, engineId, refreshKey, fetchVersions])

  const activeVersion = useMemo(() => versions.find((v) => v.active) ?? null, [versions])

  const handleCreate = async () => {
    if (!newLabel.trim() || !newSystemPrompt.trim() || !newUserPromptTemplate.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/admin/prompts?admin_key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineId,
          label: newLabel.trim(),
          systemPrompt: newSystemPrompt,
          userPromptTemplate: newUserPromptTemplate,
          active: newActive,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      // Reset form
      setNewLabel(''); setNewSystemPrompt(''); setNewUserPromptTemplate(''); setNewActive(false)
      setShowCreateForm(false)
      await fetchVersions(adminKey, engineId)
    } catch (e: any) {
      setError(e.message)
    }
    setCreating(false)
  }

  const handleActivate = async (id: string) => {
    setActivateLoading(id)
    try {
      const res = await fetch(`/api/admin/prompts?admin_key=${encodeURIComponent(adminKey)}&action=activate&id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      await fetchVersions(adminKey, engineId)
    } catch (e: any) {
      setError(e.message)
    }
    setActivateLoading(null)
  }

  // Pre-fill the create form with the active version's prompts so the admin
  // can fork-and-edit. They can change label + prompts and save as a new
  // version.
  const handleFork = () => {
    if (activeVersion) {
      setNewSystemPrompt(activeVersion.systemPrompt)
      setNewUserPromptTemplate(activeVersion.userPromptTemplate)
      setNewLabel(`${activeVersion.label} - fork`)
    }
    setShowCreateForm(true)
  }

  const handleRunAbTest = async () => {
    if (!abProblem.trim() || !abVersionA || !abVersionB || abVersionA === abVersionB) return
    setAbRunning(true)
    setAbError('')
    setAbResult(null)
    try {
      const res = await fetch(`/api/admin/ab-test?admin_key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: abProblem.trim(),
          versionA: abVersionA,
          versionB: abVersionB,
          outputTypes: ['strategy'],
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setAbResult(json)
      // Refresh versions so the avg_score + run_count update.
      await fetchVersions(adminKey, engineId)
    } catch (e: any) {
      setAbError(e.message)
    }
    setAbRunning(false)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Engine selector + actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-amber-600" /> Engine selector
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px] space-y-1.5">
              <Label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Engine</Label>
              <Select value={engineId} onValueChange={(v) => setEngineId(v)}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENGINE_ID_OPTIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value} className="text-xs">{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-9"
              onClick={handleFork}
              disabled={!activeVersion}
            >
              <Copy className="h-3.5 w-3.5" /> Fork active
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5 h-9 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? <RotateCcw className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showCreateForm ? 'Cancel' : 'New version'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create new version form */}
      <AnimatePresence initial={false}>
        {showCreateForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Card className="border-amber-300 dark:border-amber-800/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Plus className="h-4 w-4 text-amber-600" /> Create new version
                  <span className="text-[10px] text-muted-foreground font-normal ml-1">
                    for {ENGINE_ID_OPTIONS.find((e) => e.value === engineId)?.label}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Label</Label>
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. v2.1 - sustainability emphasis"
                    className="text-xs"
                    maxLength={120}
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      System prompt
                    </Label>
                    <Textarea
                      value={newSystemPrompt}
                      onChange={(e) => setNewSystemPrompt(e.target.value)}
                      placeholder="You are the [ENGINE] of HubForge OS…"
                      className="text-[11px] font-mono h-64 resize-y"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      User prompt template
                      <span className="text-muted-foreground/70 ml-1 normal-case">
                        (placeholders: [USER PROBLEM] [DECOMPOSITION] [RETRIEVED KNOWLEDGE] [OUTPUT SECTIONS] [ITERATION] [MAX_ITERATIONS])
                      </span>
                    </Label>
                    <Textarea
                      value={newUserPromptTemplate}
                      onChange={(e) => setNewUserPromptTemplate(e.target.value)}
                      placeholder="# PROBLEM&#10;[USER PROBLEM]&#10;&#10;# DECOMPOSITION&#10;[DECOMPOSITION]&#10;&#10;# RETRIEVED KNOWLEDGE&#10;[RETRIEVED KNOWLEDGE]"
                      className="text-[11px] font-mono h-64 resize-y"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox
                      checked={newActive}
                      onCheckedChange={(v) => setNewActive(!!v)}
                    />
                    <span>Activate immediately (deactivates the current active version for this engine)</span>
                  </label>
                  <Button
                    size="sm"
                    className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleCreate}
                    disabled={creating || !newLabel.trim() || !newSystemPrompt.trim() || !newUserPromptTemplate.trim()}
                  >
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save version
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Version history (3/5) */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-600" /> Version history
              <Badge variant="outline" className="text-[9px] font-mono ml-1">{versions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && versions.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
              </div>
            ) : versions.length === 0 ? (
              <div className="text-xs text-muted-foreground py-8 text-center">No versions yet.</div>
            ) : (
              <ScrollArea className="h-[440px] rounded-md border border-border">
                <div className="divide-y divide-border">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className={cn(
                        'p-3 transition-colors',
                        v.active
                          ? 'bg-amber-50/40 dark:bg-amber-950/10'
                          : 'hover:bg-stone-50/50 dark:hover:bg-stone-900/30'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            {v.active && (
                              <Badge className="text-[9px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 gap-0.5">
                                <Star className="h-2.5 w-2.5" /> ACTIVE
                              </Badge>
                            )}
                            <span className="text-xs font-semibold truncate">{v.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {v.createdAt ? new Date(v.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '-'}
                            </span>
                            <span>·</span>
                            <span>{v.createdBy || 'admin'}</span>
                            <span>·</span>
                            <span className="truncate">{v.id}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="text-[10px] font-mono text-muted-foreground">
                            avg score:{' '}
                            <span className={cn('font-bold', scoreColor(v.avgScore))}>
                              {v.avgScore != null ? v.avgScore : '—'}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            runs: <span className="font-bold">{v.runCount}</span>
                          </div>
                        </div>
                      </div>
                      {/* Prompt preview (truncated) */}
                      <div className="text-[10px] text-muted-foreground line-clamp-2 mb-2 italic">
                        {truncate(v.systemPrompt, 160)}
                      </div>
                      {!v.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] gap-1 h-6"
                          onClick={() => handleActivate(v.id)}
                          disabled={activateLoading === v.id}
                        >
                          {activateLoading === v.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          Activate
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Active prompt preview (2/5) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" /> Active prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!activeVersion ? (
              <div className="text-xs text-muted-foreground py-8 text-center">No active version for this engine.</div>
            ) : (
              <ScrollArea className="h-[440px]">
                <div className="space-y-3">
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                      Label
                    </div>
                    <div className="text-xs font-semibold">{activeVersion.label}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-between">
                      <span>System prompt</span>
                      <CopyButton text={activeVersion.systemPrompt} />
                    </div>
                    <pre className="text-[10px] font-mono whitespace-pre-wrap p-2 rounded border border-border bg-stone-50/60 dark:bg-stone-900/40 max-h-48 overflow-y-auto">
                      {activeVersion.systemPrompt}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-between">
                      <span>User prompt template</span>
                      <CopyButton text={activeVersion.userPromptTemplate} />
                    </div>
                    <pre className="text-[10px] font-mono whitespace-pre-wrap p-2 rounded border border-border bg-stone-50/60 dark:bg-stone-900/40 max-h-48 overflow-y-auto">
                      {activeVersion.userPromptTemplate}
                    </pre>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* A/B Test Console */}
      <Card className="border-amber-300 dark:border-amber-800/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-amber-600" /> A/B Test console
            <span className="text-[10px] text-muted-foreground font-normal ml-1">
              run the same problem through two versions · compare scores · promote the winner
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test config */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                Test problem
              </Label>
              <Textarea
                value={abProblem}
                onChange={(e) => setAbProblem(e.target.value)}
                placeholder="Describe a strategy problem to test both versions on…"
                className="text-xs h-20 resize-y"
                maxLength={10000}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  Version A
                </Label>
                <Select value={abVersionA} onValueChange={setAbVersionA}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Pick version A" /></SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="text-xs">
                        {v.label}{v.active ? ' (active)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  Version B
                </Label>
                <Select value={abVersionB} onValueChange={setAbVersionB}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Pick version B" /></SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="text-xs">
                        {v.label}{v.active ? ' (active)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[10px] text-muted-foreground">
                Each run does: supervisor + retrieval (shared) → reasoning with version's prompts → critique → improvement → evaluation. Takes ~30-90s.
              </p>
              <Button
                size="sm"
                className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleRunAbTest}
                disabled={abRunning || !abProblem.trim() || !abVersionA || !abVersionB || abVersionA === abVersionB}
              >
                {abRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                {abRunning ? 'Running…' : 'Run A/B test'}
              </Button>
            </div>
            {abError && (
              <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-2 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {abError}
              </div>
            )}
          </div>

          {/* Results */}
          <AnimatePresence initial={false}>
            {abResult && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-2 border-t border-border">
                  {/* Winner banner */}
                  <div className={cn(
                    'rounded-md p-2.5 flex items-center gap-2 text-xs',
                    abResult.winner === 'tie'
                      ? 'bg-stone-100 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300'
                      : 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                  )}>
                    <Trophy className="h-4 w-4 shrink-0" />
                    {abResult.winner === null ? (
                      <span>One or both runs errored - see below.</span>
                    ) : abResult.winner === 'tie' ? (
                      <span>Tie - both versions scored {abResult.resultA.evaluation?.overall ?? '?'}.</span>
                    ) : (
                      <span>
                        Version {abResult.winner} wins by {Math.abs(abResult.scoreDelta)} points
                        ({abResult.winner === 'A' ? abResult.resultA.label : abResult.resultB.label}).
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 h-6 text-[10px] gap-1"
                          onClick={() => handleActivate(abResult.winner === 'A' ? abResult.resultA.versionId : abResult.resultB.versionId)}
                          disabled={activateLoading === (abResult.winner === 'A' ? abResult.resultA.versionId : abResult.resultB.versionId)}
                        >
                          {activateLoading === (abResult.winner === 'A' ? abResult.resultA.versionId : abResult.resultB.versionId)
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <CheckCircle2 className="h-3 w-3" />}
                          Promote winner
                        </Button>
                      </span>
                    )}
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                      total: {(abResult.durationMs / 1000).toFixed(1)}s · {abResult.provider}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <AbResultPanel label="A" result={abResult.resultA} winner={abResult.winner} />
                    <AbResultPanel label="B" result={abResult.resultB} winner={abResult.winner} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Sub-components ----

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    try {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={handle}
      className="text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

function AbResultPanel({
  label, result, winner,
}: {
  label: 'A' | 'B'
  result: AbTestResultItem
  winner: 'A' | 'B' | 'tie' | null
}) {
  const isWinner = winner === label
  const isError = !!result.error
  const score = result.evaluation?.overall
  const [showDraft, setShowDraft] = useState(false)

  return (
    <div className={cn(
      'rounded-md border p-3 space-y-2',
      isWinner
        ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10 dark:border-emerald-800/60'
        : isError
          ? 'border-red-300 bg-red-50/30 dark:bg-red-950/10 dark:border-red-800/60'
          : 'border-border bg-stone-50/30 dark:bg-stone-900/30'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Badge variant="outline" className="text-[9px] font-mono">Version {label}</Badge>
            {isWinner && (
              <Badge className="text-[9px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 gap-0.5">
                <Trophy className="h-2.5 w-2.5" /> WINNER
              </Badge>
            )}
          </div>
          <div className="text-xs font-semibold truncate">{result.label}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Score</div>
          <div className={cn('text-xl font-bold', scoreColor(score ?? null))}>
            {score ?? '—'}
          </div>
        </div>
      </div>

      {isError ? (
        <div className="text-xs text-red-700 dark:text-red-400 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{result.error}</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <span>threshold: {result.evaluation?.thresholdMet ? 'PASS' : 'FAIL'}</span>
            <span>·</span>
            <span>{(result.durationMs / 1000).toFixed(1)}s</span>
            <span>·</span>
            <span>{result.critique?.issues?.length ?? 0} critique issues</span>
          </div>

          {result.critique?.issues?.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Top critique issues</div>
              {result.critique.issues.slice(0, 3).map((iss: any, i: number) => (
                <div key={i} className="text-[10px] flex items-start gap-1">
                  <Badge variant="outline" className={cn(
                    'text-[8px] font-mono py-0 px-1 h-3.5 shrink-0 mt-0.5',
                    iss.severity === 'high'
                      ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      : iss.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                  )}>
                    {iss.severity?.[0]?.toUpperCase() ?? '?'}
                  </Badge>
                  <span className="text-muted-foreground">{truncate(iss.description, 100)}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowDraft(!showDraft)}
            className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <ChevronDown className={cn('h-3 w-3 transition-transform', showDraft && 'rotate-180')} />
            {showDraft ? 'Hide' : 'Show'} improved draft
          </button>
          <AnimatePresence initial={false}>
            {showDraft && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <pre className="text-[10px] font-mono whitespace-pre-wrap p-2 rounded border border-border bg-background max-h-72 overflow-y-auto">
                  {result.improved || '(empty)'}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
