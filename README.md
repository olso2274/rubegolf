# Masters Pool 2026

Live-updating **Masters fantasy pool** leaderboard for six teams and forty-eight players. Built with **Next.js 15** (App Router, React 19, TypeScript), **Tailwind CSS**, **Supabase** (Postgres + Realtime), and **shadcn-style** UI primitives. Deployed on **Vercel**.

- **Public home (`/`)** — live board, realtime updates, **Sync scores** (PGA fetch + DB write, rate-limited), **Reload board** (re-read Supabase only).
- **Admin (`/admin`)** — password-only; seed edits and “Force update scores”.

Data source (unofficial, public): PGA Tour `statdata.pgatour.com` JSON for the 2026 Masters (`R2026014` / `2026014`) with a fallback to the Masters tournament page on `pgatour.com`.

### Team scoring (best 4 of 8)

Each team has **8** roster players. **Team total to par** is the sum of the **4 best** (lowest) individual **total to par** values among those eight — the other four do not count toward the team score. Teams are **ranked by that combined total** (lowest / best first). Each player row still shows that golfer’s real tournament numbers from the leaderboard feed.

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

### How GitHub and Supabase connect (read this)

- **Supabase credentials live only on the server:** your **Vercel** project env (and local **`.env.local`**). **Do not** commit Supabase keys to GitHub or paste them into Actions as plain text.
- **GitHub Actions does not talk to Supabase directly.** The workflow only sends an HTTP request to **your deployed app** (`PRODUCTION_URL`). That app already has `SUPABASE_SERVICE_ROLE_KEY` and runs the PGA → Supabase update on the server.
- So: **GitHub → Vercel URL + `CRON_SECRET` → your Next.js API → Supabase.** Connecting the repo to Supabase means wiring **Vercel** with Supabase env vars; GitHub only needs the two secrets below for the cron ping.

### Optional: Supabase Dashboard → GitHub

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings → Integrations**, you can **link your GitHub repo** for features like migration previews or CI. That is separate from the score-sync workflow and is optional.

### Secrets to add on GitHub

1. Repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - **`PRODUCTION_URL`** — your live site root, e.g. `https://your-app.vercel.app` (no trailing slash)
   - **`CRON_SECRET`** — **exactly the same** value as `CRON_SECRET` in **Vercel** (and in `.env.local` if you use one)

2. **Actions** tab → confirm workflows are allowed for this repo (not disabled for forks).

3. The workflow [`.github/workflows/sync-scores.yml`](./.github/workflows/sync-scores.yml) runs every **5 minutes** and calls `POST /api/update-scores` with `Authorization: Bearer <CRON_SECRET>`.

4. Adjust or disable the schedule in the workflow file if you want fewer runs.

## 6. Vercel deployment

1. Import the repo → set env vars (`CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_*`, etc.).

2. Redeploy after changing env vars.

3. No `vercel.json` cron is required for this setup.

## 7. Seeding / editing data

- **Initial seed** — run `supabase/schema.sql` once (creates tables + `INSERT` rosters).
- **Populate / reset rosters only** — run [`supabase/seed-rosters.sql`](./supabase/seed-rosters.sql) in the SQL Editor (deletes `pool_players` then inserts 48 names).
- **Optional** — if `pool_players` still has a `pick_number` column from an older deploy, run [`supabase/migration-drop-pick-number.sql`](./supabase/migration-drop-pick-number.sql) once.
- **Edits** — `/admin` → adjust `pool_players` (unique `full_name`).

## 8. Project layout

- `app/page.tsx` — live board
- `app/api/update-scores/route.ts` — secured PGA sync
- `app/api/public-scores-sync/route.ts` — public rate-limited sync
- `lib/update-scores.ts` — shared sync logic + cooldown helpers
- `lib/pga.ts` — PGA JSON parsing

## Disclaimer

For fun only. Not affiliated with Augusta National, the Masters Tournament, or the PGA Tour. Leaderboard data comes from public PGA Tour JSON endpoints and may be delayed or unavailable outside tournament hours.
