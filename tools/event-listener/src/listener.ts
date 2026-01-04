import "dotenv/config";
import amqp from "amqplib";

type DomainEvent = {
  eventId: string;
  eventType: string;
  version: number;
  occurredAt: string;
  correlationId: string;
  data: unknown;
};

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
const EVENT_EXCHANGE = process.env.EVENT_EXCHANGE ?? "domain.events";
const QUEUE = process.env.QUEUE ?? "dev.events.q";

async function main() {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();

  await channel.assertExchange(EVENT_EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EVENT_EXCHANGE, "#");

  const shutdown = async () => {
    await channel.close().catch(() => {});
    await conn.close().catch(() => {});
  };

  process.once("SIGINT", () => void shutdown().finally(() => process.exit(0)));
  process.once("SIGTERM", () => void shutdown().finally(() => process.exit(0)));
  process.once("beforeExit", () => void shutdown());

  console.log(`[event-listener] exchange=${EVENT_EXCHANGE} queue=${QUEUE} binding=#`);

  await channel.consume(
    QUEUE,
    (msg) => {
      if (!msg) return;

      const raw = msg.content.toString("utf-8");
      try {
        const parsed = JSON.parse(raw) as DomainEvent;
        console.log("");
        console.log(`eventType: ${parsed.eventType}`);
        console.log(`eventId: ${parsed.eventId}`);
        console.log(`occurredAt: ${parsed.occurredAt}`);
        console.log(`data: ${JSON.stringify(parsed.data, null, 2)}`);
      } catch (err) {
        console.error("[event-listener] JSON parse failed; acking message:", err);
        console.log(raw);
      } finally {
        channel.ack(msg);
      }
    },
    { noAck: false }
  );
}

main().catch((err) => {
  console.error("[event-listener] failed to start:", err);
  process.exit(1);
});

