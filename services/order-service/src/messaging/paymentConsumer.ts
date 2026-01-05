import type { ConsumeMessage } from "amqplib";
import { z } from "zod";
import { getEventExchange, getRabbitChannel } from "./rabbit";
import { publishEvent } from "./publisher";
import { listVendorIdsByOrderId, updateOrderPaymentStatus, type PaymentStatus } from "../repositories/order.repo";

const ROUTING_KEYS = ["payment.not_required", "payment.pending", "payment.completed", "payment.failed"] as const;

const EventSchema = z
  .object({
    eventId: z.string(),
    eventType: z.string(),
    version: z.number(),
    occurredAt: z.string(),
    correlationId: z.string(),
    data: z.any(),
  })
  .passthrough();

const PaymentEventSchema = z
  .object({
    orderId: z.string().min(1),
    status: z.string().min(1),
    currency: z.string().optional(),
  })
  .passthrough();

function getQueueName(): string {
  return process.env.ORDER_PAYMENT_QUEUE ?? "order-service.payments.q";
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
      `[order-service] message moved to DLQ after ${currentRetry} retries (queue=${queue} dlq=${dlq}):`,
      err
    );
    channel.ack(message);
    return;
  }

  const nextRetry = currentRetry + 1;
  const delayMs = backoffMs(nextRetry, 250, 5000);
  console.warn(`[order-service] handler error; retrying (${nextRetry}/${maxRetries}) after ${delayMs}ms:`, err);

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
    console.error("[order-service] retry republish failed; requeueing original message:", republishErr);
    channel.nack(message, false, true);
  }
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return (
    value === "NOT_REQUIRED" ||
    value === "PENDING" ||
    value === "COMPLETED" ||
    value === "FAILED" ||
    value === "CANCELLED"
  );
}

async function handleMessage(message: ConsumeMessage) {
  const content = message.content.toString("utf8");
  const parsedJson = (() => {
    try {
      return JSON.parse(content) as unknown;
    } catch {
      return null;
    }
  })();

  const parsed = EventSchema.safeParse(parsedJson);
  if (!parsed.success) {
    console.error("[order-service] invalid event payload:", parsed.error.flatten());
    return { state: "ack" as const };
  }

  const eventType = String(parsed.data.eventType);
  if (!ROUTING_KEYS.includes(eventType as any)) return { state: "ack" as const };

  const parsedPayment = PaymentEventSchema.safeParse(parsed.data.data);
  if (!parsedPayment.success) {
    console.error(`[order-service] invalid ${eventType} payload:`, parsedPayment.error.flatten());
    return { state: "ack" as const };
  }

  const orderId = String(parsedPayment.data.orderId);
  const statusRaw = String(parsedPayment.data.status);
  if (!isPaymentStatus(statusRaw)) {
    console.warn(`[order-service] ignoring unknown payment status=${statusRaw} for orderId=${orderId}`);
    return { state: "ack" as const };
  }

  const updated = await updateOrderPaymentStatus(orderId, statusRaw);
  if (updated.state === "not_found") return { state: "ack" as const };

  if (
    eventType === "payment.completed" &&
    updated.previousStatus !== "COMPLETED" &&
    updated.meta.paymentMethod === "ONLINE"
  ) {
    const vendorIds = await listVendorIdsByOrderId(orderId).catch((err) => {
      console.error("[order-service] listVendorIdsByOrderId error:", err);
      return [] as string[];
    });

    await publishEvent(
      "order.ready_for_vendor",
      {
        orderId,
        userId: updated.meta.userId,
        vendorIds,
        subtotal: updated.meta.subtotal,
        currency: parsedPayment.data.currency ?? "LKR",
        paymentMethod: updated.meta.paymentMethod,
        paymentStatus: updated.meta.paymentStatus,
      },
      { correlationId: parsed.data.correlationId }
    ).catch((err) => {
      console.error("[order-service] publish order.ready_for_vendor failed:", err);
    });
  }

  return { state: "ack" as const };
}

export async function startPaymentConsumer(): Promise<void> {
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

      console.log(`[order-service] waiting for payment events on ${queue}`);

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

      console.warn("[order-service] rabbit channel closed; reconnecting consumer...");
      connectAttempt = 0;
    } catch (err) {
      connectAttempt++;
      const delayMs = backoffMs(connectAttempt, 500, 30000);
      console.warn(`[order-service] payment consumer connect failed; retrying in ${delayMs}ms:`, err);
      await sleep(delayMs);
    }
  }
}

