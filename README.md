# Masters Pool 2026

Live-updating **Masters fantasy pool** leaderboard for six teams and forty-eight players. Built with **Next.js 15** (App Router, React 19, TypeScript), **Tailwind CSS**, **Supabase** (Postgres + Realtime), and **shadcn-style** UI primitives. Deployed on **Vercel** with a **cron job** that refreshes PGA Tour scores.

- **Public home (`/`)** — live board, realtime updates, no login.
- **Admin (`/admin`)** — password-only; seed edits and “Force update scores” (not for public sharing).

Data source (unofficial, public): PGA Tour `statdata.pgatour.com` JSON (`message.json` → tournament id → `leaderboard-v2mini.json` / `leaderboard-v2.json`).

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier)
- A [Vercel](https://vercel.com) account (optional, for deployment + cron)

## 1. Supabase setup

1. Create a project → **SQL Editor** → run the contents of [`supabase/schema.sql`](./supabase/schema.sql) (creates tables, RLS read policies, seed teams + 48 players).

2. **Realtime** — In Supabase Dashboard: **Database → Replication**, enable replication for `teams` and `pool_players` (so browser subscriptions receive changes).

3. **API keys** — **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` public key  
   - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key (server-only; never commit)

## 2. Local environment

Copy [`.env.example`](./.env.example) to `.env.local` and fill values:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS: read-only on tables) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; used by `/api/update-scores` to upsert scores |
| `CRON_SECRET` | Optional locally; **required in production** if you want secured cron + admin-only manual triggers without opening the route |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `ADMIN_SESSION_SECRET` | Long random string; used to sign the admin session cookie |

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin: [http://localhost:3000/admin](http://localhost:3000/admin).

**Force refresh scores** from the admin page, or call the API (see below).

## 4. Update scores API

- **GET or POST** `/api/update-scores`
- **Authorized** if any of:
  - `Authorization: Bearer <CRON_SECRET>` (Vercel Cron when `CRON_SECRET` is set)
  - Valid admin session cookie (after logging in at `/admin`)
  - **Development only**: if `CRON_SECRET` is unset, unauthenticated calls are allowed for convenience

Response JSON includes `ok`, `message`, and optional `tournamentId`, `playersUpdated`, `teamsUpdated`.

## 5. Vercel deployment

1. Import the repo → add the same env vars (including `CRON_SECRET`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`).

2. **Cron** — [`vercel.json`](./vercel.json) schedules `GET /api/update-scores` every **5 minutes**. In Vercel, set `CRON_SECRET`; Vercel sends `Authorization: Bearer <CRON_SECRET>` to the cron route.

3. Redeploy after changing env vars.

Tournament window (April 9–12, 2026 UTC) is informational; the cron schedule is `*/5 * * * *` unless you change it in `vercel.json`.

## 6. Seeding / editing data

- **Initial seed** — run `supabase/schema.sql` once.
- **Edits** — use `/admin` (logged in) to adjust `pool_players` rows (team, pick #, full name). Inserts require a unique `full_name`.

## 7. Project layout

- `app/page.tsx` — live board (server fetch + client realtime)
- `app/admin/page.tsx` — admin shell
- `app/api/update-scores/route.ts` — PGA fetch + Supabase upsert
- `lib/pga.ts` — tournament id + leaderboard parsing
- `lib/normalize.ts` — name normalization + optional overrides
- `components/` — UI (tables, dialog, live indicator)

## Disclaimer

For fun only. Not affiliated with Augusta National, the Masters Tournament, or the PGA Tour. Leaderboard data comes from public PGA Tour JSON endpoints and may be delayed or unavailable outside tournament hours.
