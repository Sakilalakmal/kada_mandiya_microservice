import type { ConsumeMessage } from "amqplib";
import { z } from "zod";
import { getEventExchange, getQueueName, getRabbitChannel } from "./bus";
import type { DomainEvent } from "./types";
import { getPool, sql } from "../db/pool";
import { insertProcessedEvent } from "../repositories/processedEvents.repo";
import { insertNotifications, type NotificationInsert } from "../repositories/notification.repo";
import { extractVendorIds, mapEventToNotificationTemplate } from "../domain/notificationTypes";

const EventSchema = z
  .object({
    eventId: z.string().uuid(),
    eventType: z.string().min(1),
    version: z.number(),
    occurredAt: z.string(),
    correlationId: z.string(),
    data: z.any(),
  })
  .passthrough();

const ROUTING_KEYS = [
  "order.created",
  "order.status_updated",
  "order.cancelled",
  "payment.not_required",
  "payment.completed",
  "payment.failed",
] as const;

function getMaxPoisonRetries(): number {
  const raw = process.env.RABBITMQ_POISON_MAX_RETRIES ?? "5";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(0, Math.min(100, Math.trunc(parsed)));
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number, baseMs: number, maxMs: number) {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(250, exp));
  return Math.min(maxMs, exp + jitter);
}

async function waitForConfirms(channel: unknown) {
  const wait = (channel as any)?.waitForConfirms?.bind(channel);
  if (typeof wait === "function") await wait();
}

function retryCountFromMessage(message: ConsumeMessage): number {
  const value = (message.properties.headers as any)?.["x-retry-count"];
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

function buildRetryHeaders(message: ConsumeMessage, nextRetryCount: number): Record<string, unknown> {
  const current = (message.properties.headers ?? {}) as Record<string, unknown>;
  return {
    ...current,
    "x-retry-count": nextRetryCount,
    "x-original-exchange": message.fields.exchange,
    "x-original-routing-key": message.fields.routingKey,
  };
}

async function handleConsumerError(
  channel: any,
  queue: string,
  message: ConsumeMessage,
  err: unknown
) {
  const maxRetries = getMaxPoisonRetries();
  const currentRetry = retryCountFromMessage(message);

  if (currentRetry >= maxRetries) {
    const dlq = `${queue}.dlq`;
    await channel.assertQueue(dlq, { durable: true });

    const headers = buildRetryHeaders(message, currentRetry);
    headers["x-dlq-reason"] = "poison-message";

    channel.sendToQueue(dlq, message.content, {
      ...message.properties,
      headers,
      persistent: true,
      contentType: message.properties.contentType ?? "application/json",
    });
    await waitForConfirms(channel);

    console.error(
      `[notification-service] message moved to DLQ after ${currentRetry} retries (queue=${queue} dlq=${dlq}):`,
      err
    );
    channel.ack(message);
    return;
  }

  const nextRetry = currentRetry + 1;
  const delayMs = backoffMs(nextRetry, 250, 5000);
  console.warn(
    `[notification-service] handler error; retrying (${nextRetry}/${maxRetries}) after ${delayMs}ms:`,
    err
  );

  await sleep(delayMs);

  try {
    const headers = buildRetryHeaders(message, nextRetry);
    channel.sendToQueue(queue, message.content, {
      ...message.properties,
      headers,
      persistent: true,
      contentType: message.properties.contentType ?? "application/json",
    });
    await waitForConfirms(channel);
    channel.ack(message);
  } catch (republishErr) {
    console.error("[notification-service] retry republish failed; requeueing original message:", republishErr);
    channel.nack(message, false, true);
  }
}

function tryParse(content: string): DomainEvent<Record<string, unknown>> | null {
  try {
    return JSON.parse(content) as DomainEvent<Record<string, unknown>>;
  } catch {
    return null;
  }
}

function buildNotifications(event: DomainEvent<Record<string, unknown>>): NotificationInsert[] {
  const rows: NotificationInsert[] = [];
  const dataJson = JSON.stringify(event.data ?? {});

  const userId = event.data?.userId;
  if (typeof userId === "string" && userId.trim()) {
    const template = mapEventToNotificationTemplate(event.eventType, "USER", event.data);
    if (template) {
      rows.push({
        recipientType: "USER",
        recipientId: userId.trim(),
        type: template.type,
        title: template.title,
        message: template.message,
        link: template.link,
        dataJson,
      });
    }
  } else if (event.eventType.startsWith("payment.") || event.eventType.startsWith("order.")) {
    console.warn(`[notification-service] missing userId for ${event.eventType} eventId=${event.eventId}`);
  }

  if (event.eventType.startsWith("order.")) {
    const vendorIds = extractVendorIds(event);
    if (vendorIds.length > 0) {
      const template = mapEventToNotificationTemplate(event.eventType, "VENDOR", event.data);
      if (template) {
        for (const vendorId of vendorIds) {
          rows.push({
            recipientType: "VENDOR",
            recipientId: vendorId,
            type: template.type,
            title: template.title,
            message: template.message,
            link: template.link,
            dataJson,
          });
        }
      }
    }
  }

  return rows;
}

async function handleMessage(message: ConsumeMessage) {
  const content = message.content.toString("utf8");
  const parsedJson = tryParse(content);
  const parsed = EventSchema.safeParse(parsedJson);
  if (!parsed.success) {
    console.error("[notification-service] invalid event payload:", parsed.error.flatten());
    return { state: "ack" as const };
  }

  const event = parsed.data as DomainEvent<Record<string, unknown>>;
  if (!ROUTING_KEYS.includes(event.eventType as any)) {
    return { state: "ack" as const };
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  await tx.begin();
  try {
    const processed = await insertProcessedEvent(tx, event.eventId);
    if (processed === "duplicate") {
      await tx.rollback();
      return { state: "ack" as const };
    }

    const notifications = buildNotifications(event);
    await insertNotifications(tx, notifications);

    await tx.commit();
    return { state: "ack" as const };
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  }
}

export async function startConsumer(): Promise<void> {
  const exchange = getEventExchange();
  const queue = getQueueName();

  let shuttingDown = false;
  process.once("SIGINT", () => {
    shuttingDown = true;
  });
  process.once("SIGTERM", () => {
    shuttingDown = true;
  });

  let connectAttempt = 0;
  for (;;) {
    if (shuttingDown) return;
    try {
      const channel = await getRabbitChannel();

      await channel.assertExchange(exchange, "topic", { durable: true });
      await channel.assertQueue(queue, { durable: true });
      for (const key of ROUTING_KEYS) {
        await channel.bindQueue(queue, exchange, key);
      }
      await channel.assertQueue(`${queue}.dlq`, { durable: true });

      await channel.prefetch(10);
      console.log(`[notification-service] waiting for events on ${queue}`);

      const consumeResult = await channel.consume(
        queue,
        async (msg) => {
          if (!msg) return;
          if (shuttingDown) return channel.nack(msg, false, true);

          try {
            const result = await handleMessage(msg);
            if (result.state === "ack") channel.ack(msg);
          } catch (err) {
            if (shuttingDown) return channel.nack(msg, false, true);
            await handleConsumerError(channel, queue, msg, err);
          }
        },
        { noAck: false }
      );

      // Wait until shutdown or until the channel closes, then loop and reconnect.
      await new Promise<void>((resolve) => {
        let interval: NodeJS.Timeout;
        const onClose = () => {
          clearInterval(interval);
          resolve();
        };
        channel.once("close", onClose);

        interval = setInterval(() => {
          if (!shuttingDown) return;
          clearInterval(interval);
          channel.off("close", onClose);
          resolve();
        }, 500);
      });

      if (shuttingDown) {
        await channel.cancel(consumeResult.consumerTag).catch(() => {});
        return;
      }

      console.warn("[notification-service] rabbit channel closed; reconnecting consumer...");
      connectAttempt = 0;
    } catch (err) {
      connectAttempt++;
      const delayMs = backoffMs(connectAttempt, 500, 30000);
      console.warn(`[notification-service] RabbitMQ consumer connect failed; retrying in ${delayMs}ms:`, err);
      await sleep(delayMs);
    }
  }
}

