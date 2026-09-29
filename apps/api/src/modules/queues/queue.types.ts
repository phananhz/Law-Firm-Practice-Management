export type QueueEvent = {
  messageId: string;
  topic: string;
  eventType: 'NOTIFICATION_CREATE' | 'AUDIT_EVENT';
  payload: Record<string, unknown>;
};

export type QueueProcessResult = { status: 'processed' | 'duplicate'; messageId: string };

export type QueueReminderEvent = QueueEvent & {
  eventType: 'NOTIFICATION_CREATE';
};
