# Backup and disaster recovery runbook

LPMS keeps PostgreSQL and document objects in separate recovery planes:

- Supabase PostgreSQL: managed point-in-time recovery is the primary backup;
  scheduled logical dumps are the independent recovery copy.
- Supabase Storage: the bucket remains private; a scheduled object inventory
  and encrypted export provide an independent recovery copy for production.

## Required objectives

- Target RPO: 24 hours for the logical dump, with Supabase PITR used for a
  smaller recovery point when available.
- Target RTO: four hours for a staging restore rehearsal.
- Never restore over production. Restore into a new Supabase project/database,
  run migrations, then validate API readiness and representative read/write
  flows before any cutover decision.

## Logical database dump

Run from a trusted administrative shell with `DIRECT_URL` set to the Supabase
direct/session-pooler URL:

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$target = Join-Path $env:LPMS_BACKUP_DIR "lpms-$stamp.dump"
pg_dump --format=custom --no-owner --no-privileges --file $target $env:DIRECT_URL
```

The dump directory must be encrypted at rest, access-controlled and retained
according to the firm retention policy. Do not place backup files in the web
workspace or commit them.

## Restore rehearsal

1. Provision an isolated Supabase staging database.
2. Restore the dump into that database with `pg_restore --clean --if-exists`.
3. Run `prisma migrate deploy` and `prisma db seed` only when the target is a
   disposable demo database.
4. Set `PERSISTENCE_MODE=prisma`, verify `GET /api/v1/health/ready`, then run
   auth, organization, client, matter, task, document and queue smoke tests.
5. Record duration, row-count checks and any missing Storage objects in the UAT
   evidence log.

This procedure is documented now; a real restore is intentionally blocked until
Supabase database and Storage staging credentials are supplied.
