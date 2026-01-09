import type { ConsumeMessage } from "amqplib";
import { z } from "zod";
import { publishEvent, getRabbitChannel, getEventExchange } from "./bus";
import type { DomainEvent } from "./types";
import { createNotRequiredPayment, createPendingPayment } from "../repositories/payment.repo";

type OrderCreatedData = {
  orderId: string;
  userId: string;
  subtotal: number;
  currency?: string;
  paymentMethod?: string;
};

const OrderCreatedSchema = z
  .object({
    eventId: z.string(),
    eventType: z.string(),
    version: z.number(),
    occurredAt: z.string(),
    correlationId: z.string(),
    data: z
      .object({
        orderId: z.string().min(1).max(100),
        userId: z.string().min(1).max(100),
        subtotal: z.number(),
        currency: z.string().optional(),
        paymentMethod: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

function getQueueName(): string {
  return process.env.PAYMENT_QUEUE ?? "payment-service.q";
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
      `[payment-service] message moved to DLQ after ${currentRetry} retries (queue=${queue} dlq=${dlq}):`,
      err
    );
    channel.ack(message);
    return;
  }

  const nextRetry = currentRetry + 1;
  const delayMs = backoffMs(nextRetry, 250, 5000);
  console.warn(
    `[payment-service] handler error; retrying (${nextRetry}/${maxRetries}) after ${delayMs}ms:`,
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
    console.error("[payment-service] retry republish failed; requeueing original message:", republishErr);
    channel.nack(message, false, true);
  }
}

async function handleOrderCreated(message: ConsumeMessage) {
  const content = message.content.toString("utf8");

  const parsedJson = (() => {
    try {
      return JSON.parse(content) as DomainEvent<OrderCreatedData>;
    } catch {
      return null;
    }
  })();

  const parsed = OrderCreatedSchema.safeParse(parsedJson);
  if (!parsed.success) {
    console.error("[payment-service] invalid order.created payload:", parsed.error.flatten());
    return { state: "ack" as const };
  }

  const event = parsed.data;
  const orderId = String(event.data.orderId);
  const userId = String(event.data.userId);
  const amount = Number(event.data.subtotal);
  const currency = String(process.env.STRIPE_CURRENCY ?? event.data.currency ?? "LKR").toUpperCase();
  const paymentMethod = String(event.data.paymentMethod ?? "COD");

  if (!Number.isFinite(amount)) {
    console.error("[payment-service] invalid subtotal for order.created:", event.data.subtotal);
    return { state: "ack" as const };
  }

  const created =
    paymentMethod === "ONLINE"
      ? await createPendingPayment({
          orderId,
          userId,
          amount,
          currency,
          provider: "VISA",
          correlationId: event.correlationId ?? null,
        })
      : await createNotRequiredPayment({
          orderId,
          userId,
          amount,
          currency,
          correlationId: event.correlationId ?? null,
        });

  if (created === "duplicate") {
    console.log(`[payment-service] duplicate payment for orderId=${orderId} (already processed)`);
    return { state: "ack" as const };
  }

  const publishType = paymentMethod === "ONLINE" ? "payment.pending" : "payment.not_required";
  const publishData =
    paymentMethod === "ONLINE"
      ? ({ orderId, userId, amount, currency, method: "ONLINE", status: "PENDING" as const } as const)
      : ({ orderId, userId, amount, currency, method: "COD", status: "NOT_REQUIRED" as const } as const);

  await publishEvent(publishType, publishData, { correlationId: event.correlationId }).catch((err) => {
    console.error(`[payment-service] publish ${publishType} failed:`, err);
  });

  return { state: "ack" as const };
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
      await channel.bindQueue(queue, exchange, "order.created");
      await channel.assertQueue(`${queue}.dlq`, { durable: true });
      await channel.prefetch(10);

      console.log(`[payment-service] waiting for order.created on ${queue}`);

      const consumeResult = await channel.consume(
        queue,
        async (msg) => {
          if (!msg) return;
          if (shuttingDown) return channel.nack(msg, false, true);

          try {
            const result = await handleOrderCreated(msg);
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

      console.warn("[payment-service] rabbit channel closed; reconnecting consumer...");
      connectAttempt = 0;
    } catch (err) {
      connectAttempt++;
      const delayMs = backoffMs(connectAttempt, 500, 30000);
      console.warn(`[payment-service] RabbitMQ consumer connect failed; retrying in ${delayMs}ms:`, err);
      await sleep(delayMs);
    }
  }
}
