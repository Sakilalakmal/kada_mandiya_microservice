export type DomainEvent<T> = {
  eventId: string;
  eventType: string;
  version: number;
  occurredAt: string;
  correlationId: string;
  data: T;
};

export type PublishEventOptions = {
  correlationId?: string;
  version?: number;
};

