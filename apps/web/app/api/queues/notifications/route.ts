import { QueueClient, type MessageMetadata } from '@vercel/queue';

export const runtime = 'nodejs';

type QueuePayload = {
  messageId?: string;
  eventType: 'NOTIFICATION_CREATE' | 'AUDIT_EVENT';
  payload: Record<string, unknown>;
};

async function processMessage(message: QueuePayload, metadata: MessageMetadata): Promise<void> {
  if (!message || !message.eventType || !message.payload) throw new Error('Invalid queue payload');
  const processorUrl = process.env.QUEUE_PROCESSOR_URL;
  const secret = process.env.QUEUE_INTERNAL_SECRET;
  if (!processorUrl || !secret) throw new Error('Queue processor is not configured');
  const response = await fetch(
    `${processorUrl.replace(/\/$/, '')}/api/v1/internal/queues/process`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-queue-secret': secret },
      body: JSON.stringify({
        messageId: message.messageId ?? metadata.messageId,
        topic: metadata.topicName,
        eventType: message.eventType,
        payload: message.payload,
      }),
    },
  );
  if (!response.ok) throw new Error(`Queue processor returned ${response.status}`);
}

const queueClient = new QueueClient({ region: process.env.VERCEL_REGION || 'iad1' });
const queueHandler = queueClient.handleCallback<QueuePayload>(processMessage, {
  retry: (_error, metadata) => {
    if (metadata.deliveryCount >= 10) return { acknowledge: true };
    return { afterSeconds: Math.min(300, 2 ** Math.max(0, metadata.deliveryCount - 1) * 5) };
  },
});

// The SDK also supports Connect-style `{ request }` callbacks. Wrapping it in
// a Web API signature keeps Next.js route type generation strict.
export async function POST(request: Request): Promise<Response> {
  return queueHandler(request);
}
