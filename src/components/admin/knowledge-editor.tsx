'use client'

// Knowledge Graph Editor - admin UI for editing the Social Impact Pack's
// knowledge graph without touching code.
//
// 5 sub-tabs:
//   1. Evidence Library    - add/remove custom EvidenceSource items
//   2. Historical Cases    - add/remove custom HistoricalCase items
//   3. Frameworks          - add/remove custom Framework items
//   4. Evaluation Rubric   - adjust criterion weights (must sum to 1.0)
//   5. Heuristics          - add/remove custom ImprovementHeuristic items
//
// Each list shows the built-in items (read-only, with a "Built-in" badge)
// followed by the admin's custom items (with a "Custom" badge + delete button).
//
// All changes persist via /api/admin/knowledge and /api/admin/rubric (which
// write to the knowledge_overrides table or the in-memory fallback) and take
// effect on the next reasoning run via src/lib/knowledge-overrides.ts.

import { useState, useEffect, useCallback } from 'react'
import {
  BrainCircuit, BookOpen, History, LayoutGrid, Scale, Lightbulb,
  Plus, Trash2, Loader2, ExternalLink, Save, RotateCcw, CheckCircle2,
  AlertCircle, Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { socialImpactPack } from '@/lib/knowledge'

interface KnowledgeEditorProps {
  adminKey: string
  refreshKey: number
}

interface Override {
  id: string
  type: string
  item: any
  created_at: string
  created_by: string | null
}

interface Criterion {
  criterion: string
  weight: number
  description: string
  scoringGuide: string
}

const WEIGHT_TOLERANCE = 0.001

// ──────────────────────────────────────────────────────────────────────
// Small UI helpers
// ──────────────────────────────────────────────────────────────────────

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-8 text-xs text-muted-foreground">{children}</div>
  )
}

function SectionHeader({
  icon: Icon, title, count, countCustom, onAdd, adding,
}: {
  icon: any; title: string; count: number; countCustom: number
  onAdd: () => void; adding: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-mono font-semibold">{title}</h3>
        <Badge variant="outline" className="text-[9px] font-mono">{count} total</Badge>
        {countCustom > 0 && (
          <Badge className="text-[9px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {countCustom} custom
          </Badge>
        )}
      </div>
      <Button
        size="sm"
        variant={adding ? 'outline' : 'default'}
        className="text-xs gap-1.5 h-7"
        onClick={onAdd}
      >
        {adding ? <RotateCcw className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        {adding ? 'Cancel' : 'Add new'}
      </Button>
    </div>
  )
}

function BuiltInBadge() {
  return (
    <Badge variant="outline" className="text-[9px] font-mono shrink-0 text-muted-foreground">
      built-in
    </Badge>
  )
}
function CustomBadge() {
  return (
    <Badge className="text-[9px] font-mono shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      custom
    </Badge>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────

export function KnowledgeEditor({ adminKey, refreshKey }: KnowledgeEditorProps) {
  const [subtab, setSubtab] = useState('evidence')

  // Custom overrides per type
  const [overrides, setOverrides] = useState<Override[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchOverrides = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/admin/knowledge?admin_key=${encodeURIComponent(adminKey)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setOverrides(data.overrides || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    fetchOverrides()
  }, [fetchOverrides, refreshKey])

  const addOverride = async (type: string, item: any) => {
    setActionLoading(true)
    try {
      const res = await fetch(
        `/api/admin/knowledge?admin_key=${encodeURIComponent(adminKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, item }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await fetchOverrides()
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setActionLoading(false)
    }
  }

  const deleteOverride = async (id: string) => {
    if (!confirm('Remove this custom item?')) return
    setActionLoading(true)
    try {
      const res = await fetch(
        `/api/admin/knowledge?admin_key=${encodeURIComponent(adminKey)}&id=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await fetchOverrides()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const customByType = (type: string) => overrides.filter((o) => o.type === type)

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setError('')}>Dismiss</Button>
        </div>
      )}

      <Card className="border-amber-200/60 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold mb-0.5">Knowledge Graph Editor</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add custom evidence, historical cases, frameworks, improvement heuristics, and adjust the evaluation rubric weights. Changes are merged with the built-in Social Impact Pack and take effect on the next reasoning run - no code changes, no redeploy.
            </p>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
          ) : (
            <Badge variant="outline" className="text-[9px] font-mono shrink-0">
              {overrides.length} override{overrides.length === 1 ? '' : 's'}
            </Badge>
          )}
        </CardContent>
      </Card>

      <Tabs value={subtab} onValueChange={setSubtab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="evidence" className="text-xs gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Evidence
          </TabsTrigger>
          <TabsTrigger value="cases" className="text-xs gap-1.5">
            <History className="h-3.5 w-3.5" /> Cases
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="text-xs gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" /> Frameworks
          </TabsTrigger>
          <TabsTrigger value="rubric" className="text-xs gap-1.5">
            <Scale className="h-3.5 w-3.5" /> Rubric
          </TabsTrigger>
          <TabsTrigger value="heuristics" className="text-xs gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> Heuristics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evidence" className="mt-4">
          <EvidenceTab
            builtIn={socialImpactPack.evidence}
            custom={customByType('evidence')}
            onAdd={(item) => addOverride('evidence', item)}
            onDelete={deleteOverride}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="cases" className="mt-4">
          <CasesTab
            builtIn={socialImpactPack.historicalMemory}
            custom={customByType('cases')}
            onAdd={(item) => addOverride('cases', item)}
            onDelete={deleteOverride}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="frameworks" className="mt-4">
          <FrameworksTab
            builtIn={socialImpactPack.frameworks}
            custom={customByType('frameworks')}
            onAdd={(item) => addOverride('frameworks', item)}
            onDelete={deleteOverride}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="rubric" className="mt-4">
          <RubricTab
            adminKey={adminKey}
            builtIn={socialImpactPack.evaluationCriteria}
            refreshKey={refreshKey}
          />
        </TabsContent>

        <TabsContent value="heuristics" className="mt-4">
          <HeuristicsTab
            builtIn={socialImpactPack.improvementHeuristics}
            custom={customByType('heuristics')}
            onAdd={(item) => addOverride('heuristics', item)}
            onDelete={deleteOverride}
            actionLoading={actionLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Tab 1: Evidence Library
// ──────────────────────────────────────────────────────────────────────

function EvidenceTab({
  builtIn, custom, onAdd, onDelete, actionLoading,
}: {
  builtIn: any[]; custom: Override[]
  onAdd: (item: any) => Promise<boolean>; onDelete: (id: string) => void; actionLoading: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Empirical Study')
  const [summary, setSummary] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')

  const reset = () => { setTitle(''); setType('Empirical Study'); setSummary(''); setSourceUrl('') }

  const submit = async () => {
    if (!title.trim() || !summary.trim()) return
    const ok = await onAdd({ title: title.trim(), type: type.trim(), summary: summary.trim(), sourceUrl: sourceUrl.trim() || undefined })
    if (ok) { reset(); setAdding(false) }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <SectionHeader
          icon={BookOpen} title="Evidence Library"
          count={builtIn.length + custom.length} countCustom={custom.length}
          onAdd={() => setAdding(!adding)} adding={adding}
        />

        {adding && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. J-PAL Cost-Effectiveness Tables" className="text-sm h-8" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="text-sm h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Empirical Study', 'Methodology Handbook', 'Institutional Framework', 'Methodology Framework', 'Practitioner Guide', 'Systematic Review', 'Meta-analysis', 'Other'].map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Summary *</Label>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One-paragraph summary of what this source says and why it is useful." className="text-sm min-h-20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Source URL (optional)</Label>
              <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." className="text-sm h-8 font-mono" />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { reset(); setAdding(false) }}>Cancel</Button>
              <Button size="sm" className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" onClick={submit} disabled={!title.trim() || !summary.trim() || actionLoading}>
                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add evidence
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[600px] pr-3">
          <div className="space-y-2">
            {builtIn.map((e, i) => (
              <div key={`b-ev-${i}`} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-start gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold">{e.title}</span>
                      <Badge variant="outline" className="text-[9px] font-mono text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">{e.type}</Badge>
                      <BuiltInBadge />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{e.summary}</p>
                    {e.sourceUrl && (
                      <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-700 dark:text-amber-400 hover:underline mt-1.5">
                        <ExternalLink className="h-3 w-3" /> {e.sourceUrl}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {custom.map((o) => (
              <div key={o.id} className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/15 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold">{o.item.title}</span>
                      <Badge variant="outline" className="text-[9px] font-mono text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">{o.item.type || 'Custom'}</Badge>
                      <CustomBadge />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{o.item.summary}</p>
                    {o.item.sourceUrl && (
                      <a href={o.item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-700 dark:text-amber-400 hover:underline mt-1.5">
                        <ExternalLink className="h-3 w-3" /> {o.item.sourceUrl}
                      </a>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" onClick={() => onDelete(o.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {builtIn.length === 0 && custom.length === 0 && <EmptyHint>No evidence items yet.</EmptyHint>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Tab 2: Historical Cases
// ──────────────────────────────────────────────────────────────────────

function CasesTab({
  builtIn, custom, onAdd, onDelete, actionLoading,
}: {
  builtIn: any[]; custom: Override[]
  onAdd: (item: any) => Promise<boolean>; onDelete: (id: string) => void; actionLoading: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [problem, setProblem] = useState('')
  const [context, setContext] = useState('')
  const [outcome, setOutcome] = useState('')
  const [lesson, setLesson] = useState('')

  const reset = () => { setProblem(''); setContext(''); setOutcome(''); setLesson('') }

  const submit = async () => {
    if (!problem.trim() || !outcome.trim()) return
    const ok = await onAdd({
      problem: problem.trim(),
      context: context.trim(),
      outcome: outcome.trim(),
      lesson: lesson.trim(),
    })
    if (ok) { reset(); setAdding(false) }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <SectionHeader
          icon={History} title="Historical Cases"
          count={builtIn.length + custom.length} countCustom={custom.length}
          onAdd={() => setAdding(!adding)} adding={adding}
        />

        {adding && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Problem *</Label>
              <Input value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="e.g. Design a literacy program for 500 children in rural Kenya" className="text-sm h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Context</Label>
              <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Where, when, and the conditions on the ground." className="text-sm min-h-16" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Outcome *</Label>
              <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What happened. Cite the study or evaluation." className="text-sm min-h-20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Lesson</Label>
              <Textarea value={lesson} onChange={(e) => setLesson(e.target.value)} placeholder="The generalizable takeaway for future programs." className="text-sm min-h-16" />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { reset(); setAdding(false) }}>Cancel</Button>
              <Button size="sm" className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" onClick={submit} disabled={!problem.trim() || !outcome.trim() || actionLoading}>
                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add case
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[600px] pr-3">
          <div className="space-y-2">
            {builtIn.map((c, i) => (
              <div key={`b-c-${i}`} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-sm font-semibold flex-1 min-w-0 truncate">{c.problem}</span>
                  <BuiltInBadge />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
                  {c.context && <p><span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Context:</span> {c.context}</p>}
                  <p><span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Outcome:</span> {c.outcome}</p>
                  {c.lesson && <p><span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Lesson:</span> {c.lesson}</p>}
                </div>
              </div>
            ))}
            {custom.map((o) => (
              <div key={o.id} className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/15 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-sm font-semibold flex-1 min-w-0 truncate">{o.item.problem}</span>
                      <CustomBadge />
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
                      {o.item.context && <p><span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Context:</span> {o.item.context}</p>}
                      <p><span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Outcome:</span> {o.item.outcome}</p>
                      {o.item.lesson && <p><span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Lesson:</span> {o.item.lesson}</p>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" onClick={() => onDelete(o.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {builtIn.length === 0 && custom.length === 0 && <EmptyHint>No historical cases yet.</EmptyHint>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Tab 3: Frameworks
// ──────────────────────────────────────────────────────────────────────

function FrameworksTab({
  builtIn, custom, onAdd, onDelete, actionLoading,
}: {
  builtIn: any[]; custom: Override[]
  onAdd: (item: any) => Promise<boolean>; onDelete: (id: string) => void; actionLoading: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [whenToUse, setWhenToUse] = useState('')
  const [keyElements, setKeyElements] = useState('')

  const reset = () => { setName(''); setDescription(''); setWhenToUse(''); setKeyElements('') }

  const submit = async () => {
    if (!name.trim() || !description.trim()) return
    const elements = keyElements.split('\n').map((s) => s.trim()).filter(Boolean)
    const ok = await onAdd({
      name: name.trim(),
      description: description.trim(),
      whenToUse: whenToUse.trim(),
      keyElements: elements,
    })
    if (ok) { reset(); setAdding(false) }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <SectionHeader
          icon={LayoutGrid} title="Frameworks"
          count={builtIn.length + custom.length} countCustom={custom.length}
          onAdd={() => setAdding(!adding)} adding={adding}
        />

        {adding && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Outcome Harvesting" className="text-sm h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Description *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What the framework is and what it produces." className="text-sm min-h-16" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">When to use</Label>
              <Textarea value={whenToUse} onChange={(e) => setWhenToUse(e.target.value)} placeholder="The situations where this framework is the right choice." className="text-sm min-h-16" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Key elements (one per line)</Label>
              <Textarea value={keyElements} onChange={(e) => setKeyElements(e.target.value)} placeholder={'Boundary partners\nOutcome challenges\nProgress markers'} className="text-sm min-h-20 font-mono text-xs" />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { reset(); setAdding(false) }}>Cancel</Button>
              <Button size="sm" className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" onClick={submit} disabled={!name.trim() || !description.trim() || actionLoading}>
                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add framework
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[600px] pr-3">
          <div className="space-y-2">
            {builtIn.map((f, i) => (
              <div key={`b-fw-${i}`} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold">{f.name}</span>
                  <BuiltInBadge />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{f.description}</p>
                {f.whenToUse && <p className="text-xs leading-relaxed mb-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400">When:</span> <span className="text-muted-foreground">{f.whenToUse}</span></p>}
                {Array.isArray(f.keyElements) && f.keyElements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {f.keyElements.map((el: string, j: number) => (
                      <Badge key={j} variant="outline" className="text-[9px] font-mono">{el}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {custom.map((o) => (
              <div key={o.id} className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/15 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold">{o.item.name}</span>
                      <CustomBadge />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{o.item.description}</p>
                    {o.item.whenToUse && <p className="text-xs leading-relaxed mb-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400">When:</span> <span className="text-muted-foreground">{o.item.whenToUse}</span></p>}
                    {Array.isArray(o.item.keyElements) && o.item.keyElements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {o.item.keyElements.map((el: string, j: number) => (
                          <Badge key={j} variant="outline" className="text-[9px] font-mono">{el}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" onClick={() => onDelete(o.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {builtIn.length === 0 && custom.length === 0 && <EmptyHint>No frameworks yet.</EmptyHint>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Tab 4: Evaluation Rubric
// ──────────────────────────────────────────────────────────────────────

function RubricTab({
  adminKey, builtIn, refreshKey,
}: {
  adminKey: string; builtIn: Criterion[]; refreshKey: number
}) {
  const [override, setOverride] = useState<Criterion[] | null>(null)
  const [overrideId, setOverrideId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Criterion[]>(builtIn)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const fetchRubric = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/rubric?admin_key=${encodeURIComponent(adminKey)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const ov = data.override as Criterion[] | null
      setOverride(ov)
      setOverrideId(data.overrideId ?? null)
      setDraft(ov ?? (data.builtIn as Criterion[]) ?? builtIn)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [adminKey, builtIn])

  useEffect(() => { fetchRubric() }, [fetchRubric, refreshKey])

  const sum = draft.reduce((a, c) => a + c.weight, 0)
  const sumOk = Math.abs(sum - 1) <= WEIGHT_TOLERANCE
  const dirty = JSON.stringify(draft) !== JSON.stringify(override ?? builtIn)

  const setWeight = (i: number, w: number) => {
    setDraft((prev) => prev.map((c, j) => (j === i ? { ...c, weight: w } : c)))
    setSaved(false)
  }

  const addCriterion = () => {
    setDraft((prev) => [...prev, { criterion: 'New criterion', weight: 0, description: '', scoringGuide: '' }])
    setSaved(false)
  }

  const removeCriterion = (i: number) => {
    setDraft((prev) => prev.filter((_, j) => j !== i))
    setSaved(false)
  }

  const updateField = (i: number, field: keyof Criterion, value: string) => {
    setDraft((prev) => prev.map((c, j) => (j === i ? { ...c, [field]: value } : c)))
    setSaved(false)
  }

  const save = async () => {
    if (!sumOk) return
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch(`/api/admin/rubric?admin_key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria: draft }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await fetchRubric()
      setSaved(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    if (!confirm('Reset to the built-in rubric? This removes any custom override.')) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/admin/rubric?admin_key=${encodeURIComponent(adminKey)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await fetchRubric()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-mono font-semibold">Evaluation Rubric</h3>
            {override ? (
              <Badge className="text-[9px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                custom override active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground">
                using built-in
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1.5" onClick={reset} disabled={saving || !override}>
              <RotateCcw className="h-3 w-3" /> Reset to built-in
            </Button>
            <Button
              size="sm"
              className="text-xs h-7 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={save}
              disabled={!sumOk || !dirty || saving || loading}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? <CheckCircle2 className="h-3 w-3" /> : <Save className="h-3 w-3" />}
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save rubric'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Weight sum indicator */}
        <div className={cn(
          'rounded-md border p-3 flex items-center justify-between gap-3',
          sumOk
            ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800'
            : 'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800'
        )}>
          <div className="flex items-center gap-2">
            {sumOk ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
            <span className="text-xs font-mono">
              Weight sum: <span className={sumOk ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-red-700 dark:text-red-400 font-bold'}>{sum.toFixed(3)}</span>
              <span className="text-muted-foreground"> / 1.000</span>
            </span>
          </div>
          <span className={cn('text-xs', sumOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')}>
            {sumOk ? (dirty ? 'Ready to save' : 'In sync') : `Adjust by ${(1 - sum).toFixed(3)} to sum to 1.0`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-amber-600" /></div>
        ) : (
          <ScrollArea className="max-h-[600px] pr-3">
            <div className="space-y-3">
              {draft.map((c, i) => (
                <div key={i} className="rounded-md border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={c.criterion}
                      onChange={(e) => updateField(i, 'criterion', e.target.value)}
                      className="text-sm h-8 font-semibold flex-1"
                    />
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0 tabular-nums">
                      {(c.weight * 100).toFixed(0)}%
                    </Badge>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                      onClick={() => removeCriterion(i)}
                      disabled={draft.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[c.weight]}
                      onValueChange={(v) => setWeight(i, v[0])}
                      min={0} max={1} step={0.05}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-12 text-right tabular-nums">{c.weight.toFixed(2)}</span>
                  </div>
                  <Input
                    value={c.description}
                    onChange={(e) => updateField(i, 'description', e.target.value)}
                    placeholder="Description (what this criterion measures)"
                    className="text-xs h-7"
                  />
                  <Textarea
                    value={c.scoringGuide}
                    onChange={(e) => updateField(i, 'scoringGuide', e.target.value)}
                    placeholder="Scoring guide (e.g. 90+: ...; 70-89: ...; <50: ...)"
                    className="text-xs min-h-12"
                  />
                </div>
              ))}
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 w-full" onClick={addCriterion}>
                <Plus className="h-3 w-3" /> Add criterion
              </Button>
            </div>
          </ScrollArea>
        )}

        <div className="text-[10px] text-muted-foreground flex items-start gap-1.5">
          <Sparkles className="h-3 w-3 shrink-0 mt-0.5 text-amber-600" />
          <span>The evaluation engine reads these weights at runtime. Adjusting them changes how each criterion contributes to the overall quality score on every future reasoning run.</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Tab 5: Heuristics
// ──────────────────────────────────────────────────────────────────────

function HeuristicsTab({
  builtIn, custom, onAdd, onDelete, actionLoading,
}: {
  builtIn: any[]; custom: Override[]
  onAdd: (item: any) => Promise<boolean>; onDelete: (id: string) => void; actionLoading: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const reset = () => { setName(''); setDescription('') }

  const submit = async () => {
    if (!name.trim() || !description.trim()) return
    const ok = await onAdd({ name: name.trim(), description: description.trim() })
    if (ok) { reset(); setAdding(false) }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <SectionHeader
          icon={Lightbulb} title="Improvement Heuristics"
          count={builtIn.length + custom.length} countCustom={custom.length}
          onAdd={() => setAdding(!adding)} adding={adding}
        />

        {adding && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Check for gender-disaggregated indicators" className="text-sm h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Description *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What the critique engine should look for and how to fix it." className="text-sm min-h-20" />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { reset(); setAdding(false) }}>Cancel</Button>
              <Button size="sm" className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" onClick={submit} disabled={!name.trim() || !description.trim() || actionLoading}>
                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add heuristic
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[600px] pr-3">
          <div className="space-y-2">
            {builtIn.map((h, i) => (
              <div key={`b-h-${i}`} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="text-sm font-semibold flex-1 min-w-0">{h.name}</span>
                  <BuiltInBadge />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{h.description}</p>
              </div>
            ))}
            {custom.map((o) => (
              <div key={o.id} className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/15 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="text-sm font-semibold flex-1 min-w-0">{o.item.name}</span>
                      <CustomBadge />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{o.item.description}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" onClick={() => onDelete(o.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {builtIn.length === 0 && custom.length === 0 && <EmptyHint>No heuristics yet.</EmptyHint>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
