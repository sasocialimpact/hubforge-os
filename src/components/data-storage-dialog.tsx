'use client'

import { useState } from 'react'
import { Database, Check, X, ExternalLink, AlertCircle, Copy } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getOrgSupabase, storeOrgSupabase, clearOrgSupabase, hasOrgSupabase, ORG_SUPABASE_SQL, type OrgSupabaseConfig } from '@/lib/org-supabase'
import { cn } from '@/lib/utils'

interface DataStorageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (config: OrgSupabaseConfig | null) => void
}

export function DataStorageDialog({ open, onOpenChange, onSaved }: DataStorageDialogProps) {
  const [config, setConfig] = useState<OrgSupabaseConfig>(() => getOrgSupabase() || { url: '', anonKey: '' })
  const [showSQL, setShowSQL] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testMessage, setTestMessage] = useState('')

  const existing = hasOrgSupabase()

  const handleSave = () => {
    if (config.url.trim() && config.anonKey.trim()) {
      storeOrgSupabase({ url: config.url.trim(), anonKey: config.anonKey.trim() })
      onSaved?.({ url: config.url.trim(), anonKey: config.anonKey.trim() })
    } else {
      clearOrgSupabase()
      onSaved?.(null)
    }
    onOpenChange(false)
  }

  const handleDisconnect = () => {
    clearOrgSupabase()
    setConfig({ url: '', anonKey: '' })
    setTestResult(null)
    onSaved?.(null)
    onOpenChange(false)
  }

  const handleTest = async () => {
    if (!config.url.trim() || !config.anonKey.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${config.url.trim()}/rest/v1/programs?select=id&limit=1`, {
        headers: {
          'apikey': config.anonKey.trim(),
          'Authorization': `Bearer ${config.anonKey.trim()}`,
        },
      })
      if (res.ok) {
        setTestResult('success')
        setTestMessage('Connected successfully! Your Supabase is ready.')
      } else if (res.status === 404) {
        setTestResult('error')
        setTestMessage('Connected, but the "programs" table was not found. Run the SQL setup script first.')
      } else {
        setTestResult('error')
        setTestMessage(`Connection failed: HTTP ${res.status}. Check your URL and anon key.`)
      }
    } catch (e: any) {
      setTestResult('error')
      setTestMessage(`Connection failed: ${e?.message ?? 'Check your URL'}`)
    }
    setTesting(false)
  }

  const copySQL = () => {
    navigator.clipboard?.writeText(ORG_SUPABASE_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-amber-600" />
            Data Storage
          </DialogTitle>
          <DialogDescription className="text-xs">
            Connect your own Supabase database. Your programs, context blocks, and lessons stay in YOUR database - not on HubForge servers.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-5 py-4 max-h-[60vh] space-y-4">
          {existing && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Your database is connected</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">{config.url}</p>
              </div>
              <Badge className="text-[8px] bg-emerald-600">CONNECTED</Badge>
            </div>
          )}

          {/* Why connect your own? */}
          {!existing && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1.5">Why connect your own database?</p>
              <ul className="text-[10px] text-muted-foreground space-y-0.5">
                <li>- You own your data (programs, lessons, context blocks)</li>
                <li>- Data stays private in your Supabase account</li>
                <li>- You can query it directly, export it, share it</li>
                <li>- Free forever (Supabase free tier: 500MB, 50k users)</li>
                <li>- Without this: data stored in browser only (lost if you clear browser)</li>
              </ul>
            </div>
          )}

          {/* Supabase URL */}
          <div className="space-y-1">
            <Label className="text-[11px] flex items-center gap-1.5">
              <Database className="h-3 w-3" /> Supabase Project URL
            </Label>
            <Input
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://your-project.supabase.co"
              className="font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground">Found in Supabase Dashboard {">"} Settings {">"} API {">"} Project URL</p>
          </div>

          {/* Anon Key */}
          <div className="space-y-1">
            <Label className="text-[11px]">Supabase Anon Key (public)</Label>
            <Input
              type="password"
              value={config.anonKey}
              onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Found in Supabase Dashboard {">"} Settings {">"} API {">"} anon public key.
              This is safe to use in the browser (designed to be public with RLS).
            </p>
          </div>

          {/* Test connection */}
          {config.url.trim() && config.anonKey.trim() && (
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={handleTest} disabled={testing}>
              {testing ? 'Testing...' : 'Test connection'}
            </Button>
          )}

          {testResult === 'success' && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-2 flex items-center gap-2 text-xs">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-300">{testMessage}</span>
            </div>
          )}
          {testResult === 'error' && (
            <div className="rounded-md border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-2 flex items-start gap-2 text-xs">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-red-700 dark:text-red-300">{testMessage}</span>
            </div>
          )}

          {/* SQL Setup */}
          <div className="space-y-2">
            <button onClick={() => setShowSQL(s => !s)} className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline">
              {showSQL ? 'Hide' : 'Show'} SQL setup script
              <ExternalLink className="h-3 w-3" />
            </button>
            {showSQL && (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground">
                  Run this SQL in your Supabase Dashboard (SQL Editor {">"} New Query) to create the tables HubForge needs:
                </p>
                <div className="relative">
                  <ScrollArea className="h-48 rounded-md border border-border">
                    <pre className="text-[9px] font-mono whitespace-pre-wrap p-3 bg-muted/30">{ORG_SUPABASE_SQL}</pre>
                  </ScrollArea>
                  <Button variant="ghost" size="sm" className="absolute top-1 right-1 text-[10px] gap-1 h-6" onClick={copySQL}>
                    {copied ? <><Check className="h-3 w-3 text-emerald-600" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your Supabase anon key is stored in this browser only (localStorage) and sent directly to YOUR Supabase - never to HubForge servers. You can disconnect anytime.
          </p>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border shrink-0 gap-2">
          {existing && (
            <Button variant="outline" size="sm" className="text-red-500 gap-1.5" onClick={handleDisconnect}>
              <X className="h-3.5 w-3.5" /> Disconnect
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!config.url.trim() || !config.anonKey.trim()} className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
            <Check className="h-3.5 w-3.5" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
