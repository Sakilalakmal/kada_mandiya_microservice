import amqp, { type Channel, type ChannelModel } from "amqplib";

let connectionPromise: Promise<ChannelModel> | null = null;
let channelPromise: Promise<Channel> | null = null;
let exchangeAsserted = false;
let shutdownHooksRegistered = false;
let devUrlWarningPrinted = false;
let prodUrlWarningPrinted = false;

export function getRabbitUrl(): string {
  const url = process.env.RABBITMQ_URL;
  const resolved = url ?? "amqp://guest:guest@localhost:5672";

  if (!prodUrlWarningPrinted) {
    prodUrlWarningPrinted = true;
    const env = (process.env.NODE_ENV ?? "").toLowerCase();
    if (env === "production") {
      if (/localhost|127\.0\.0\.1/i.test(resolved)) {
        console.warn(`[review-service] RABBITMQ_URL points to localhost (DEV-ONLY): ${resolved}`);
      }
      if (/guest:guest@/i.test(resolved)) {
        console.warn("[review-service] RABBITMQ_URL appears to use guest/guest (DEV-ONLY).");
      }
    }
  }

  if (url) return resolved;

  const fallback = resolved;
  if (!devUrlWarningPrinted) {
    devUrlWarningPrinted = true;
    const env = (process.env.NODE_ENV ?? "").toLowerCase();
    if (env && env !== "development" && env !== "test") {
      console.warn(
        `[review-service] RABBITMQ_URL is not set; falling back to ${fallback} (DEV-ONLY default)`
      );
    }
  }
  return fallback;
}

export function getEventExchange(): string {
  return process.env.EVENT_EXCHANGE ?? "domain.events";
}

function registerShutdownHooks() {
  if (shutdownHooksRegistered) return;
  shutdownHooksRegistered = true;

  const shutdown = async () => {
    await closeRabbit().catch(() => {});
  };

  process.once("SIGINT", () => void shutdown().finally(() => process.exit(0)));
  process.once("SIGTERM", () => void shutdown().finally(() => process.exit(0)));
  process.once("beforeExit", () => void shutdown());
}

async function getConnection(): Promise<ChannelModel> {
  if (!connectionPromise) {
    connectionPromise = amqp.connect(getRabbitUrl()).catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
}

export async function getRabbitChannel(): Promise<Channel> {
  if (!channelPromise) {
    channelPromise = (async () => {
      const conn = await getConnection();
      conn.once("close", () => {
        connectionPromise = null;
        channelPromise = null;
        exchangeAsserted = false;
      });
      conn.once("error", () => {
        connectionPromise = null;
        channelPromise = null;
        exchangeAsserted = false;
      });

      const channel = await (conn as any).createConfirmChannel?.() ?? (await conn.createChannel());
      channel.once("close", () => {
        channelPromise = null;
        exchangeAsserted = false;
      });
      channel.once("error", () => {
        channelPromise = null;
        exchangeAsserted = false;
      });

      if (!exchangeAsserted) {
        await channel.assertExchange(getEventExchange(), "topic", { durable: true });
        exchangeAsserted = true;
      }

      registerShutdownHooks();
      return channel;
    })().catch((err) => {
      channelPromise = null;
      exchangeAsserted = false;
      throw err;
    });
  }

  return channelPromise;
}

export async function closeRabbit(): Promise<void> {
  const channel = await channelPromise?.catch(() => null);
  const conn = await connectionPromise?.catch(() => null);

  channelPromise = null;
  connectionPromise = null;
  exchangeAsserted = false;

  await channel?.close().catch(() => {});
  await conn?.close().catch(() => {});
}
