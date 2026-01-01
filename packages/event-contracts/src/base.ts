import { z } from "zod";

/**
 * Base envelope for ALL events
 */
export const EventEnvelopeSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  version: z.number(),
  occurredAt: z.string(),
  correlationId: z.string(),
  data: z.unknown()
});

export type EventEnvelope<T> = {
  eventId: string;
  eventType: string;
  version: number;
  occurredAt: string;
  correlationId: string;
  data: T;
};
