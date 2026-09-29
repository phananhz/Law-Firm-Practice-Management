# Vercel Queues

The web app owns the Vercel Queues push consumer at
`app/api/queues/notifications/route.ts`. The consumer uses the official
`@vercel/queue` callback handler and is wired to the `lpms-events` topic in
`vercel.json` (both the repository-root manifest and the `apps/web` project
manifest are included so either Vercel Root Directory layout keeps the trigger).

Messages carry an explicit `eventType` and payload. The consumer forwards the
Vercel message ID and topic to the Nest API internal endpoint. The API stores a
unique `queue_deliveries.messageId` row and performs the supported side effect
inside the same Prisma transaction; a duplicate delivery is acknowledged as a
no-op. Mock mode uses an in-process set only for local contract tests.

Required deployment variables:

- `QUEUE_PROCESSOR_URL`: public base URL of the Nest API deployment.
- `QUEUE_INTERNAL_SECRET`: shared random secret present in both Vercel and API.
- Vercel Queues project integration/permissions for the `lpms-events` topic.

The route retries transient failures with exponential backoff and acknowledges
after ten deliveries to prevent an endless poison-message loop. A live Vercel
deployment smoke test is still required before marking the queue phase fully
complete.

## Deadline reminder producer

The web project exposes `/api/cron/reminders`, protected by Vercel's
`CRON_SECRET` bearer value and scheduled daily at 06:00 UTC. It asks the API's
internal `/api/v1/internal/queues/reminders` endpoint for due reminder events,
then publishes each event with a deterministic `messageId`. The notification
consumer forwards that ID to the API so repeated cron runs remain idempotent in
`queue_deliveries`.

Required additional web variable:

- `CRON_SECRET`: random secret used to authorize the Vercel Cron invocation.
