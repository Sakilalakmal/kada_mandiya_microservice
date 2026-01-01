import amqp, { type Channel,type ConsumeMessage } from "amqplib";
import { z } from "zod";

// Event envelope schema (basic)
export const EventEnvelopeSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  version: z.number(),
  occurredAt: z.string(),
  correlationId: z.string(),
  data: z.any()
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

export type RabbitClient = {
  conn: any;
  channel: Channel;
};

export async function connectRabbit(url: string): Promise<RabbitClient> {
  const conn = (await amqp.connect(url));
  const channel: Channel = await conn.createChannel();
  return { conn, channel };
}



export async function ensureExchange(
  channel: Channel,
  exchange: string
): Promise<void> {
  await channel.assertExchange(exchange, "topic", { durable: true });
}

export function publishEvent(
  channel: Channel,
  exchange: string,
  routingKey: string,
  event: EventEnvelope
): void {
  const payload = Buffer.from(JSON.stringify(event));
  channel.publish(exchange, routingKey, payload, { persistent: true });
}

export async function consumeQueue(
  channel: Channel,
  queue: string,
  onMessage: (event: EventEnvelope) => Promise<void>
): Promise<void> {
  await channel.assertQueue(queue, { durable: true });

  await channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    try {
      const raw = msg.content.toString("utf-8");
      const parsed = JSON.parse(raw);
      const event = EventEnvelopeSchema.parse(parsed);

      await onMessage(event);
      channel.ack(msg);
    } catch (err) {
      // For now: reject and discard (we’ll add DLQ next)
      channel.nack(msg, false, false);
      console.error("❌ Failed to process message:", err);
    }
  });
}

export async function closeRabbit(client: RabbitClient): Promise<void> {
  await client.channel.close();
  await client.conn.close();
}
