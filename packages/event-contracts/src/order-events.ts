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
