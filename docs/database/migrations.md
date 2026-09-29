# Database migration workflow

The API currently runs with mock repositories by default. The Prisma schema and
the first migration establish the authentication foundation for the persistence
phase without forcing a local developer to have Supabase credentials.

## Environment split

- `DATABASE_URL` is the Supavisor transaction-pooler URL used by the running API.
- `DIRECT_URL` is the direct Supabase connection used only by Prisma migrations.
- `PERSISTENCE_MODE=mock` keeps the current in-memory contract tests and UI demo.
- `PERSISTENCE_MODE=prisma` explicitly enables the Prisma connection at API startup.

Never put either database URL in `NEXT_PUBLIC_*` variables or commit real values.

## Local validation

From the repository root:

```powershell
$env:DATABASE_URL = 'postgresql://user:password@localhost:5432/lpms'
$env:DIRECT_URL = $env:DATABASE_URL
npm.cmd exec --workspace=@lpms/api -- prisma validate --schema prisma/schema.prisma
npm.cmd exec --workspace=@lpms/api -- prisma generate --schema prisma/schema.prisma
```

## Supabase migration

Set the two URLs in a private shell, then run:

```powershell
npm.cmd exec --workspace=@lpms/api -- prisma migrate deploy --schema prisma/schema.prisma
npm.cmd exec --workspace=@lpms/api -- prisma db seed
```

For a staging login, also provide `AUTH_ENCRYPTION_KEY` and the optional
`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` variables in
that private shell. The seed creates the first `SYSTEM_ADMIN` account only
when the email is new; it never contains a default password.

`migrate deploy` is the only production schema path. Do not use `db push` against
staging or production, and do not edit the Supabase dashboard schema manually.

The first migration contains the auth/RBAC/session/audit foundation plus the MVP
organization, client, matter, conflict, task/deadline, calendar, document,
notification and note tables. Repository wiring remains incremental: each mock
route must have a matching Prisma repository contract and authorization test
before the runtime is switched to Prisma mode.

The follow-up migration `0002_organization_user_fields` adds employee codes,
start dates, reporting managers and department managers required by the
Organization adapter.

The `0003_queue_deliveries` migration adds the unique delivery ledger used by
the Vercel Queues consumer for at-least-once idempotency.
