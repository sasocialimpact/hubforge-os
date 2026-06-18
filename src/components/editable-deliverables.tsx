'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, GripVertical, Edit3, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import type { ToCData, LogframeData, LogframeRow } from '@/lib/types'
import { cn } from '@/lib/utils'

// ============================================================
// Editable Theory of Change
// ============================================================
const TOC_COLUMNS: { key: keyof ToCData; title: string; color: string }[] = [
  { key: 'inputs', title: 'Inputs', color: 'bg-sky-100 border-sky-300 dark:bg-sky-950/50 dark:border-sky-800' },
  { key: 'activities', title: 'Activities', color: 'bg-violet-100 border-violet-300 dark:bg-violet-950/50 dark:border-violet-800' },
  { key: 'outputs', title: 'Outputs', color: 'bg-amber-100 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800' },
  { key: 'outcomes', title: 'Outcomes', color: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800' },
]

export function EditableTheoryOfChange({ data, onChange }: { data: ToCData; onChange: (d: ToCData) => void }) {
  const updateItem = (col: keyof ToCData, index: number, value: string) => {
    const items = [...(data[col] as string[])]
    items[index] = value
    onChange({ ...data, [col]: items })
  }
  const addItem = (col: keyof ToCData) => {
    onChange({ ...data, [col]: [...(data[col] as string[]), 'New item'] })
  }
  const removeItem = (col: keyof ToCData, index: number) => {
    const items = (data[col] as string[]).filter((_, i) => i !== index)
    onChange({ ...data, [col]: items })
  }

  return (
    <div className="space-y-4">
      {/* Target population */}
      <div className="rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Target population</div>
        <Textarea
          value={data.targetPopulation}
          onChange={(e) => onChange({ ...data, targetPopulation: e.target.value })}
          className="text-sm font-medium min-h-[40px] bg-transparent border-0 p-0 focus-visible:ring-0"
        />
      </div>

      {/* Flow columns */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max items-stretch">
          {TOC_COLUMNS.map((col, colIdx) => (
            <div key={col.key} className="flex items-stretch">
              <div className="w-48 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">{col.title}</span>
                  <button onClick={() => addItem(col.key)} className="text-muted-foreground hover:text-amber-600 p-0.5">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  {(data[col.key] as string[]).map((item, i) => (
                    <div key={i} className={cn('group rounded-md border px-2 py-1.5', col.color)}>
                      <Textarea
                        value={item}
                        onChange={(e) => updateItem(col.key, i, e.target.value)}
                        className="text-xs leading-snug bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[36px]"
                      />
                      <button
                        onClick={() => removeItem(col.key, i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-1 -ml-1 text-red-500 hover:text-red-700 bg-background rounded-full"
                        style={{ position: 'relative', float: 'right', marginTop: '-4px' }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {(data[col.key] as string[]).length === 0 && (
                    <button onClick={() => addItem(col.key)} className="rounded border border-dashed border-border p-2 text-[10px] text-muted-foreground hover:border-amber-500">
                      + Add {col.title.toLowerCase().slice(0, -1)}
                    </button>
                  )}
                </div>
              </div>
              {colIdx < TOC_COLUMNS.length - 1 && (
                <div className="flex items-center justify-center w-6 self-center">
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                    <path d="M2 12 L16 12 M11 6 L16 12 L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          {/* Impact */}
          <div className="flex items-stretch">
            <div className="w-6 flex items-center justify-center">
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                <path d="M2 12 L16 12 M11 6 L16 12 L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400" />
              </svg>
            </div>
            <div className="w-48 flex flex-col">
              <div className="text-xs font-mono uppercase tracking-wider text-center mb-2 font-bold text-rose-700 dark:text-rose-400">Impact</div>
              <Textarea
                value={data.impact}
                onChange={(e) => onChange({ ...data, impact: e.target.value })}
                className="rounded-md border-2 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-2 py-2 text-xs leading-snug font-medium focus-visible:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions & External Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dashed border-border">
        <EditableListSection
          title="Key assumptions"
          color="text-amber-700 dark:text-amber-400"
          items={data.assumptions}
          onChange={(items) => onChange({ ...data, assumptions: items })}
        />
        <EditableListSection
          title="External factors"
          color="text-stone-500"
          items={data.externalFactors}
          onChange={(items) => onChange({ ...data, externalFactors: items })}
        />
      </div>
    </div>
  )
}

// ============================================================
// Editable Logframe Table
// ============================================================
export function EditableLogframe({ data, onChange }: { data: LogframeData; onChange: (d: LogframeData) => void }) {
  const updateRow = (section: 'goal' | 'purpose', field: keyof LogframeRow, value: string) => {
    onChange({ ...data, [section]: { ...data[section], [field]: value } })
  }
  const updateArrayRow = (section: 'outputs' | 'activities', index: number, field: keyof LogframeRow, value: string) => {
    const items = [...data[section]]
    items[index] = { ...items[index], [field]: value }
    onChange({ ...data, [section]: items })
  }
  const addRow = (section: 'outputs' | 'activities') => {
    const newRow: LogframeRow = {
      level: section === 'outputs' ? 'Output' : 'Activity',
      description: '', ovi: '', mov: '', assumptions: '',
    }
    onChange({ ...data, [section]: [...data[section], newRow] })
  }
  const removeRow = (section: 'outputs' | 'activities', index: number) => {
    onChange({ ...data, [section]: data[section].filter((_, i) => i !== index) })
  }

  const levelColors: Record<string, string> = {
    Goal: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400',
    Purpose: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    Output: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
    Activity: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400',
  }

  const allRows: { row: LogframeRow; section: string; index?: number }[] = [
    { row: data.goal, section: 'goal' },
    { row: data.purpose, section: 'purpose' },
    ...data.outputs.map((row, i) => ({ row, section: 'outputs', index: i })),
    ...data.activities.map((row, i) => ({ row, section: 'activities', index: i })),
  ]

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
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((item, i) => (
              <tr key={i} className="border-b border-border align-top group">
                <td className={cn('p-2 font-mono font-bold text-xs', levelColors[item.row.level] || '')}>
                  {item.row.level}
                </td>
                <td className="p-0">
                  <Textarea
                    value={item.row.description}
                    onChange={(e) => {
                      if (item.section === 'goal' || item.section === 'purpose') updateRow(item.section as 'goal' | 'purpose', 'description', e.target.value)
                      else updateArrayRow(item.section as 'outputs' | 'activities', item.index!, 'description', e.target.value)
                    }}
                    className="text-xs leading-snug bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[60px] p-2"
                  />
                </td>
                <td className="p-0">
                  <Textarea
                    value={item.row.ovi}
                    onChange={(e) => {
                      if (item.section === 'goal' || item.section === 'purpose') updateRow(item.section as 'goal' | 'purpose', 'ovi', e.target.value)
                      else updateArrayRow(item.section as 'outputs' | 'activities', item.index!, 'ovi', e.target.value)
                    }}
                    className="text-xs leading-snug bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[60px] p-2"
                  />
                </td>
                <td className="p-0">
                  <Textarea
                    value={item.row.mov}
                    onChange={(e) => {
                      if (item.section === 'goal' || item.section === 'purpose') updateRow(item.section as 'goal' | 'purpose', 'mov', e.target.value)
                      else updateArrayRow(item.section as 'outputs' | 'activities', item.index!, 'mov', e.target.value)
                    }}
                    className="text-xs leading-snug bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[60px] p-2"
                  />
                </td>
                <td className="p-0">
                  <Textarea
                    value={item.row.assumptions}
                    onChange={(e) => {
                      if (item.section === 'goal' || item.section === 'purpose') updateRow(item.section as 'goal' | 'purpose', 'assumptions', e.target.value)
                      else updateArrayRow(item.section as 'outputs' | 'activities', item.index!, 'assumptions', e.target.value)
                    }}
                    className="text-xs leading-snug bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[60px] p-2"
                  />
                </td>
                <td className="p-1">
                  {(item.section === 'outputs' || item.section === 'activities') && (
                    <button
                      onClick={() => removeRow(item.section as 'outputs' | 'activities', item.index!)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 p-2 border-t border-border bg-muted/30">
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => addRow('outputs')}>
          <Plus className="h-3 w-3" /> Add Output
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => addRow('activities')}>
          <Plus className="h-3 w-3" /> Add Activity
        </Button>
      </div>
    </Card>
  )
}

// ============================================================
// Editable list section (for assumptions, external factors)
// ============================================================
function EditableListSection({
  title, color, items, onChange,
}: {
  title: string
  color: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn('text-[10px] uppercase tracking-wider font-bold', color)}>{title}</span>
        <button onClick={() => onChange([...items, 'New item'])} className="text-muted-foreground hover:text-amber-600 p-0.5">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5 group">
            <span className={cn('mt-1.5', color)}>▸</span>
            <Textarea
              value={item}
              onChange={(e) => { const next = [...items]; next[i] = e.target.value; onChange(next) }}
              className="text-xs leading-snug bg-transparent border-0 focus-visible:ring-0 p-0 resize-none min-h-[24px] flex-1"
            />
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-0.5 mt-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">No items. Click + to add.</p>
        )}
      </div>
    </div>
  )
}
