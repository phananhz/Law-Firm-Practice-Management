# Staging / UAT runbook

## Local contract smoke

The mock UAT path can run without cloud credentials:

```powershell
$env:NODE_ENV = 'development'
$env:PERSISTENCE_MODE = 'mock'
$env:STORAGE_MODE = 'mock'
$env:JWT_ACCESS_SECRET = 'use-a-local-secret-at-least-32-characters'
$env:QUEUE_INTERNAL_SECRET = 'use-a-local-queue-secret-at-least-32-chars'
npm.cmd run build
npm.cmd run start --workspace=@lpms/api
```

In a second shell, verify `GET /api/v1/health` and
`GET /api/v1/health/ready`, then log in with the local demo account and walk
through `/me`, clients, calendar, organization, search, reports, audit, the
internal reminder source and queue processor. The queue must return
`processed` for the first message and `duplicate` for the same `messageId`.

The same flow is available as a repeatable runner. Keep credentials in the
private shell; the runner never prints passwords, cookies or bearer values:

```powershell
$env:UAT_API_URL = 'http://localhost:3001/api/v1'
$env:UAT_EMAIL = 'lawyer@lpms.vn'
$env:UAT_PASSWORD = 'DemoPassword!2026'
$env:UAT_QUEUE_SECRET = 'local-only-queue-secret-at-least-32-chars'
npm.cmd run uat:smoke
```

When `UAT_QUEUE_SECRET` is present, the runner also asserts queue idempotency
(`processed` then `duplicate`) and rejects a delivery without the shared secret
with HTTP 401.

For staging, replace the URL and use a seeded non-demo account. Omit
`UAT_QUEUE_SECRET` when the queue consumer is not part of that environment.

The 2026-09-29 local run passed all of those checks (HTTP 200 for reads, 201
for login/queue writes and HTTP 401 for the missing queue secret) and the
temporary API process was stopped afterward.

## Staging acceptance gate

Before running a migration or deploying a preview, set the private staging
variables and run the non-secret configuration check:

```powershell
$env:DEPLOY_ENV = 'staging'
npm.cmd run deploy:preflight
```

The checker validates variable presence/shape, secret length, HTTPS processor
URL, Vercel manifests and required serverless routes; it never prints secret
values.

Before marking UAT complete, a private staging shell must provide:

1. Supabase `DATABASE_URL` (pooler) and `DIRECT_URL` (migration connection).
2. `PERSISTENCE_MODE=prisma`, `AUTH_ENCRYPTION_KEY` and a one-time seed admin
   password (`SEED_ADMIN_*`).
3. Private Supabase Storage bucket credentials and `STORAGE_MODE=supabase`.
4. Vercel Queue deployment URL/secret, `CRON_SECRET` and deployed trigger/cron.

Run `prisma migrate deploy`, `prisma db seed`, verify `/health/ready`, then
repeat the smoke flow with a non-demo account. Test restricted matter/document
access with two users, signed Supabase upload/download, notification delivery,
backup restore rehearsal and rollback before production approval. Never paste
these credentials into the repository or frontend variables.
