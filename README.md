# Legal Practice Management System (LPMS)

LPMS is a matter-centric internal web application for legal-practice operations. `require.md` is the canonical requirements document.

## Foundation services

- `apps/web`: Next.js App Router frontend on port 3000
- `apps/api`: NestJS REST API on port 3001 (`/api/v1`)
- Supabase PostgreSQL 16 via Prisma
- Supabase Storage for private documents (Cloudflare R2 remains an optional adapter)
- Vercel Queues for asynchronous jobs

## Local setup

1. Copy `.env.example` to `.env`. The default `PERSISTENCE_MODE=mock` runs
   without a database; set `DATABASE_URL`, `DIRECT_URL` and
   `PERSISTENCE_MODE=prisma` only for an isolated Supabase staging database.
   Prisma mode also requires a separate `AUTH_ENCRYPTION_KEY` for MFA secrets.
2. Run `npm install`.
3. Run `npm run dev`.

Health checks: `http://localhost:3000` and `http://localhost:3001/api/v1/health`.
For Prisma mode also verify `/api/v1/health/ready`. Queue deployment requires
`QUEUE_PROCESSOR_URL` and `QUEUE_INTERNAL_SECRET` on both Vercel and the API.

Production deploys `apps/web` and the `apps/api` Vercel serverless entrypoint,
uses Supabase PostgreSQL, Supabase Storage, and Vercel Queues. No production data
or credentials belong in this repository. The web project also needs
`CRON_SECRET` for the daily deadline-reminder producer.

To create the first staging administrator, provide `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD` and optionally `SEED_ADMIN_NAME` only while running
`npm run db:seed --workspace=@lpms/api`; the seed does not contain a default
password.

Before staging/production migration or deployment, run
`npm run deploy:preflight` from a private shell. It validates configuration
shape without printing secret values.
