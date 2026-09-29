# Platform API contracts

All routes below are served under `/api/v1`, require the `lpms_access` cookie and return the shared `{ data, meta }` envelope.

| Method | Route | Purpose | Authorization |
| --- | --- | --- | --- |
| GET | `/notifications?unreadOnly=true` | Read in-app notifications | Authenticated user |
| PATCH | `/notifications/:id/read` | Mark one notification read | Authenticated user |
| POST | `/notifications/read-all` | Mark all notifications read | Authenticated user |
| GET | `/search?q=...&type=...` | Search client/matter/task/document/deadline metadata | Authenticated user |
| GET | `/reports/overview` | Operational totals, status and workload | Authenticated user |
| GET | `/audit` | Read immutable audit entries | `SYSTEM_ADMIN` or `MANAGING_PARTNER` |

`PERSISTENCE_MODE=mock` keeps deterministic in-memory data for UI development;
`PERSISTENCE_MODE=prisma` uses the Platform Prisma adapter without changing
these route contracts. Notification reads are scoped to the authenticated
subject in Prisma mode. Supabase staging smoke remains a deployment gate.
