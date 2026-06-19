# HubForge OS - Social Impact Pack

> Build expert-grade program strategies, theories of change, and logframes in minutes.
> For NGOs and social impact organizations - no M&E expertise needed.

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![PWA](https://img.shields.io/badge/PWA-installable-purple.svg)](#pwa)

---

## What is HubForge OS?

An open-source **MEL (Monitoring, Evaluation & Learning) operating system** that helps NGO program officers build fundable strategies, theories of change, logframes, and evaluation plans - without needing a monitoring & evaluation specialist on staff.

Under the hood runs a **9-engine recursive reasoning pipeline** (Supervisor → Retrieval → Web Search → Rule → Reasoning → Critique → Improvement → Evaluation → Structure) grounded in a Social Impact knowledge graph (6 frameworks, 5 decision rules, 5 evidence sources, 3 historical cases).

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/hubforge-os.git
cd hubforge-os
bun install
bun run dev
```

Open the app via the **Preview Panel** (or `http://localhost:3000` locally).

> The app works immediately with **zero configuration** - Z.ai's free shared key is used by default.

## Two modes

| Mode | Who it's for | What it does |
|------|--------------|--------------|
| **General Mode** (default) | NGO program officers | Guided wizard: describe project → answer clarifying questions → get strategy + ToC diagram + logframe table → give feedback → get revised version |
| **Geek Mode** | Developers / AI engineers | Full 9-engine pipeline visualization, per-engine provider config, prompt inspection, model comparison, knowledge graph browser |

## AI providers (bring your own key - or use ours)

| Provider | Cost | Setup |
|----------|------|-------|
| **Z.ai (shared)** | Free | None - works out of the box |
| **Z.ai (own key)** | Free | Get key at z.ai/manage/apikey |
| **Groq** | Free tier | Get key at console.groq.com/keys |
| **Google Gemini** | Free tier | Get key at aistudio.google.com |
| **OpenAI** | ~$0.01/strategy | Get key at platform.openai.com |
| **Anthropic Claude** | ~$0.03/strategy | Get key at console.anthropic.com |
| **Local (Ollama)** | Free forever | Install ollama.com |

> **Your keys never leave your browser.** They're stored in `localStorage` and sent directly to the provider. HubForge servers never see them.

## Data ownership - connect your own Supabase (NEW)

By default, your data (programs, sessions, context blocks) lives in your browser's `localStorage`. That's fine for trying things out, but it's lost if you clear your browser.

**Connect your own Supabase** for true data ownership:

1. Create a free project at [supabase.com](https://supabase.com) (500 MB, 50k users free forever)
2. Open **Data** → paste your Project URL + anon key
3. Click **Show SQL setup script** → copy → run in your Supabase SQL editor
4. Done. Your programs, sessions, context blocks, profile, analytics, and lessons now live in **YOUR** database.

**What this gives you:**
- ✅ Full data ownership - your data never touches HubForge servers
- ✅ Cross-device sync - your programs appear on any browser you sign into
- ✅ Direct query access - run SQL against your own data anytime
- ✅ Export, share, or delete your data on your terms

> The Supabase **anon key** is designed to be public (Row Level Security protects data). It's stored in your browser and sent directly to YOUR Supabase - never to HubForge servers.

## Architecture

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **API**: Next.js API Routes (serverless, no persistent connections)
- **AI**: Z.ai SDK (default) or any OpenAI-compatible provider
- **Storage**: `localStorage` (default) → user's own Supabase (optional) → platform Supabase (optional) → in-memory fallback
- **PWA**: Installable from browser, works offline

## Deploy

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repo → Deploy
3. (Optional) Add `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` env vars for platform-level analytics + server-side auth
4. (Optional but recommended) Set `HUBFORGE_ADMIN_KEY` to a long random string to enable the `/admin` dashboard. **If unset, `/admin` returns 403 - there is no insecure default.**
5. (Optional) Set `HUBFORGE_ALLOWED_ORIGINS` (comma-separated) only if users need to connect to self-hosted Supabase instances not on `*.supabase.co`.

Cost: **$0/month** on free tiers.

## Features

- **9-engine recursive reasoning pipeline** - Supervisor → Retrieval → Web Search → Rule → Reasoning → Critique → Improvement → Evaluation → Structure, with quality threshold + iterative improvement.
- **Identity & auth layer** - email + PBKDF2-hashed password, GDPR/DPDP consent record, right-to-export, right-to-be-forgotten. Anonymous users see the landing page only; "Launch App" opens signup.
- **7 AI providers** - shared Z.ai (free, rate-limited) or bring your own key (OpenAI, Anthropic, Gemini, Groq, Z.ai own key, local Ollama). User API keys never touch HubForge servers - they go from the browser directly to the provider.
- **Program workspaces** - save/resume multiple programs, tag by donor / geography / sector / budget, sync to your own Supabase.
- **Templates** - 5 offline-capable program templates (FLN, school feeding, water rehab, climate-smart ag, MCH) that create a 90% complete program in <1 second with no AI.
- **Monitoring tracker** - derive indicators from logframe OVIs, add readings over time, RAG (Red/Amber/Green) status computed automatically, next-due-date scheduling.
- **Public API v1** - `POST /api/v1/reason`, `POST /api/v1/structure`, `GET /api/v1/knowledge`, `GET /api/v1/packs`, `GET /api/v1/health`. Third parties can call HubForge's 9-engine kernel programmatically.
- **Smart caching** - interview, retrieval, web search, and structure results are cached in `localStorage` for 24h–7d. Reasoning / critique / improvement / evaluation are always fresh.
- **Admin dashboard** - `/admin` shows analytics (DAU, conversion funnel, provider usage, quality distribution, recent errors) gated by `HUBFORGE_ADMIN_KEY`.
- **PWA** - installable, offline-capable (templates + monitoring + editing + export all work without AI or internet).

## Documentation

| Document | What's in it |
|----------|--------------|
| [**DEVELOPER.md**](DEVELOPER.md) | Complete developer guide: architecture, API reference, library reference, security model, how to extend |
| [**AUDIT-REPORT.md**](AUDIT-REPORT.md) | Deployment readiness audit, security review, known issues |
| [**UX-REDESIGN.md**](UX-REDESIGN.md) | The Jobsian redesign rationale (General Mode) |
| [**FREE-TIER-VISION.md**](FREE-TIER-VISION.md) | Product vision for zero-budget NGOs |
| [**MEL-LIFECYCLE-VISION.md**](MEL-LIFECYCLE-VISION.md) | Roadmap: one workspace for the full MEL lifecycle |
| [**FUTURISTIC-VISION.md**](FUTURISTIC-VISION.md) | 2025-2030 north star |
| [**PRODUCT-GAP-ANALYSIS.md**](PRODUCT-GAP-ANALYSIS.md) | Competitive gap analysis |
| [**plan.md**](plan.md) | Original project plan synthesized from the 6 source PDFs |

## PWA

Install HubForge OS on your phone or desktop:
- **Desktop Chrome/Edge**: click the install icon in the address bar
- **Mobile Chrome/Safari**: "Add to Home Screen" from the browser menu

Works offline (app shell cached by service worker). AI calls require connectivity.

## License

[Apache-2.0](LICENSE) - free for commercial and non-commercial use.

## Contributing

PRs welcome. See [DEVELOPER.md](DEVELOPER.md) for architecture and extension points.
