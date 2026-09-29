# Auth persistence

Auth uses the same explicit `PERSISTENCE_MODE` switch as the other backend
modules:

- `mock`: the in-memory demo user remains available for local UI work.
- `prisma`: users, roles, refresh sessions, password-reset tokens and auth
  audit entries are read/written through `PrismaAuthRepository`.

`AUTH_ENCRYPTION_KEY` is required in Prisma mode. It is hashed to an AES-256
key and used to encrypt the TOTP secret stored in `users.mfa_secret_encrypted`.
The key must be different from `JWT_ACCESS_SECRET` and must be supplied through
the deployment secret manager; it must never be committed.

To bootstrap a staging account, set `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD` and optionally `SEED_ADMIN_NAME` only for the migration
shell, then run `npm run db:seed --workspace=@lpms/api`. The seed is
idempotent: it creates the account only when the email does not exist and
always ensures the `SYSTEM_ADMIN` role link. It does not print or persist the
bootstrap password outside the normal password hash.

The repository selector never silently falls back to mock when
`PERSISTENCE_MODE=prisma`; a database connection/readiness failure remains an
operational error and must be fixed before UAT.
