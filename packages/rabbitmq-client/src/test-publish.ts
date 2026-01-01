import { randomUUID } from "crypto";
import { connectRabbit, ensureExchange, publishEvent } from "./index";

async function main() {
  const url = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
  const exchange = "domain.events";

  const client = await connectRabbit(url);
  await ensureExchange(client.channel, exchange);

  const event = {
    eventId: randomUUID(),
    eventType: "order.created",
    version: 1,
    occurredAt: new Date().toISOString(),
    correlationId: randomUUID(),
    data: { orderId: "order_999", amount: 1234, currency: "LKR", userId: "u9" }
  };

  publishEvent(client.channel, exchange, "order.created", event);
  console.log("Published", event.eventId);

  await client.channel.close();
  await client.conn.close();
}

main().catch(console.error);
