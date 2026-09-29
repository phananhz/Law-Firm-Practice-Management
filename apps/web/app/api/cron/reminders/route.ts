import { publishBackgroundEvent } from '@/lib/queue-client';

export const runtime = 'nodejs';

type ReminderEvent = {
  messageId: string;
  eventType: 'NOTIFICATION_CREATE';
  payload: Record<string, unknown>;
};

export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 32)
    return json({ error: 'Reminder cron is not configured.' }, 503);
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return json({ error: 'Unauthorized.' }, 401);

  const processorUrl = process.env.QUEUE_PROCESSOR_URL;
  const queueSecret = process.env.QUEUE_INTERNAL_SECRET;
  if (!processorUrl || !queueSecret)
    return json({ error: 'Queue processor is not configured.' }, 503);

  try {
    const response = await fetch(
      `${processorUrl.replace(/\/$/, '')}/api/v1/internal/queues/reminders`,
      {
        headers: { 'x-queue-secret': queueSecret },
        cache: 'no-store',
      },
    );
    if (!response.ok) return json({ error: `Reminder source returned ${response.status}.` }, 502);

    const body: unknown = await response.json();
    const events = extractReminderEvents(body);
    await Promise.all(
      events.map((event) =>
        publishBackgroundEvent(
          { messageId: event.messageId, eventType: event.eventType, payload: event.payload },
          event.messageId,
        ),
      ),
    );
    return json({ data: { published: events.length } });
  } catch {
    return json({ error: 'Reminder publishing failed.' }, 502);
  }
}

function extractReminderEvents(value: unknown): ReminderEvent[] {
  if (!value || typeof value !== 'object' || !('data' in value)) return [];
  const data = value.data;
  if (!Array.isArray(data)) return [];
  return data.filter(isReminderEvent);
}

function isReminderEvent(value: unknown): value is ReminderEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.messageId === 'string' &&
    event.eventType === 'NOTIFICATION_CREATE' &&
    typeof event.payload === 'object' &&
    event.payload !== null &&
    !Array.isArray(event.payload)
  );
}

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status });
}
