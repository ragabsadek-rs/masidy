# Masidy — Describe it. We build it.

AI-powered app builder. Type what you want. Masidy writes the code, sets up the database, deploys it live — and hands you the URL.

## Stack

- **Framework:** Next.js 16 (App Router)
- **AI:** Anthropic Claude (Haiku / Sonnet / Opus)
- **Infrastructure:** Vercel
- **Auth & DB:** Supabase
- **Payments:** Stripe
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Editor:** Monaco Editor

## Getting Started

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
# Fill in your keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.example` for all required keys.

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `VERCEL_ACCESS_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_TEAM_ID` | Vercel → Team Settings → General |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project → Settings → API |
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → your endpoint |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/dashboard` | Project overview |
| `/builder` | AI IDE — chat + code editor + live preview |
| `/api/builder/chat` | Claude API proxy |
