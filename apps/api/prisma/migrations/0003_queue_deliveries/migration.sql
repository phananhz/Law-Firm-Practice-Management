-- Durable idempotency ledger for Vercel Queue deliveries.
CREATE TABLE "queue_deliveries" (
    "id" UUID NOT NULL,
    "messageId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "processedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "queue_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "queue_deliveries_messageId_key" ON "queue_deliveries"("messageId");
CREATE INDEX "queue_deliveries_topic_status_idx" ON "queue_deliveries"("topic", "status");
CREATE INDEX "queue_deliveries_createdAt_idx" ON "queue_deliveries"("createdAt");
