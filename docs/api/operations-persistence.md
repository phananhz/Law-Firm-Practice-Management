# Operations persistence adapter

`OperationsModule` now resolves `OPERATIONS_REPOSITORY` through the same mode
selector used by Clients and Organization:

- `PERSISTENCE_MODE=mock` keeps the seeded Conflict, Matter, Task, Deadline,
  Document and Folder data used by the local UI.
- `PERSISTENCE_MODE=prisma` reads and writes the corresponding PostgreSQL
  entities through `PrismaOperationsRepository`.

The Prisma adapter preserves the existing route envelope and maps related
clients, users, members, parties, checklists, comments, versions, permissions
and folders into the current frontend contract. Matter status changes create a
status-history row; document trash is a soft delete and restore clears the
timestamp. IDs are validated before Prisma queries so mock IDs cannot cross the
Prisma boundary.

For Prisma mode every controller call passes the authenticated user UUID and
roles into the repository. Matter, task, deadline and folder reads/writes are
scoped by creator/responsible user/membership; `RESTRICTED` matters never use
Partner as an implicit bypass. Restricted or sensitive documents require an
explicit matching `VIEW` permission, and restricted/download-limited documents
require explicit `DOWNLOAD`, `UPLOAD_VERSION`, `SHARE` or `DELETE` permissions
for those actions. Inaccessible resources return the same not-found boundary
used for normal missing IDs to reduce enumeration.

The adapter has not been enabled against a live Supabase database yet. A
staging migration plus CRUD smoke test is still required before production
deployment. R2 upload/download remains a separate storage boundary.
