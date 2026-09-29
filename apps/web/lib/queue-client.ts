import { send } from '@vercel/queue';

export type BackgroundEvent = {
  messageId?: string;
  eventType: 'NOTIFICATION_CREATE' | 'AUDIT_EVENT';
  payload: Record<string, unknown>;
};

/** Publish a durable event with a caller-owned idempotency key. */
export async function publishBackgroundEvent(event: BackgroundEvent, idempotencyKey: string) {
  if (!idempotencyKey.trim()) throw new Error('idempotencyKey is required');
  return send('lpms-events', event, {
    idempotencyKey: idempotencyKey.trim(),
    retentionSeconds: 86_400,
  });
}
