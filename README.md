# Masters Pool 2026

Live-updating **Masters fantasy pool** leaderboard for six teams and forty-eight players. Built with **Next.js 15** (App Router, React 19, TypeScript), **Tailwind CSS**, **Supabase** (Postgres + Realtime), and **shadcn-style** UI primitives. Deployed on **Vercel**.

- **Public home (`/`)** — live board, realtime updates, **Sync scores** (PGA fetch + DB write, rate-limited), **Reload board** (re-read Supabase only).
- **Admin (`/admin`)** — password-only; seed edits and “Force update scores”.

Data source (unofficial, public): PGA Tour `statdata.pgatour.com` JSON (`message.json` → tournament id → `leaderboard-v2mini.json` / `leaderboard-v2.json`).

## Why not Vercel Cron on Hobby?

Vercel **Hobby** plans only allow **daily** cron schedules. This project uses **GitHub Actions** on a `*/5 * * * *` schedule to `POST` your production `/api/update-scores` with `CRON_SECRET` instead (see [`.github/workflows/sync-scores.yml`](./.github/workflows/sync-scores.yml)).

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier)
- A [Vercel](https://vercel.com) account (hosting)
- Optional: [GitHub](https://github.com) repo with Actions enabled for automated sync

## 1. Supabase setup

1. Create a project → **SQL Editor** → run [`supabase/schema.sql`](./supabase/schema.sql) (tables, RLS, seed teams + 48 players, `app_settings` for public sync cooldown).

   If you already ran an older schema without `app_settings`, run [`supabase/migration-app-settings.sql`](./supabase/migration-app-settings.sql).

2. **Realtime** — **Database → Replication**: enable `teams` and `pool_players`.

3. **API keys** — **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` public key  
   - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key (server-only; never commit)

## 2. Local environment

Copy [`.env.example`](./.env.example) to `.env.local`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; upserts scores |
| `CRON_SECRET` | Shared secret for `/api/update-scores` (GitHub Actions + optional lockdown) |
| `PUBLIC_SCORE_SYNC_ENABLED` | Set to `false` to disable the public **Sync scores** button API |
| `PUBLIC_SYNC_COOLDOWN_SECONDS` | Seconds between public syncs (default `300`) |
| `ADMIN_PASSWORD` | `/admin` login |
| `ADMIN_SESSION_SECRET` | Signs admin cookie |

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin: [http://localhost:3000/admin](http://localhost:3000/admin).

With `CRON_SECRET` unset, **development** allows unauthenticated `POST /api/update-scores` for convenience.

## 4. Score update routes

| Route | Purpose |
|-------|---------|
| `POST /api/update-scores` | PGA fetch + Supabase upsert. Requires `Authorization: Bearer <CRON_SECRET>`, **or** admin session cookie, **or** (dev only) no secret if `CRON_SECRET` unset |
| `POST /api/public-scores-sync` | Same pipeline, **no secret**; **rate-limited** via `app_settings.last_public_sync`. Disable with `PUBLIC_SCORE_SYNC_ENABLED=false` |

Response JSON includes `ok`, `message`, and optional `tournamentId`, `playersUpdated`, `teamsUpdated`, `retryAfterSeconds` (HTTP 429).

## 5. GitHub Actions (recommended for auto sync)

1. In the GitHub repo: **Settings → Secrets and variables → Actions**, add:
   - **`PRODUCTION_URL`** — your live site root, e.g. `https://your-app.vercel.app` (no trailing slash)
   - **`CRON_SECRET`** — **must match** `CRON_SECRET` in Vercel env

2. The workflow [`.github/workflows/sync-scores.yml`](./.github/workflows/sync-scores.yml) runs every **5 minutes** and calls `POST /api/update-scores` with the Bearer token.

3. Adjust or disable the schedule in the workflow file if you want fewer runs.

## 6. Vercel deployment

1. Import the repo → set env vars (`CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_*`, etc.).

2. Redeploy after changing env vars.

3. No `vercel.json` cron is required for this setup.

## 7. Seeding / editing data

- **Initial seed** — run `supabase/schema.sql` once.
- **Edits** — `/admin` → adjust `pool_players` (unique `full_name`).

## 8. Project layout

- `app/page.tsx` — live board
- `app/api/update-scores/route.ts` — secured PGA sync
- `app/api/public-scores-sync/route.ts` — public rate-limited sync
- `lib/update-scores.ts` — shared sync logic + cooldown helpers
- `lib/pga.ts` — PGA JSON parsing

## Disclaimer

For fun only. Not affiliated with Augusta National, the Masters Tournament, or the PGA Tour. Leaderboard data comes from public PGA Tour JSON endpoints and may be delayed or unavailable outside tournament hours.
