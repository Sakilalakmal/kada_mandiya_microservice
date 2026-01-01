import { connectRabbit, consumeQueue } from "./index";

async function main() {
  const url = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
  const queue = process.env.QUEUE ?? "payment-service.q";

  const client = await connectRabbit(url);

  console.log("✅ Connected. Listening...");

  await consumeQueue(client.channel, queue, async (event) => {
    console.log("📩 Event received:", event.eventType, event.data);
  });
}

main().catch(console.error);
