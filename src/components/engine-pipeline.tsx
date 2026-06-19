'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Circle, AlertTriangle } from 'lucide-react'
import { ENGINE_DEFS, type EngineId } from '@/lib/types'
import { cn } from '@/lib/utils'

export type EngineState = 'idle' | 'running' | 'done' | 'error'

export interface EngineStatus {
  state: EngineState
  iterations: { iteration: number; state: EngineState }[]
}

interface EnginePipelineProps {
  statuses: Record<EngineId, EngineStatus>
  activeEngine: EngineId | null
  currentIteration: number
  maxIterations: number
}

const COST_BADGE: Record<string, { label: string; cls: string }> = {
  deterministic: { label: 'DETERMINISTIC', cls: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' },
  cheap: { label: 'CHEAP', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  expensive: { label: 'EXPENSIVE', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
}

export function EnginePipeline({ statuses, activeEngine, currentIteration, maxIterations }: EnginePipelineProps) {
  const engineOrder = ENGINE_DEFS

  return (
    <div className="space-y-2">
      {/* Iteration rail */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <span className="uppercase tracking-wider">Loop</span>
        <div className="flex gap-1">
          {Array.from({ length: maxIterations }).map((_, i) => {
            const itNum = i + 1
            const isActive = currentIteration === itNum
            const isDone = currentIteration > itNum
            return (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  isActive && 'w-10 bg-amber-500',
                  isDone && 'w-6 bg-emerald-500',
                  !isActive && !isDone && 'w-6 bg-muted'
                )}
              />
            )
          })}
        </div>
        <span className="ml-auto">
          iteration {currentIteration > 0 ? currentIteration : '-'} / {maxIterations}
        </span>
      </div>

      {/* Engine cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {engineOrder.map((def, idx) => {
          const status = statuses[def.id]
          const isActive = activeEngine === def.id
          const badge = COST_BADGE[def.cost]
          return (
            <motion.div
              key={def.id}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                'relative rounded-lg border p-3 bg-card flex flex-col gap-1.5 min-h-[112px]',
                isActive && 'border-amber-500 ring-2 ring-amber-500/30 shadow-md',
                status?.state === 'done' && 'border-emerald-500/60',
                status?.state === 'error' && 'border-red-500/60',
                !isActive && status?.state === 'idle' && 'border-border'
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground leading-tight">
                  {def.short}
                </span>
                <StateIcon state={status?.state ?? 'idle'} active={isActive} />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground/80 leading-tight">
                {def.layer}
              </div>
              <span className={cn('text-[9px] font-mono px-1 py-0.5 rounded self-start', badge.cls)}>
                {badge.label}
              </span>
              {/* iteration dots */}
              {status && status.iterations.length > 0 && (
                <div className="flex gap-0.5 mt-auto">
                  {status.iterations.map((it) => (
                    <div
                      key={it.iteration}
                      className={cn(
                        'h-1 w-3 rounded-full',
                        it.state === 'done' && 'bg-emerald-500',
                        it.state === 'running' && 'bg-amber-500',
                        it.state === 'error' && 'bg-red-500',
                        it.state === 'idle' && 'bg-muted'
                      )}
                      title={`Iteration ${it.iteration}: ${it.state}`}
                    />
                  ))}
                </div>
              )}
              {/* connector arrow */}
              {idx < engineOrder.length - 1 && (
                <div className="hidden lg:block absolute -right-[7px] top-1/2 -translate-y-1/2 z-10 text-muted-foreground/40">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5 L8 5 M5 2 L8 5 L5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function StateIcon({ state, active }: { state: EngineState; active: boolean }) {
  if (active || state === 'running') {
    return <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
  }
  if (state === 'done') {
    return <Check className="h-3.5 w-3.5 text-emerald-500" />
  }
  if (state === 'error') {
    return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
  }
  return <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
}
