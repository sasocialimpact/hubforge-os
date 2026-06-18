'use client'

import { motion } from 'framer-motion'
import type { ToCData, LogframeData } from '@/lib/types'
import { Card } from '@/components/ui/card'

// ============================================================
// Theory of Change — horizontal flowchart renderer (SVG + HTML)
// Inputs → Activities → Outputs → Outcomes → Impact
// with Assumptions and External Factors beneath.
// ============================================================

const COLUMNS: { key: keyof ToCData; title: string; color: string }[] = [
  { key: 'inputs', title: 'Inputs', color: 'bg-sky-100 border-sky-300 dark:bg-sky-950/50 dark:border-sky-800' },
  { key: 'activities', title: 'Activities', color: 'bg-violet-100 border-violet-300 dark:bg-violet-950/50 dark:border-violet-800' },
  { key: 'outputs', title: 'Outputs', color: 'bg-amber-100 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800' },
  { key: 'outcomes', title: 'Outcomes', color: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800' },
]

export function TheoryOfChangeDiagram({ data }: { data: ToCData }) {
  const maxItems = Math.max(data.inputs.length, data.activities.length, data.outputs.length, data.outcomes.length, 1)

  return (
    <div className="space-y-4">
      {data.targetPopulation && (
        <div className="rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Target population</div>
          <div className="text-sm font-medium">{data.targetPopulation}</div>
        </div>
      )}

      {/* Flow columns */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max items-stretch">
          {COLUMNS.map((col, colIdx) => {
            const items = (data[col.key] as string[]) || []
            return (
              <div key={col.key} className="flex items-stretch">
                <div className="w-48 flex flex-col">
                  <div className="text-xs font-mono uppercase tracking-wider text-center mb-2 font-bold">{col.title}</div>
                  <div className="flex-1 flex flex-col gap-1.5 justify-start">
                    {items.length === 0 ? (
                      <div className="rounded border border-dashed border-border p-2 text-[10px] text-muted-foreground text-center italic">
                        not specified
                      </div>
                    ) : (
                      items.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (colIdx * 0.1) + (i * 0.05) }}
                          className={`rounded-md border px-2 py-1.5 text-xs leading-snug ${col.color}`}
                        >
                          {item}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
                {/* Arrow between columns */}
                {colIdx < COLUMNS.length - 1 && (
                  <div className="flex items-center justify-center w-6 self-center" style={{ minHeight: `${Math.min(maxItems, 4) * 44}px` }}>
                    <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                      <path d="M2 12 L16 12 M11 6 L16 12 L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
          {/* Impact column */}
          <div className="flex items-stretch">
            <div className="w-6 flex items-center justify-center" style={{ minHeight: `${Math.min(maxItems, 4) * 44}px` }}>
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                <path d="M2 12 L16 12 M11 6 L16 12 L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400" />
              </svg>
            </div>
            <div className="w-48 flex flex-col">
              <div className="text-xs font-mono uppercase tracking-wider text-center mb-2 font-bold text-rose-700 dark:text-rose-400">Impact</div>
              <div className="rounded-md border-2 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-2 py-2 text-xs leading-snug font-medium">
                {data.impact || 'not specified'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions & External Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dashed border-border">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold mb-1.5">Key assumptions</div>
          <div className="space-y-1">
            {data.assumptions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">No assumptions stated.</p>
            ) : (
              data.assumptions.map((a, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <span className="text-amber-600 mt-0.5">▸</span>
                  <span className="leading-snug">{a}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1.5">External factors</div>
          <div className="space-y-1">
            {data.externalFactors.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">No external factors noted.</p>
            ) : (
              data.externalFactors.map((f, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <span className="text-stone-400 mt-0.5">▸</span>
                  <span className="leading-snug">{f}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Logframe — 4×4 table renderer
// Level | Description | OVI | MoV | Assumptions
// ============================================================

export function LogframeTable({ data }: { data: LogframeData }) {
  const rows = [data.goal, data.purpose, ...data.outputs, ...data.activities]
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-stone-100 dark:bg-stone-900 border-b border-border">
              <th className="text-left p-2 font-mono uppercase tracking-wider text-[10px] text-muted-foreground w-20">Level</th>
              <th className="text-left p-2 font-mono uppercase tracking-wider text-[10px] text-muted-foreground">Description</th>
              <th className="text-left p-2 font-mono uppercase tracking-wider text-[10px] text-muted-foreground w-40">Indicators (OVI)</th>
              <th className="text-left p-2 font-mono uppercase tracking-wider text-[10px] text-muted-foreground w-32">Verification (MoV)</th>
              <th className="text-left p-2 font-mono uppercase tracking-wider text-[10px] text-muted-foreground w-32">Assumptions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const levelColor =
                row.level === 'Goal' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                : row.level === 'Purpose' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                : row.level === 'Output' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                : 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400'
              return (
                <tr key={i} className="border-b border-border align-top">
                  <td className={`p-2 font-mono font-bold ${levelColor}`}>{row.level}</td>
                  <td className="p-2 leading-snug">{row.description || <span className="text-muted-foreground italic">—</span>}</td>
                  <td className="p-2 leading-snug">{row.ovi || <span className="text-muted-foreground italic">—</span>}</td>
                  <td className="p-2 leading-snug">{row.mov || <span className="text-muted-foreground italic">—</span>}</td>
                  <td className="p-2 leading-snug text-muted-foreground">{row.assumptions || <span className="italic">—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
