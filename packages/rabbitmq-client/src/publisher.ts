import amqp from "amqplib";
import { randomUUID } from "crypto";

async function main() {
  const RABBITMQ_URL =
    process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

  const EXCHANGE = "domain.events";
  const ROUTING_KEY = "order.created";

  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });

  const event = {
    eventId: randomUUID(),
    eventType: "order.created",
    version: 1,
    occurredAt: new Date().toISOString(),
    correlationId: randomUUID(),
    data: {
      orderId: "order_456",
      amount: 5000,
      currency: "LKR",
      userId: "user_2",
    },
  };

  channel.publish(EXCHANGE, ROUTING_KEY, Buffer.from(JSON.stringify(event)), {
    persistent: true,
  });

  console.log("📤 Event published:");
  console.log(event);

  await channel.close();
  await conn.close();
}

main().catch((err) => {
  console.error("❌ Publisher failed:", err);
  process.exit(1);
});
