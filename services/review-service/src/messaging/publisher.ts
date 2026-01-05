import { randomUUID } from "crypto";
import type { DomainEvent, PublishEventOptions } from "./eventTypes";
import { closeRabbit, getEventExchange, getRabbitChannel } from "./rabbit";

function serviceName(): string {
  return process.env.SERVICE_NAME ?? process.env.npm_package_name ?? "service";
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number, baseMs: number, maxMs: number) {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(250, exp));
  return Math.min(maxMs, exp + jitter);
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
      const delayMs = backoffMs(attempt, 250, 5000);
      console.warn(`[${serviceName()}] publish retry ${attempt}/${maxAttempts} for ${eventType}:`, err);
      await sleep(delayMs);
    }
  }

  return event;
}

export async function closeEventBus(): Promise<void> {
  await closeRabbit();
}

