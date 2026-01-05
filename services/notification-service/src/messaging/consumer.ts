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
  const channel = await getRabbitChannel();
  const exchange = getEventExchange();
  const queue = getQueueName();

  await channel.assertExchange(exchange, "topic", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  for (const key of ROUTING_KEYS) {
    await channel.bindQueue(queue, exchange, key);
  }

  await channel.prefetch(10);
  console.log(`[notification-service] waiting for events on ${queue}`);

  await channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;
      try {
        const result = await handleMessage(msg);
        if (result.state === "ack") channel.ack(msg);
      } catch (err) {
        console.error("[notification-service] handler error:", err);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false }
  );
}

