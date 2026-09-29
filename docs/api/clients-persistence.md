# Clients persistence adapter

`ClientsModule` now resolves a repository token instead of coupling the
controller to the in-memory implementation:

- `PERSISTENCE_MODE=mock` selects `MockClientsRepository` for local UI/demo and
  contract tests.
- `PERSISTENCE_MODE=prisma` selects `PrismaClientsRepository`, which uses the
  Prisma `clients`, `contacts`, `client_contacts`, `client_relations` and
  `matters` tables.

Both adapters expose the same response shape, including contact/relation lists
and matter/contact counts. Unknown IDs are rejected with a 404 in either mode.
The remaining modules will be switched using the same token pattern after a
Supabase staging database is available for integration tests.
