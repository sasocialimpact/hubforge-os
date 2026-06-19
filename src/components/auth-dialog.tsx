'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Mail, Lock, User, Check, ArrowRight, ArrowLeft, Shield, Database,
  Eye, EyeOff, AlertCircle, FileText, Download, Trash2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  signup, login, logout, exportAccountData, deleteAccount,
  type SignupParams,
} from '@/lib/auth'

type Mode = 'signup' | 'login' | 'consent' | 'account'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: Mode
  onAuthChange?: () => void
}

export function AuthDialog({ open, onOpenChange, initialMode = 'signup', onAuthChange }: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState({
    analyticsOptIn: true,
    termsAccepted: false,
    privacyPolicyAccepted: false,
  })
  const [exportedData, setExportedData] = useState<any>(null)

  const handleSignup = async () => {
    setError('')
    setLoading(true)
    const params: SignupParams = { email, password, consent }
    const result = await signup(params)
    setLoading(false)
    if (result.success) {
      onAuthChange?.()
      onOpenChange(false)
      resetForm()
    } else {
      setError(result.error || 'Signup failed')
    }
  }

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const result = await login({ email, password })
    setLoading(false)
    if (result.success) {
      onAuthChange?.()
      onOpenChange(false)
      resetForm()
    } else {
      setError(result.error || 'Login failed')
    }
  }

  const handleLogout = () => {
    logout()
    onAuthChange?.()
    onOpenChange(false)
  }

  const handleExport = () => {
    const data = exportAccountData()
    setExportedData(data)
  }

  const handleDelete = () => {
    if (!confirm('Delete your HubForge OS account? This removes your email + auth from this device. Your programs and data in your own Supabase are NOT affected (you control those). This cannot be undone.')) return
    deleteAccount()
    onAuthChange?.()
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError('')
    setExportedData(null)
    setConsent({ analyticsOptIn: true, termsAccepted: false, privacyPolicyAccepted: false })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm() }}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            {mode === 'signup' && <><User className="h-4 w-4 text-amber-600" /> Create your account</>}
            {mode === 'login' && <><Mail className="h-4 w-4 text-amber-600" /> Welcome back</>}
            {mode === 'consent' && <><Shield className="h-4 w-4 text-amber-600" /> Your data, your control</>}
            {mode === 'account' && <><User className="h-4 w-4 text-amber-600" /> Account</>}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 max-h-[65vh] space-y-4">

          {/* ── SIGNUP MODE ── */}
          {mode === 'signup' && (
            <>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@org.org"
                    className="text-sm h-10"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] flex items-center gap-1"><Lock className="h-3 w-3" /> Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="text-sm h-10 pr-9"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Consent summary (click to see full) */}
              <button onClick={() => setMode('consent')} className="w-full text-left rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="text-xs font-medium">How HubForge handles your data</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  We store your email + a hashed password. That's all. Your programs, org details, and indicators live in YOUR database.
                </p>
              </button>

              {/* Consent checkboxes */}
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.termsAccepted}
                    onChange={(e) => setConsent({ ...consent, termsAccepted: e.target.checked })}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-amber-600"
                  />
                  <span className="text-[11px] text-muted-foreground leading-relaxed">
                    I accept the <a href="/terms" className="text-amber-700 dark:text-amber-400 hover:underline" target="_blank">Terms of Service</a>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.privacyPolicyAccepted}
                    onChange={(e) => setConsent({ ...consent, privacyPolicyAccepted: e.target.checked })}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-amber-600"
                  />
                  <span className="text-[11px] text-muted-foreground leading-relaxed">
                    I accept the <a href="/privacy" className="text-amber-700 dark:text-amber-400 hover:underline" target="_blank">Privacy Policy</a> and consent to my email being stored for login (GDPR/DPDP)
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.analyticsOptIn}
                    onChange={(e) => setConsent({ ...consent, analyticsOptIn: e.target.checked })}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-amber-600"
                  />
                  <span className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong>Optional:</strong> Send anonymous usage analytics (features used, session duration) to help improve HubForge. No program content, no personal data.
                  </span>
                </label>
              </div>

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-2 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleSignup}
                disabled={loading || !email || password.length < 6 || !consent.termsAccepted || !consent.privacyPolicyAccepted}
                className="w-full h-10 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? 'Creating…' : <><Check className="h-4 w-4" /> Create account</>}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError('') }} className="text-amber-700 dark:text-amber-400 hover:underline font-medium">
                  Log in
                </button>
              </p>
            </>
          )}

          {/* ── LOGIN MODE ── */}
          {mode === 'login' && (
            <>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@org.org"
                    className="text-sm h-10"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] flex items-center gap-1"><Lock className="h-3 w-3" /> Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="text-sm h-10 pr-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-2 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="w-full h-10 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? 'Logging in…' : <><ArrowRight className="h-4 w-4" /> Log in</>}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                New to HubForge?{' '}
                <button onClick={() => { setMode('signup'); setError('') }} className="text-amber-700 dark:text-amber-400 hover:underline font-medium">
                  Create an account
                </button>
              </p>
            </>
          )}

          {/* ── CONSENT INFO MODE ── */}
          {mode === 'consent' && (
            <>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold">What we store (platform)</span>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Your <strong>email</strong> — to recognize you when you return</li>
                    <li>A <strong>hashed password</strong> — never plaintext, never decryptable</li>
                    <li>A <strong>consent record</strong> — what you agreed to, and when</li>
                    <li><strong>Anonymous usage metadata</strong> — which features you use, how long (only if you opt in)</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold">What stays in YOUR database</span>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Your <strong>name, organization, country, role</strong></li>
                    <li>Your <strong>programs, strategies, logframes</strong></li>
                    <li>Your <strong>monitoring indicators + readings</strong></li>
                    <li>Your <strong>lessons learned</strong></li>
                  </ul>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Connect your own Supabase in Settings to sync this across devices. Without it, this data stays in your browser only.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold">Your rights (GDPR / DPDP)</span>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1 ml-6 list-disc">
                    <li><strong>Right to access</strong> — export your account data anytime</li>
                    <li><strong>Right to be forgotten</strong> — delete your account anytime</li>
                    <li><strong>Right to opt out</strong> — disable analytics anytime</li>
                    <li><strong>Data portability</strong> — your data is in your own Supabase, exportable as SQL</li>
                  </ul>
                </div>
              </div>

              <Button onClick={() => setMode('signup')} variant="outline" className="w-full gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back to signup
              </Button>
            </>
          )}

          {/* ── ACCOUNT MODE (logged in) ── */}
          {mode === 'account' && (
            <>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    {email.split('@')[0].substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{email}</div>
                    <Badge variant="outline" className="text-[9px] mt-0.5">Device identity</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={handleExport} variant="outline" className="w-full gap-1.5 justify-start">
                  <Download className="h-3.5 w-3.5" /> Export my data (GDPR right to access)
                </Button>
                <Button onClick={handleLogout} variant="outline" className="w-full gap-1.5 justify-start">
                  <ArrowRight className="h-3.5 w-3.5" /> Log out
                </Button>
                <Button onClick={handleDelete} variant="ghost" className="w-full gap-1.5 justify-start text-red-500 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" /> Delete account
                </Button>
              </div>

              {exportedData && (
                <div className="rounded-md border border-border bg-muted/30 p-2">
                  <pre className="text-[9px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{JSON.stringify(exportedData, null, 2)}</pre>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your programs, org details, and indicators are stored in your own Supabase (if connected) or this browser. Deleting your account only removes your email + auth from this device.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
