# Platform persistence adapter

Notifications, search, reports and audit now resolve `PLATFORM_REPOSITORY` by
the configured persistence mode:

- `PERSISTENCE_MODE=mock` keeps deterministic demo data for local UI work.
- `PERSISTENCE_MODE=prisma` reads `notifications`, operational entities and
  `audit_logs` from PostgreSQL, with notification read state scoped to the
  authenticated user when a UUID subject is available.

Search and reports intentionally preserve the existing response contracts while
computing counts and workload from live records. Audit filters map to the
stored resource type, action and actor ID. Search/report Matter, Task, Deadline
and Document queries receive the authenticated user context and apply the same
membership/responsibility and `RESTRICTED` scope as Operations; restricted or
sensitive documents are removed unless the user has matching `VIEW` access.
The Prisma adapter is covered by the selector/unit regression suite; a
Supabase staging migration and live read/write smoke test are still required
before deployment.
