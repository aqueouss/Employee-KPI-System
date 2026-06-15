# KPI System — Deployment & Operations Runbook

This runbook covers deploying the KPI System to production and operating it day to day.

## 1. Architecture recap

- **App**: Next.js 15 (App Router) deployed on Vercel.
- **Data + Auth**: Supabase (Postgres, Auth, RLS).
- **Daily pipeline**: `POST/GET /api/cron/daily-kpi` computes KPI snapshots, issues warnings, opens termination reviews, and creates reward eligibility. It is **idempotent** and defaults to processing **yesterday**.

## 2. Environment variables

Set these in the hosting provider (Vercel → Project → Settings → Environment Variables) and in `.env.local` for local dev.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS; used by cron + admin user creation. **Never expose to the client.** |
| `CRON_SECRET` | Server only | Bearer token guarding the cron endpoint. Use a long random string. |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical app URL (redirects, links) |

Generate a cron secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. First-time deployment

1. **Database**: apply all migrations in `supabase/migrations/` (001–011) via the Supabase SQL editor or the Supabase MCP `apply_migration` tool, in order.
2. **Auth settings** (Supabase Dashboard → Authentication):
   - Disable public sign-ups (employees are created by an admin).
   - Enable **Leaked password protection**.
   - Set Site URL / redirect URLs to your production domain.
3. **Bootstrap the first admin**:
   - Create the user in Supabase Auth (or via the app once an admin exists).
   - Promote them: `update public.profiles set role = 'admin' where email = 'you@company.com';`
4. **Deploy to Vercel**: import the repo, set the env vars above, deploy.
5. **Schedule the cron** — pick ONE:
   - **Vercel Cron** (default): `vercel.json` already schedules `/api/cron/daily-kpi` at `30 0 * * *` (UTC). Vercel automatically sends `Authorization: Bearer $CRON_SECRET`, so just ensure `CRON_SECRET` is set.
   - **Supabase pg_cron**: copy `supabase/migrations/012_cron_schedule.sql.example` → `012_cron_schedule.sql`, fill in values (Vault recommended), and apply. Do **not** also use Vercel Cron.
6. **Verify**: run the smoke test (section 5).

## 4. The daily pipeline

- **Schedule**: 00:30 UTC daily (adjust the cron expression for your company timezone needs).
- **What it does** for the target date (default yesterday):
  1. Computes each active employee's completion % and KPI flag → upserts `daily_kpi_snapshots`.
  2. On a red flag: re-evaluates that month and issues a warning if the red-flag threshold is met (idempotent per month).
  3. On a new warning: re-evaluates the rolling window and opens a termination review if the warning threshold is met.
  4. On a green flag: re-evaluates the green streak and creates reward eligibility if the streak threshold is met (idempotent).
- **Output**: a `cron.daily_kpi` row in `audit_logs` with counts. Visible in the app at **Admin → Activity**.

### Manual / backfill run

Reprocess a specific date (safe — idempotent):

```bash
curl -X POST "$APP_URL/api/cron/daily-kpi" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"kpi_date":"2026-06-14"}'
```

To backfill a range, loop over dates calling the above for each day in chronological order (so streaks/warnings build correctly).

## 5. Smoke test

After every deploy:

```bash
BASE_URL=https://your-app.vercel.app CRON_SECRET=xxx npm run smoke
# include a live pipeline run:
BASE_URL=https://your-app.vercel.app CRON_SECRET=xxx RUN_PIPELINE=1 npm run smoke
```

Checks: health endpoint, cron rejects a bad secret (401), and (optionally) the pipeline runs successfully.

## 6. Monitoring & observability

- **Activity log**: Admin → Activity surfaces the last 100 events (admin actions + `cron.daily_kpi` runs). If you don't see a `cron.daily_kpi` entry shortly after 00:30 UTC, the job didn't run.
- **Vercel**: Project → Cron Jobs shows last run + status; Logs show the invocation.
- **pg_cron**: `select * from cron.job_run_details order by start_time desc limit 20;`
- **Supabase Advisors**: re-run the security/performance advisors after schema changes.

## 7. Common incidents

| Symptom | Likely cause | Fix |
|---|---|---|
| Cron returns 401 | `CRON_SECRET` unset or placeholder; missing/incorrect Authorization header | Set a real `CRON_SECRET`; for Vercel Cron just set the env var and redeploy |
| Cron returns 503 | `SUPABASE_SERVICE_ROLE_KEY` missing | Set the service role key in server env |
| No snapshots for yesterday | Cron didn't fire, or all employees inactive | Check Activity log / Vercel cron logs; run manual backfill |
| Admin can't create employees | Service role key missing/invalid | Verify `SUPABASE_SERVICE_ROLE_KEY` |
| Duplicate warnings/rewards | Two schedulers enabled | Use either Vercel Cron OR pg_cron, not both (engine is idempotent so impact is limited) |
| Login works but redirect loops | Profile row missing for the auth user | Ensure `handle_new_user` trigger exists; insert the missing `profiles` row |

## 8. Changing KPI rules

- Edit at **Admin → KPI Rules**. Saving increments the rules **version**.
- Changes apply to **future** pipeline runs only; historical snapshots keep the version they were computed under.
- To re-score history under new rules, run a backfill (section 4) for the affected dates.

## 9. Backups & data retention

- Supabase provides automated daily backups (plan-dependent). Confirm your backup cadence in the Supabase Dashboard.
- `audit_logs` grows over time; consider a periodic archival/retention policy if needed.

## 10. Rollback

- **App**: redeploy the previous Vercel deployment (instant rollback).
- **Database**: migrations are forward-only. Take a backup before applying new migrations; restore from backup if a migration must be reverted.
