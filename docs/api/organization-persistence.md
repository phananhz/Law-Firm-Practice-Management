# Organization persistence adapter

Organization endpoints now resolve `ORGANIZATION_REPOSITORY` instead of calling
the in-memory repository directly. `PERSISTENCE_MODE=mock` keeps the current
demo data; `PERSISTENCE_MODE=prisma` uses departments, branches, positions,
users, user roles, roles and permissions from PostgreSQL.

The Prisma adapter preserves the existing response shape, computes employee and
active-session counts, validates department/position/role IDs on employee
creation, and replaces role permissions transactionally. Suspension and
reactivation still go through the same backend role guards.

The adapter is unit-tested with repository fixtures. A Supabase staging
integration test is still required before enabling Prisma mode in deployment.
