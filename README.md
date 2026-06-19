# HubForge OS - Social Impact Pack

> Build expert-grade program strategies, theories of change, and logframes in minutes.
> For NGOs and social impact organizations - no M&E expertise needed.

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/hubforge-os.git
cd hubforge-os
bun install
bun run dev
```
Open http://localhost:3000

## Deploy

1. Push to GitHub
2. Go to vercel.com -> Import repo -> Deploy
3. (Optional) Add Supabase env vars for persistent memory

Cost: $0/month on free tiers.

## AI providers

| Provider | Cost | Setup |
|----------|------|-------|
| Z.ai (shared) | Free | None |
| Z.ai (own key) | Free | Get key at z.ai/manage/apikey |
| Groq | Free tier | Get key at console.groq.com/keys |
| OpenAI | ~$0.01/strategy | Get key at platform.openai.com |
| Local (Ollama) | Free forever | Install ollama.com |

## Architecture

- Frontend: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- API: Next.js API Routes (serverless)
- AI: Z.ai SDK (default) or any OpenAI-compatible provider
- Storage: localStorage (default) or Supabase (optional)
- PWA: Installable from browser, works offline

## License

Apache-2.0
