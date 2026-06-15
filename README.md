# KPI System

Internal KPI and Performance Management System built with Next.js 15, Supabase, and Shadcn UI.

## Features

- Role-based auth (admin / employee) with Supabase Auth + RLS
- Date-based task management with daily completion tracking
- KPI engine: daily completion %, green/yellow/red flags, historical snapshots
- Warning engine: monthly red-flag warnings + rolling termination reviews
- Reward engine: consecutive green-streak reward eligibility
- Admin: employee directory + drill-down, KPI rules editor (versioned), warnings, termination reviews, rewards fulfillment, and an activity/audit log
- Automated daily pipeline via cron (Vercel Cron or Supabase pg_cron)

## Prerequisites

- Node.js 20+
- A Supabase project (cloud or local via Supabase CLI)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your Supabase URL and keys from the [Supabase Dashboard](https://supabase.com/dashboard).

3. **Apply database migrations**

   **Option A — Supabase Dashboard:** Run each file in `supabase/migrations/` in order (001 → 010) in the SQL Editor.

   **Option B — Supabase CLI:**

   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

4. **Bootstrap the first admin**

   - In Supabase Dashboard → Authentication → Users, create a user (signup is disabled by default in `config.toml`; enable temporarily or use Dashboard).
   - In SQL Editor:

     ```sql
     UPDATE public.profiles
     SET role = 'admin', full_name = 'System Admin'
     WHERE email = 'admin@company.com';
     ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Run engine unit tests (`node:test`) |
| `npm run smoke` | Post-deploy smoke test (set `BASE_URL`, `CRON_SECRET`) |
| `npm run db:types` | Regenerate types from local Supabase |

## Health check

`GET /api/health` — returns DB connectivity status.

## Daily pipeline (cron)

`POST /api/cron/daily-kpi` runs the KPI → warning → reward pipeline for a given
date (defaults to yesterday). It is idempotent and guarded by `CRON_SECRET`.

- **Vercel Cron** (default): scheduled in `vercel.json` at `30 0 * * *` UTC.
  Vercel auto-sends `Authorization: Bearer $CRON_SECRET`.
- **Supabase pg_cron** (alternative): see
  `supabase/migrations/012_cron_schedule.sql.example`.

Manual/backfill run:

```bash
curl -X POST "$APP_URL/api/cron/daily-kpi" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"kpi_date":"2026-06-14"}'
```

## Deployment

See **[docs/RUNBOOK.md](docs/RUNBOOK.md)** for the full deployment and operations
guide (env vars, first-time setup, cron scheduling, monitoring, incident
playbook, rollback).

## Project structure

```
app/           Next.js App Router pages and API routes
components/    UI components (Shadcn)
lib/           Supabase clients, auth helpers
actions/       Server Actions
services/      Domain services (Phase 3+)
supabase/      Migrations and config
types/         Database and domain types
```

## Roadmap

See the technical specification for Phases 1–8. Phase 1 completes auth polish; Phase 2 adds task management.
