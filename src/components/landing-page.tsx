'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight, Brain, Network, FileText, BarChart3, Shield, Zap,
  Database, Sparkles, Check, Globe, Users, TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LandingPageProps {
  onLaunch: () => void
  onSignIn?: () => void
}

const FEATURES = [
  {
    icon: Brain,
    title: '9-Engine AI Pipeline',
    desc: 'Supervisor → Retrieval → Web Search → Rule → Reasoning → Critique → Improvement → Evaluation → Structure. Recursive reasoning, not single-shot generation.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
  },
  {
    icon: Network,
    title: 'Theory of Change',
    desc: 'Visual flowcharts: Inputs → Activities → Outputs → Outcomes → Impact. Auto-generated from your problem description, grounded in 6 M&E frameworks.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  {
    icon: FileText,
    title: 'Logframes & Strategies',
    desc: '4×4 logical frameworks with OVIs, means of verification, and assumptions. Full strategy documents with executive summaries, risks, and targets.',
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
  },
  {
    icon: BarChart3,
    title: 'Evaluation Plans',
    desc: 'Evaluation questions, design, indicators, data collection methods, and timelines. Aligned to your donors\' reporting frameworks.',
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
  },
  {
    icon: Shield,
    title: 'Your Data, Your Database',
    desc: 'Connect your own Supabase. Programs, sessions, and lessons live in YOUR database — never on HubForge servers. Full ownership, zero lock-in.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    icon: Zap,
    title: '7 AI Providers',
    desc: 'Use our free shared Z.ai key, or bring your own (OpenAI, Anthropic, Gemini, Groq, local Ollama). Keys stay in your browser, sent directly to providers.',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
  },
]

const STATS = [
  { value: '9', label: 'AI Engines', sub: 'recursive pipeline' },
  { value: '7', label: 'AI Providers', sub: 'including local' },
  { value: '6', label: 'M&E Frameworks', sub: 'in knowledge graph' },
  { value: '$0', label: 'Monthly Cost', sub: 'on free tiers' },
]

const PIPELINE_STEPS = [
  { name: 'Supervisor', desc: 'Decomposes problem' },
  { name: 'Retrieval', desc: 'Pulls frameworks' },
  { name: 'Web Search', desc: 'Finds demographics' },
  { name: 'Rule', desc: 'Checks 5 rules' },
  { name: 'Reasoning', desc: 'Drafts strategy' },
  { name: 'Critique', desc: 'Finds issues' },
  { name: 'Improvement', desc: 'Rewrites draft' },
  { name: 'Evaluation', desc: 'Scores 0-100' },
  { name: 'Structure', desc: 'ToC + Logframe' },
]

export function LandingPage({ onLaunch, onSignIn }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* ── Nav ── */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-border' : 'bg-transparent'
      )}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/hubforge-os-icon.png" alt="HubForge OS" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-base tracking-tight">HubForge OS</span>
            <Badge variant="outline" className="text-[9px] font-mono ml-1">v0.3</Badge>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-foreground transition-colors">Pipeline</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-2">
            {onSignIn && (
              <Button onClick={onSignIn} variant="ghost" size="sm" className="text-xs">
                Sign in
              </Button>
            )}
            <Button onClick={onLaunch} size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
              Launch App <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background accents */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-rose-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <img src="/hubforge-os-icon.png" alt="HubForge OS" className="h-24 w-24 rounded-2xl shadow-xl" />
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white dark:border-stone-950 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3 text-amber-600" />
              Open-source · Apache-2.0 · Free forever
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4"
          >
            HubForge OS
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg sm:text-xl text-muted-foreground mb-2 max-w-2xl mx-auto leading-relaxed"
          >
            The operating system for
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-xl sm:text-2xl md:text-3xl font-semibold mb-8 bg-gradient-to-r from-amber-600 via-rose-600 to-violet-600 bg-clip-text text-transparent"
          >
            Monitoring, Evaluation, Research & Learning
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-base text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Build expert-grade program strategies, theories of change, logframes, and evaluation plans in minutes.
            For NGOs and social impact organizations — no M&E expertise needed.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
          >
            <Button onClick={onLaunch} size="lg" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white h-12 px-8 text-base">
              Launch HubForge OS <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="#features">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base gap-2">
                See how it works
              </Button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl border border-border bg-muted/30">
                <div className="text-3xl font-bold text-amber-600">{stat.value}</div>
                <div className="text-sm font-medium mt-1">{stat.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pipeline section ── */}
      <section id="pipeline" className="py-20 px-4 sm:px-6 bg-muted/20 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs font-mono">THE ENGINE</Badge>
            <h2 className="text-3xl font-bold mb-3">9-Engine Recursive Reasoning</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Not a single LLM call. A bounded recursive loop that decomposes, drafts, critiques, improves, and evaluates — until quality meets the threshold.
            </p>
          </div>

          {/* Pipeline visualization */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div
                key={step.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2"
              >
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'h-12 w-12 rounded-lg border-2 flex items-center justify-center font-bold text-sm',
                    i === 0 ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
                    i === PIPELINE_STEPS.length - 1 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' :
                    'border-border bg-background text-muted-foreground'
                  )}>
                    {i + 1}
                  </div>
                  <div className="text-[10px] font-medium mt-1 text-center w-16">{step.name}</div>
                  <div className="text-[9px] text-muted-foreground text-center w-16 leading-tight">{step.desc}</div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 hidden sm:block" />
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground font-mono">
              Quality threshold: 80/100 · Max iterations: 2 · Falls back gracefully on any engine failure
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs font-mono">CAPABILITIES</Badge>
            <h2 className="text-3xl font-bold mb-3">Everything you need to build fundable programs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From problem statement to donor-ready deliverable in minutes. No M&E specialist required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border hover:border-amber-500/40 transition-all hover:shadow-md"
              >
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center mb-4', feature.bg)}>
                  <feature.icon className={cn('h-5 w-5', feature.color)} />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20 px-4 sm:px-6 bg-muted/20 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs font-mono">WORKFLOW</Badge>
            <h2 className="text-3xl font-bold mb-3">From problem to deliverable in 4 steps</h2>
          </div>

          <div className="space-y-6">
            {[
              { step: 1, title: 'Describe your problem', desc: 'Type what you\'re working on. Example: "Improve school attendance for 2,000 children in rural Kenya."' },
              { step: 2, title: 'Answer a few questions', desc: 'The Supervisor engine asks 2-4 clarifying questions. Skip any — the AI uses public evidence and best assumptions.' },
              { step: 3, title: 'Watch the 9 engines run', desc: 'Live pipeline visualization. Each engine streams its output in real time. Takes 60-90 seconds.' },
              { step: 4, title: 'Get your deliverables', desc: 'Strategy document, Theory of Change flowchart, Logframe table, Evaluation plan. Edit inline, export to Word/PDF/Excel, give feedback for revisions.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                  {item.step}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data ownership callout ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/20 dark:to-rose-950/20 p-8 sm:p-12 text-center">
            <Database className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Your data stays in your database</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
              Connect your own Supabase and your programs, sessions, context blocks, and lessons live in YOUR database.
              HubForge servers never store your data. You can query it, export it, share it — on your terms.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Full data ownership</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Cross-device sync</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Free Supabase tier</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Zero lock-in</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <img src="/hubforge-os-icon.png" alt="HubForge OS" className="h-16 w-16 rounded-xl shadow-lg mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-3">Ready to build your first program?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Free forever. Create an account to save your programs. Works offline as a PWA.
          </p>
          <Button onClick={onLaunch} size="lg" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white h-12 px-10 text-base">
            Launch HubForge OS <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/hubforge-os-icon.png" alt="HubForge OS" className="h-5 w-5 rounded" />
            <span className="font-mono">HubForge OS · Apache-2.0 · Built for NGOs</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/organization" className="hover:text-foreground">Organization</a>
            <a href="/help" className="hover:text-foreground">Help</a>
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
            <a href="/admin" className="hover:text-foreground">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
