import { z } from "zod";
import { EventEnvelope } from "./base";

/**
 * Payload (business data)
 */
export interface OrderCreatedPayload {
  orderId: string;
  amount: number;
  currency: string;
  userId: string;
}

/**
 * Runtime validation (Zod)
 */
export const OrderCreatedPayloadSchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  userId: z.string()
});

/**
 * Typed event
 */
export type OrderCreatedEvent = EventEnvelope<OrderCreatedPayload>;

/**
 * Helper to create the event safely
 */
export function createOrderCreatedEvent(
  payload: OrderCreatedPayload,
  meta: {
    eventId: string;
    correlationId: string;
  }
): OrderCreatedEvent {
  // runtime validation
  OrderCreatedPayloadSchema.parse(payload);

  return {
    eventId: meta.eventId,
    eventType: "order.created",
    version: 1,
    occurredAt: new Date().toISOString(),
    correlationId: meta.correlationId,
    data: payload
  };
}

/**
 * Payload (business data)
 */
export type OrderCancelledItem = {
  productId: string;
  qty: number;
};

export interface OrderCancelledPayload {
  orderId: string;
  userId: string;
  items: OrderCancelledItem[];
  reason?: string;
}

/**
 * Runtime validation (Zod)
 */
export const OrderCancelledPayloadSchema = z
  .object({
    orderId: z.string(),
    userId: z.string(),
    items: z.array(
      z.object({
        productId: z.string(),
        qty: z.number().int().positive(),
      })
    ),
    reason: z.string().max(500).optional(),
  })
  .strict();

/**
 * Typed event
 */
export type OrderCancelledEvent = EventEnvelope<OrderCancelledPayload> & {
  eventType: "order.cancelled";
};

/**
 * Helper to create the event safely
 */
export function createOrderCancelledEvent(
  payload: OrderCancelledPayload,
  meta: {
    eventId: string;
    correlationId: string;
  }
): OrderCancelledEvent {
  OrderCancelledPayloadSchema.parse(payload);

  return {
    eventId: meta.eventId,
    eventType: "order.cancelled",
    version: 1,
    occurredAt: new Date().toISOString(),
    correlationId: meta.correlationId,
    data: payload,
  };
}
