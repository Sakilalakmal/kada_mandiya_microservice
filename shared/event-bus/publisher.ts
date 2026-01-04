import { randomUUID } from "crypto";
import type { DomainEvent, PublishEventOptions } from "./eventTypes";
import { closeRabbit, getEventExchange, getRabbitChannel } from "./rabbit";

function serviceName(): string {
  return process.env.SERVICE_NAME ?? process.env.npm_package_name ?? "service";
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
  await closeRabbit();
}

