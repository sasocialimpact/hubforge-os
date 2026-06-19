'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Clock, Trash2, Copy, Search, Sparkles, Building2, BookOpen, Utensils, Droplet, Sprout, Heart, Database, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PROGRAM_TEMPLATES } from '@/lib/program-templates'
import { getPrograms, deleteProgram, duplicateProgram, syncProgramsFromSupabase, PROGRAM_STATUSES, type Program } from '@/lib/programs'
import { getOrgProfile } from '@/lib/organization'
import { hasOrgSupabase } from '@/lib/org-supabase'
import { cn } from '@/lib/utils'

interface ProgramDashboardProps {
  onNewProgram: () => void
  onOpenProgram: (program: Program) => void
}

export function ProgramDashboard({ onNewProgram, onOpenProgram }: ProgramDashboardProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')

  // Load programs and org on mount (lazy init)
  const [programs, setPrograms] = useState<Program[]>(() => typeof window !== 'undefined' ? getPrograms() : [])
  const [org] = useState(() => typeof window !== 'undefined' ? getOrgProfile() : null)
  // If the user has connected their own Supabase, show "syncing" until the
  // initial pull completes. Lazy init means we don't trigger a cascading render.
  const [syncingFromSupabase, setSyncingFromSupabase] = useState(() => hasOrgSupabase())

  // On mount, if the user has connected their own Supabase, pull programs from
  // it and merge with local. This gives them their data across devices.
  useEffect(() => {
    if (!hasOrgSupabase()) return
    let cancelled = false
    syncProgramsFromSupabase()
      .then((merged) => {
        if (!cancelled) setPrograms(merged)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSyncingFromSupabase(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteProgram(id)
    setPrograms(getPrograms())
  }

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    duplicateProgram(id)
    setPrograms(getPrograms())
  }

  const filtered = programs.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return [p.title, p.problem, p.tags.donor, p.tags.geography, p.tags.sector]
      .some((v) => (v || '').toLowerCase().includes(q))
  })

  const counts = PROGRAM_STATUSES.reduce((acc, s) => {
    acc[s.id] = programs.filter((p) => p.status === s.id).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">My Programs</h1>
          {org && <p className="text-xs text-muted-foreground mt-0.5">{org.name} - {org.operatingCountries.join(', ') || org.registrationCountry}</p>}
        </div>
        <div className="flex items-center gap-2">
          {hasOrgSupabase() && (
            <Badge variant="outline" className="gap-1 text-[10px] font-mono border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
              {syncingFromSupabase ? (
                <><Database className="h-3 w-3 animate-pulse" /> Syncing…</>
              ) : (
                <><CheckCircle2 className="h-3 w-3" /> Synced to your Supabase</>
              )}
            </Badge>
          )}
          <Button onClick={onNewProgram} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="h-4 w-4" /> New Program
          </Button>
        </div>
      </div>

      {/* Templates */}
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Start from a template (instant, no AI needed)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {PROGRAM_TEMPLATES.map((tpl) => {
            const Icon = tpl.icon === 'BookOpen' ? BookOpen : tpl.icon === 'Utensils' ? Utensils : tpl.icon === 'Droplet' ? Droplet : tpl.icon === 'Sprout' ? Sprout : Heart
            return (
              <button key={tpl.id} onClick={() => { onNewProgram() }}
                className="text-left rounded-lg border border-border p-3 hover:border-amber-500 hover:shadow-sm transition-all group">
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mb-2 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Icon className="h-4 w-4 text-amber-600 group-hover:text-white" />
                </div>
                <div className="text-xs font-medium leading-tight">{tpl.name}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{tpl.typicalBudget}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Org context indicator */}
      {org ? (
        <Card className="p-3 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium">Organization context active:</span>
            <span className="text-muted-foreground">{org.name}</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-muted-foreground">{org.sectors.join(', ')}</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-muted-foreground">{org.budgetRange}</span>
            <Badge variant="outline" className="text-[9px]">Auto-included</Badge>
            <a href="/organization" className="text-amber-700 dark:text-amber-400 hover:underline ml-auto">Edit</a>
          </div>
        </Card>
      ) : (
        <Card className="p-3 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-muted-foreground">No organization profile set.</span>
            <a href="/organization" className="text-amber-700 dark:text-amber-400 hover:underline ml-auto">Set up organization</a>
          </div>
        </Card>
      )}

      {/* Filters + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilter('all')}
            className={cn('px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
              filter === 'all' ? 'bg-amber-500 text-white' : 'bg-muted hover:bg-muted/70')}>
            All ({programs.length})
          </button>
          {PROGRAM_STATUSES.filter((s) => counts[s.id] > 0).map((s) => (
            <button key={s.id} onClick={() => setFilter(s.id)}
              className={cn('px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                filter === s.id ? 'bg-amber-500 text-white' : 'bg-muted hover:bg-muted/70')}>
              {s.label} ({counts[s.id]})
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search programs..." className="pl-8 text-xs h-8 w-48" />
        </div>
      </div>

      {/* Program cards */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-10 w-10 text-amber-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold mb-1">{programs.length === 0 ? 'No programs yet' : 'No programs match your filter'}</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {programs.length === 0 ? 'Create your first program to get started.' : 'Try a different filter or search term.'}
          </p>
          {programs.length === 0 && (
            <Button onClick={onNewProgram} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4" /> Create Program
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((program, i) => {
            const status = PROGRAM_STATUSES.find((s) => s.id === program.status)
            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="p-4 cursor-pointer hover:border-amber-500/50 hover:shadow-md transition-all group"
                  onClick={() => onOpenProgram(program)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate">{program.title}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {new Date(program.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={cn('text-[9px] shrink-0', status?.color)}>{status?.label}</Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{program.problem || 'No problem description'}</p>

                  {program.evaluation?.overall != null && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('text-xs font-mono font-bold',
                        program.evaluation.overall >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                        {program.evaluation.overall}/100
                      </span>
                      {program.feedbackHistory?.length > 0 && (
                        <span className="text-[9px] text-muted-foreground">- {program.feedbackHistory.length} revisions</span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {program.tags.donor && <Badge variant="outline" className="text-[8px]">{program.tags.donor}</Badge>}
                    {program.tags.geography && <Badge variant="outline" className="text-[8px]">{program.tags.geography}</Badge>}
                    {program.tags.sector && <Badge variant="outline" className="text-[8px]">{program.tags.sector}</Badge>}
                  </div>

                  {/* Actions (show on hover) */}
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={(e) => handleDuplicate(program.id, e)}>
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-red-500 hover:text-red-700" onClick={(e) => handleDelete(program.id, e)}>
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
