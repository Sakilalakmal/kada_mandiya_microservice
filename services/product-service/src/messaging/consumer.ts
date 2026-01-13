import type { ConsumeMessage } from "amqplib";
import { getEventExchange, getQueueName, getRabbitChannel } from "./bus";
import type { DomainEvent } from "./types";
import { getPool, sql } from "../db/pool";
import { ensureDbSchema } from "../db/schema";
import { insertProcessedEvent } from "../repositories/processedEvents.repo";
import { adjustStockBulk } from "../repositories/stock.repo";

type OrderCancelledData = {
  orderId: string;
  userId?: string;
  items: { productId: string; qty: number }[];
  reason?: string;
};

const ROUTING_KEY = "order.cancelled";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

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

async function handleConsumerError(channel: any, queue: string, message: ConsumeMessage, err: unknown) {
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
      `[product-service] message moved to DLQ after ${currentRetry} retries (queue=${queue} dlq=${dlq}):`,
      err
    );
    channel.ack(message);
    return;
  }

  const nextRetry = currentRetry + 1;
  const delayMs = backoffMs(nextRetry, 250, 5000);
  console.warn(`[product-service] handler error; retrying (${nextRetry}/${maxRetries}) after ${delayMs}ms:`, err);

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
    console.error("[product-service] retry republish failed; requeueing original message:", republishErr);
    channel.nack(message, false, true);
  }
}

function tryParseEvent(content: string): DomainEvent<unknown> | null {
  try {
    return JSON.parse(content) as DomainEvent<unknown>;
  } catch {
    return null;
  }
}

function normalizeCancelledData(data: unknown): { ok: true; value: OrderCancelledData } | { ok: false; reason: string } {
  if (!isRecord(data)) return { ok: false, reason: "data is not an object" };

  const orderId = data.orderId;
  if (!isUuid(orderId)) return { ok: false, reason: "invalid orderId" };

  const rawItems = data.items;
  if (!Array.isArray(rawItems)) return { ok: false, reason: "items missing" };

  const aggregated = new Map<string, number>();
  for (const raw of rawItems) {
    if (!isRecord(raw)) continue;
    const productId = raw.productId;
    const qty = Math.trunc(Number(raw.qty));
    if (!isUuid(productId)) {
      console.warn(`[product-service] order.cancelled invalid productId:`, raw.productId);
      continue;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      console.warn(`[product-service] order.cancelled invalid qty for productId=${productId}:`, raw.qty);
      continue;
    }
    if (qty > 1000) {
      console.warn(`[product-service] order.cancelled qty too large for productId=${productId}:`, qty);
      continue;
    }
    aggregated.set(productId, (aggregated.get(productId) ?? 0) + qty);
  }

  const items = Array.from(aggregated.entries()).map(([productId, qty]) => ({ productId, qty }));

  const reason = typeof data.reason === "string" && data.reason.trim().length > 0 ? data.reason.trim() : undefined;
  const userId = typeof data.userId === "string" && data.userId.trim().length > 0 ? data.userId.trim() : undefined;

  return {
    ok: true,
    value: { orderId, userId, items, reason },
  };
}

async function handleOrderCancelled(message: ConsumeMessage) {
  const content = message.content.toString("utf8");
  const parsed = tryParseEvent(content);
  if (!parsed || !isRecord(parsed)) {
    console.error("[product-service] invalid JSON event payload");
    return { state: "ack" as const };
  }

  const eventId = (parsed as any).eventId;
  const eventType = (parsed as any).eventType;
  const correlationId = (parsed as any).correlationId;
  const data = (parsed as any).data;

  if (eventType !== ROUTING_KEY) return { state: "ack" as const };
  if (!isUuid(eventId)) {
    console.error("[product-service] order.cancelled missing/invalid eventId");
    return { state: "ack" as const };
  }

  const normalized = normalizeCancelledData(data);
  if (!normalized.ok) {
    console.error(`[product-service] order.cancelled invalid payload: ${normalized.reason} eventId=${eventId}`);
    return { state: "ack" as const };
  }

  const { orderId, items } = normalized.value;
  if (items.length === 0) {
    console.warn(`[product-service] order.cancelled has no valid items; acking eventId=${eventId} orderId=${orderId}`);
    return { state: "ack" as const };
  }

  await ensureDbSchema();

  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  await tx.begin();
  try {
    const processed = await insertProcessedEvent(tx, eventId);
    if (processed === "duplicate") {
      await tx.rollback();
      return { state: "ack" as const };
    }

    const updated = await adjustStockBulk(tx, {
      items: items.map((i) => ({ productId: i.productId, deltaQty: i.qty })),
      reason: `order.cancelled:${orderId}`,
    });

    const updatedIds = new Set(updated.map((u) => u.productId));
    const missing = items.filter((i) => !updatedIds.has(i.productId));
    if (missing.length > 0) {
      console.warn(
        `[product-service] order.cancelled missing products; skipped=${missing.length} eventId=${eventId} orderId=${orderId}`
      );
    }

    await tx.commit();

    console.log(
      `[product-service] restocked from order.cancelled eventId=${eventId} orderId=${orderId} items=${items.length} updated=${updated.length} correlationId=${String(
        correlationId ?? ""
      )}`
    );

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
      await channel.bindQueue(queue, exchange, ROUTING_KEY);
      await channel.assertQueue(`${queue}.dlq`, { durable: true });

      await channel.prefetch(10);
      console.log(`[product-service] waiting for ${ROUTING_KEY} on ${queue}`);

      const consumeResult = await channel.consume(
        queue,
        async (msg) => {
          if (!msg) return;
          if (shuttingDown) return channel.nack(msg, false, true);

          try {
            const result = await handleOrderCancelled(msg);
            if (result.state === "ack") channel.ack(msg);
          } catch (err) {
            if (shuttingDown) return channel.nack(msg, false, true);
            await handleConsumerError(channel, queue, msg, err);
          }
        },
        { noAck: false }
      );

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

      console.warn("[product-service] rabbit channel closed; reconnecting consumer...");
      connectAttempt = 0;
    } catch (err) {
      connectAttempt++;
      const delayMs = backoffMs(connectAttempt, 500, 30000);
      console.warn(`[product-service] RabbitMQ consumer connect failed; retrying in ${delayMs}ms:`, err);
      await sleep(delayMs);
    }
  }
}

