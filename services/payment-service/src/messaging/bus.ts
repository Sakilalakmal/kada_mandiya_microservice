import amqp, { type Channel, type ChannelModel } from "amqplib";
import { randomUUID } from "crypto";
import type { DomainEvent, PublishEventOptions } from "./types";

let connectionPromise: Promise<ChannelModel> | null = null;
let channelPromise: Promise<Channel> | null = null;
let exchangeAsserted = false;
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
        console.warn(`[payment-service] RABBITMQ_URL points to localhost (DEV-ONLY): ${resolved}`);
      }
      if (/guest:guest@/i.test(resolved)) {
        console.warn("[payment-service] RABBITMQ_URL appears to use guest/guest (DEV-ONLY).");
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
        `[payment-service] RABBITMQ_URL is not set; falling back to ${fallback} (DEV-ONLY default)`
      );
    }
  }
  return fallback;
}

export function getEventExchange(): string {
  return process.env.EVENT_EXCHANGE ?? "domain.events";
}

function serviceName(): string {
  return process.env.SERVICE_NAME ?? process.env.npm_package_name ?? "service";
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

      return channel;
    })().catch((err) => {
      channelPromise = null;
      exchangeAsserted = false;
      throw err;
    });
  }

  return channelPromise;
}

export async function publishEvent<T>(
  eventType: string,
  data: T,
  options?: PublishEventOptions
): Promise<DomainEvent<T>> {
  const event: DomainEvent<T> = {
    eventId: randomUUID(),
    eventType,
    version: options?.version ?? 1,
    occurredAt: new Date().toISOString(),
    correlationId: options?.correlationId ?? randomUUID(),
    data,
  };

  const channel = await getRabbitChannel();
  const exchange = getEventExchange();

  const payload = Buffer.from(JSON.stringify(event));
  const maxAttempts = Number(process.env.RABBITMQ_PUBLISH_RETRIES ?? 3);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      channel.publish(exchange, eventType, payload, { persistent: true, contentType: "application/json" });
      const waitForConfirms = (channel as any).waitForConfirms?.bind(channel);
      if (typeof waitForConfirms === "function") await waitForConfirms();
      console.log(`[${serviceName()}] published ${eventType} ${event.eventId}`);
      return event;
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      const delayMs = Math.min(5000, 250 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
      console.warn(`[${serviceName()}] publish retry ${attempt}/${maxAttempts} for ${eventType}:`, err);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return event;
}

export async function closeEventBus(): Promise<void> {
  const channel = await channelPromise?.catch(() => null);
  const conn = await connectionPromise?.catch(() => null);

  channelPromise = null;
  connectionPromise = null;
  exchangeAsserted = false;

  await channel?.close().catch(() => {});
  await conn?.close().catch(() => {});
}

