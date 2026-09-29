# Calendar API

Routes are served under `/api/v1/calendar/events` and return the shared
`{ data, meta }` envelope:

- `GET /calendar/events?from=&to=&matterId=` lists events by start-time range
  and optional matter.
- `GET /calendar/events/:id` reads one event.
- `POST /calendar/events` creates a meeting, hearing, appointment or deadline
  event.
- `PATCH /calendar/events/:id` updates event metadata.
- `DELETE /calendar/events/:id` removes an event (Partner/Admin only).

`PERSISTENCE_MODE=mock` uses deterministic local events; Prisma mode validates
matter/user UUIDs and persists `CalendarEvent` rows. Create/update/delete routes
are role-guarded, while reads require an authenticated session. Prisma mode
also scopes matter-linked events by the same membership/responsible-user and
`RESTRICTED` rules as Matter reads; events without a matter remain visible to
authenticated users.
