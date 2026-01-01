import { createOrderCreatedEvent } from "./order-events";

// Simple UUID generator for test usage (avoids depending on Node's `crypto` module/types)
const randomUUID = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const event = createOrderCreatedEvent(
  {
    orderId: "order_1",
    amount: 1000,
    currency: "LKR",
    userId: "user_1"
  },
  {
    eventId: randomUUID(),
    correlationId: randomUUID()
  }
);

console.log("✅ Event created:", event);
