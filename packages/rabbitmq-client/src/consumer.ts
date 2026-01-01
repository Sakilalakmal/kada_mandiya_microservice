import amqp from "amqplib";

async function main() {
  const RABBITMQ_URL =
    process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
  const QUEUE = process.env.QUEUE ?? "payment-service.q";

  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();

  await channel.assertQueue(QUEUE, { durable: true });

  console.log("✅ Connected to RabbitMQ");
  console.log(`👂 Waiting for messages on queue: ${QUEUE}`);

  await channel.consume(
    QUEUE,
    (msg) => {
      if (!msg) return;

      const content = msg.content.toString("utf-8");
      console.log("📩 Received message:");
      console.log(content);

      channel.ack(msg);
      console.log("✅ ACK sent (message removed from queue)");
    },
    { noAck: false }
  );
}

main().catch((err) => {
  console.error("❌ Consumer failed:", err);
  process.exit(1);
});
