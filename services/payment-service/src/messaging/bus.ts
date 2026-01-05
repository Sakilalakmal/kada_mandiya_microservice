import amqp, { type Channel, type ChannelModel } from "amqplib";
import { randomUUID } from "crypto";
import type { DomainEvent, PublishEventOptions } from "./types";

let connectionPromise: Promise<ChannelModel> | null = null;
let channelPromise: Promise<Channel> | null = null;
let exchangeAsserted = false;

export function getRabbitUrl(): string {
  return process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
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
      const channel = await conn.createChannel();

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
  channel.publish(exchange, eventType, payload, { persistent: true, contentType: "application/json" });

  console.log(`[${serviceName()}] published ${eventType} ${event.eventId}`);
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

