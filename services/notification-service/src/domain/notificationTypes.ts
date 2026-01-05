import type { DomainEvent } from "../messaging/types";

export type RecipientType = "USER" | "VENDOR";

export const ORDER_CREATED = "ORDER_CREATED" as const;
export const ORDER_STATUS_UPDATED = "ORDER_STATUS_UPDATED" as const;
export const ORDER_CANCELLED = "ORDER_CANCELLED" as const;
export const PAYMENT_NOT_REQUIRED = "PAYMENT_NOT_REQUIRED" as const;
export const PAYMENT_COMPLETED = "PAYMENT_COMPLETED" as const;
export const PAYMENT_FAILED = "PAYMENT_FAILED" as const;

export type NotificationType =
  | typeof ORDER_CREATED
  | typeof ORDER_STATUS_UPDATED
  | typeof ORDER_CANCELLED
  | typeof PAYMENT_NOT_REQUIRED
  | typeof PAYMENT_COMPLETED
  | typeof PAYMENT_FAILED;

function shortId(id: string): string {
  const s = String(id ?? "");
  return s.length <= 8 ? s : s.slice(0, 8);
}

function formatAmount(amount: unknown): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export function mapEventToNotificationTemplate(
  eventType: string,
  recipientType: RecipientType,
  data: Record<string, unknown>
): { type: NotificationType; title: string; message: string; link: string | null } | null {
  const orderId = String(data.orderId ?? "");
  const orderIdShort = shortId(orderId);

  if (eventType === "order.created") {
    if (recipientType === "USER") {
      const amount = formatAmount(data.subtotal ?? data.amount);
      return {
        type: ORDER_CREATED,
        title: "Order placed",
        message: `Your order ${orderIdShort} was placed successfully. Total: LKR ${amount}.`,
        link: orderId ? `/orders/${orderId}` : "/orders",
      };
    }

    return {
      type: ORDER_CREATED,
      title: "New order received",
      message: `A new order ${orderIdShort} includes your items.`,
      link: "/vendor/orders",
    };
  }

  if (eventType === "order.status_updated") {
    const newStatus = String(data.newStatus ?? "");
    if (recipientType === "USER") {
      return {
        type: ORDER_STATUS_UPDATED,
        title: "Order updated",
        message: `Your order ${orderIdShort} is now ${newStatus}.`,
        link: orderId ? `/orders/${orderId}` : "/orders",
      };
    }
    return {
      type: ORDER_STATUS_UPDATED,
      title: "Order updated",
      message: `Order ${orderIdShort} is now ${newStatus}.`,
      link: orderId ? `/vendor/orders/${orderId}` : "/vendor/orders",
    };
  }

  if (eventType === "order.cancelled") {
    if (recipientType === "USER") {
      return {
        type: ORDER_CANCELLED,
        title: "Order cancelled",
        message: `Your order ${orderIdShort} was cancelled.`,
        link: orderId ? `/orders/${orderId}` : "/orders",
      };
    }
    return {
      type: ORDER_CANCELLED,
      title: "Order cancelled",
      message: `Order ${orderIdShort} was cancelled.`,
      link: orderId ? `/vendor/orders/${orderId}` : "/vendor/orders",
    };
  }

  if (eventType === "payment.not_required") {
    if (recipientType !== "USER") return null;
    return {
      type: PAYMENT_NOT_REQUIRED,
      title: "Payment",
      message: `Order ${orderIdShort} is Cash on Delivery. No online payment required.`,
      link: orderId ? `/orders/${orderId}` : "/orders",
    };
  }

  if (eventType === "payment.completed") {
    if (recipientType !== "USER") return null;
    const amount = formatAmount(data.amount ?? data.subtotal);
    return {
      type: PAYMENT_COMPLETED,
      title: "Payment successful",
      message: `Payment received for order ${orderIdShort}. Amount: LKR ${amount}.`,
      link: orderId ? `/orders/${orderId}` : "/orders",
    };
  }

  if (eventType === "payment.failed") {
    if (recipientType !== "USER") return null;
    return {
      type: PAYMENT_FAILED,
      title: "Payment failed",
      message: `Payment failed for order ${orderIdShort}. Please try again.`,
      link: orderId ? `/orders/${orderId}` : "/orders",
    };
  }

  return null;
}

export function extractVendorIds(event: DomainEvent<Record<string, unknown>>): string[] {
  const data = event.data ?? {};
  const ids = new Set<string>();

  const vendorId = data.vendorId;
  if (typeof vendorId === "string" && vendorId.trim()) ids.add(vendorId.trim());

  const vendorIds = data.vendorIds;
  if (Array.isArray(vendorIds)) {
    for (const id of vendorIds) {
      if (typeof id === "string" && id.trim()) ids.add(id.trim());
    }
  }

  const items = data.items;
  if (Array.isArray(items)) {
    for (const item of items) {
      const id = (item as any)?.vendorId;
      if (typeof id === "string" && id.trim()) ids.add(id.trim());
    }
  }

  return Array.from(ids);
}

