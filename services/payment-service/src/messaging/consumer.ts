import type { ConsumeMessage } from "amqplib";
import { z } from "zod";
import { publishEvent, getRabbitChannel, getEventExchange } from "./bus";
import type { DomainEvent } from "./types";
import { createNotRequiredPayment } from "../repositories/payment.repo";

type OrderCreatedData = {
  orderId: string;
  userId: string;
  subtotal: number;
  currency?: string;
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
      })
      .passthrough(),
  })
  .passthrough();

function getQueueName(): string {
  return process.env.PAYMENT_QUEUE ?? "payment-service.q";
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
  const currency = String(event.data.currency ?? "LKR");

  if (!Number.isFinite(amount)) {
    console.error("[payment-service] invalid subtotal for order.created:", event.data.subtotal);
    return { state: "ack" as const };
  }

  const created = await createNotRequiredPayment({
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

  await publishEvent(
    "payment.not_required",
    { orderId, userId, amount, currency, method: "COD", status: "NOT_REQUIRED" as const },
    { correlationId: event.correlationId }
  ).catch((err) => {
    console.error("[payment-service] publish payment.not_required failed:", err);
  });

  return { state: "ack" as const };
}

export async function startConsumer(): Promise<void> {
  const channel = await getRabbitChannel();
  const exchange = getEventExchange();
  const queue = getQueueName();

  await channel.assertExchange(exchange, "topic", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, "order.created");
  await channel.prefetch(10);

  console.log(`[payment-service] waiting for order.created on ${queue}`);

  await channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;
      try {
        const result = await handleOrderCreated(msg);
        if (result.state === "ack") channel.ack(msg);
      } catch (err) {
        console.error("[payment-service] order.created handler error:", err);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false }
  );
}
