# HubForge OS - Deployment Guide

> How to deploy HubForge OS to Vercel with GitHub + Supabase, set up automatic
> deployments on every push, and manage environment variables.

---

## Architecture

```
GitHub repo (your code)
       |
       | push to main
       v
   Vercel (auto-builds + deploys)
       |
       | reads env vars
       v
   Supabase (platform database - optional)
       |
       | user connects their own
       v
   User's Supabase (their data, their database)
```

- **GitHub** = source of truth (your code lives here)
- **Vercel** = hosting (builds + serves the app + runs the API routes)
- **Supabase (platform)** = optional, for platform-level analytics + admin dashboard
- **Supabase (user-owned)** = each NGO connects their own for their data

---

## Step 1: Push your code to GitHub

### 1.1 Create a GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `hubforge-os`
3. Set to **Public** (it's open-source, Apache-2.0)
4. **Do NOT** initialize with README/license/gitignore (you already have them)
5. Click **Create repository**

### 1.2 Connect your local code to GitHub

Run these commands in your terminal (replace `YOUR_USERNAME`):

```bash
cd /home/z/my-project

# Add your GitHub repo as the remote
git remote add origin https://github.com/YOUR_USERNAME/hubforge-os.git

# Push everything to GitHub
git add -A
git commit -m "HubForge OS v0.3 - initial deploy"
git branch -M main
git push -u origin main
```

When it asks for credentials, use a **Personal Access Token** (GitHub Settings > Developer settings > Personal access tokens > Generate new token with `repo` scope).

### 1.3 Verify

Go to `https://github.com/YOUR_USERNAME/hubforge-os` - you should see all your files. Confirm `.env` is NOT there (it's in `.gitignore`).

---

## Step 2: Set up Supabase (platform database - optional but recommended)

This is for platform-level analytics and the admin dashboard. Users will connect their OWN Supabase separately via the Data Storage dialog.

### 2.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) > **New Project**
2. Name: `hubforge-platform`
3. Database password: generate a strong one, **save it**
4. Region: closest to your users
5. Click **Create** (takes ~2 minutes)

### 2.2 Create the tables

1. In your Supabase dashboard, go to **SQL Editor** > **New Query**
2. Copy the entire contents of `supabase-schema.sql` from your repo
3. Paste + **Run**

This creates: `reasoning_sessions`, `user_profiles`, `analytics_events`, `programs`, `context_blocks`, `lessons`, `indicators` (with indexes + RLS policies).

### 2.3 Get your credentials

In Supabase dashboard > **Settings** > **API**:
- **Project URL**: `https://xxxxx.supabase.co`
- **service_role key**: the long `eyJ...` key (NOT the anon key)

Save both - you'll add them to Vercel in Step 3.

---

## Step 3: Deploy to Vercel

### 3.1 Import the project

1. Go to [vercel.com](https://vercel.com) > **Add New** > **Project**
2. Import your `hubforge-os` GitHub repo
3. Vercel auto-detects Next.js - keep defaults:
   - Framework: **Next.js**
   - Build command: `next build` (auto-detected)
   - Output: standalone (auto-detected from `next.config.ts`)

### 3.2 Add environment variables

In the Vercel setup screen, expand **Environment Variables** and add:

| Key | Value | Required? |
|-----|-------|-----------|
| `HUBFORGE_ADMIN_KEY` | Run `openssl rand -hex 32` to generate | **YES** (admin dashboard won't work without it) |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` (from Step 2.3) | Optional (platform analytics) |
| `SUPABASE_SERVICE_KEY` | `eyJ...` service_role key (from Step 2.3) | Optional (platform analytics) |

**Important:** Check all 3 environments (Production, Preview, Development) for each variable.

### 3.3 Deploy

Click **Deploy**. Vercel will:
1. Clone your repo
2. Run `bun install` + `next build`
3. Deploy to a `*.vercel.app` URL

This takes 2-3 minutes. When done, you'll get a live URL like `hubforge-os.vercel.app`.

### 3.4 Add a custom domain (optional)

Vercel > your project > **Settings** > **Domains** > add `hubforge-os.dev` (or whatever you own). Vercel handles SSL automatically.

---

## Step 4: Automatic deployments (the "Claude Code" flow)

This is the magic part. Once GitHub is connected to Vercel, **every push to `main` automatically triggers a new deployment**. No manual steps needed.

### How it works

```
You edit code locally
  > git add -A && git commit -m "fix: improved monitoring tracker"
  > git push origin main
      |
      v
GitHub receives the push
  > Sends webhook to Vercel
      |
      v
Vercel auto-builds
  > Runs `next build`
  > Deploys to production URL
      |
      v
Live in ~90 seconds
```

### The daily workflow

```bash
# Make your changes...
# Then:
git add -A
git commit -m "what you changed"
git push

# Done. Vercel deploys automatically.
```

You can watch the build at `vercel.com > your project > Deployments`.

### Preview deployments for branches

If you push to a branch (not main), Vercel creates a **preview deployment** at a unique URL. This lets you test before merging to production:

```bash
git checkout -b feature/new-ui
# make changes...
git push origin feature/new-ui
# Vercel deploys to https://hubforge-os-git-feature-new-ui.vercel.app
```

---

## Step 5: Post-deploy checklist

After your first deploy, verify these work:

- [ ] Visit `https://your-app.vercel.app` - landing page loads
- [ ] Click "Launch App" - signup dialog opens
- [ ] Create an account - dashboard loads
- [ ] Go to `/admin` - enter your `HUBFORGE_ADMIN_KEY` - analytics load
- [ ] Open Settings (Cmd+K) - provider picker works
- [ ] Click "Connect Database" in Cmd+K - Supabase dialog works
- [ ] Try a template (e.g. "Foundation Literacy") - program created instantly
- [ ] On mobile - header collapses, no overflow

---

## Environment variables reference

| Variable | Where to get it | What it does |
|----------|----------------|--------------|
| `HUBFORGE_ADMIN_KEY` | `openssl rand -hex 32` | Protects `/admin` dashboard |
| `SUPABASE_URL` | Supabase dashboard > Settings > API | Platform database URL |
| `SUPABASE_SERVICE_KEY` | Supabase dashboard > Settings > API | Platform database service key |
| `SUPABASE_DB_URL` | Supabase dashboard > Settings > Database > Transaction pooler | Direct Postgres connection (optional, for future features) |
| `HUBFORGE_ALLOWED_ORIGINS` | Comma-separated Supabase URLs | Allow-list for user-connected Supabase URLs (optional, defaults to `*.supabase.co`) |

**User-side variables (not in Vercel - set by users in their browser):**
- API keys (OpenAI, Anthropic, etc.) - stored in localStorage, sent directly to provider
- User's own Supabase URL + anon key - stored in localStorage, sent to user's Supabase

---

## Troubleshooting

### Build fails on Vercel
1. Check Vercel build logs (Deployments > click the failed build)
2. Common causes:
   - Missing env var (check `HUBFORGE_ADMIN_KEY` is set)
   - TypeScript error (run `bunx tsc --noEmit` locally)
   - Out of memory (Vercel Hobby plan has 4GB limit - upgrade to Pro if needed)

### Admin dashboard returns 403
`HUBFORGE_ADMIN_KEY` is not set in Vercel env vars, or you're entering the wrong key.

### Analytics not showing
`SUPABASE_URL` or `SUPABASE_SERVICE_KEY` not set, or the Supabase tables weren't created (run `supabase-schema.sql`).

### "Module not found: fs/promises"
This was a build error caused by `z-ai-web-dev-sdk` in the browser bundle. It's fixed (prompt metadata extracted to `engine-prompts.ts`). If it recurs, check that no client component imports from `engines.ts` directly - use `engine-prompts.ts` instead.

### Need to update env vars after deploy
Vercel > Settings > Environment Variables > edit > **Redeploy** (Deployments > click the latest > Redeploy).

---

## Cost

| Service | Free tier | When you'd pay |
|---------|-----------|----------------|
| **GitHub** | Free (public repos) | Never (public is free) |
| **Vercel** | Free (Hobby: 100GB bandwidth, 1000 builds/month) | Pro ($20/mo) when you need >60s function timeout or team features |
| **Supabase** | Free (500MB DB, 50k users) | Pro ($25/mo) when you need >500MB or daily backups |
| **Total at launch** | **$0/month** | |

---

## Quick reference: the 3 commands you'll use daily

```bash
# 1. Push changes (auto-deploys to Vercel)
git add -A && git commit -m "your message" && git push

# 2. Check deploy status
# Go to: vercel.com > your project > Deployments

# 3. Check logs if something's broken
# Go to: vercel.com > your project > Logs
```

That's it. Push to GitHub = live in 90 seconds.
