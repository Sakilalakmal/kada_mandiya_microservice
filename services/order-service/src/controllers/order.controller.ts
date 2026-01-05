import type { Request, Response } from "express";
import { z } from "zod";
import {
  cancelPendingOrder,
  createOrderWithItems,
  getOrderByIdForUser,
  listOrdersByUserId,
  listVendorIdsByOrderId,
} from "../repositories/order.repo";
import { publishEvent } from "../messaging/publisher";

function requireUserId(req: Request, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing authenticated user." },
    });
    return null;
  }
  return userId;
}

function toCents(amount: number): number {
  if (!Number.isFinite(amount)) throw new Error("Invalid money amount");
  const fixed = amount.toFixed(2);
  const [whole, fraction] = fixed.split(".");
  return Number(whole) * 100 + Number(fraction ?? "0");
}

function fromCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function cartBaseUrl() {
  return process.env.CART_SERVICE_URL ?? "http://localhost:4005";
}

function buildCartUrl(pathname: string) {
  const base = cartBaseUrl();
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const relative = pathname.replace(/^\/+/, "");
  return new URL(relative, normalizedBase).toString();
}

type CartItem = {
  itemId: string;
  productId: string;
  vendorId?: string | null;
  title: string;
  imageUrl?: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

type CartResponse = {
  ok: boolean;
  cart?: {
    items?: CartItem[];
  };
};

async function fetchCart(userId: string) {
  const r = await fetch(buildCartUrl("/"), {
    method: "GET",
    headers: { "x-user-id": userId },
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`cart-service GET / failed: ${r.status} ${text}`);
  }

  const data = (await r.json().catch(() => null)) as CartResponse | null;
  if (!data?.ok) throw new Error("cart-service returned invalid response");
  return data;
}

async function clearCart(userId: string) {
  const r = await fetch(buildCartUrl("/"), {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });
  return r.ok;
}

const CreateOrderSchema = z
  .object({
    deliveryAddress: z.string().min(5).max(300),
    mobile: z.string().max(30).optional(),
    paymentMethod: z.enum(["COD"]).optional().default("COD"),
  })
  .strict();

const OrderIdSchema = z.string().uuid();

export async function createOrder(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const correlationId = req.header("x-correlation-id") ?? undefined;

    const parsed = CreateOrderSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid order payload.",
          details: parsed.error.flatten(),
        },
      });
    }

    const cart = await fetchCart(userId);
    const items = cart.cart?.items ?? [];

    if (items.length === 0) {
      return res.status(400).json({
        ok: false,
        error: { code: "CART_EMPTY", message: "Cart is empty." },
      });
    }

    const orderItems = items.map((item) => {
      const unitCents = toCents(Number(item.unitPrice));
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty < 1) throw new Error("Invalid cart qty");
      const lineCents = unitCents * qty;
      return {
        productId: String(item.productId),
        vendorId: item.vendorId === null || item.vendorId === undefined ? null : String(item.vendorId),
        title: String(item.title),
        imageUrl: item.imageUrl === null || item.imageUrl === undefined ? null : String(item.imageUrl),
        unitPrice: fromCents(unitCents),
        qty,
        lineTotal: fromCents(lineCents),
        lineCents,
      };
    });

    const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineCents, 0);
    const subtotal = fromCents(subtotalCents);

    const vendorIds = Array.from(
      new Set(
        orderItems
          .map((item) => item.vendorId)
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
          .map((id) => id.trim())
      )
    );

    const { orderId, createdAt } = await createOrderWithItems({
      userId,
      deliveryAddress: parsed.data.deliveryAddress,
      mobile: parsed.data.mobile ?? null,
      paymentMethod: parsed.data.paymentMethod ?? "COD",
      subtotal,
      items: orderItems.map(({ lineCents, ...rest }) => rest),
    });

    const cleared = await clearCart(userId).catch((err) => {
      console.error("clearCart error:", err);
      return false;
    });
    if (!cleared) console.warn("cart-service cart not cleared after order commit");

    await publishEvent(
      "order.created",
      {
        orderId,
        userId,
        vendorIds,
        subtotal,
        currency: "LKR",
        status: "PENDING",
        createdAt,
      },
      { correlationId }
    ).catch((err) => {
      console.error("publish order.created failed:", err);
    });

    return res.status(201).json({
      ok: true,
      message: "Order created",
      orderId,
      status: "PENDING",
      subtotal,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getMyOrders(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const orders = await listOrdersByUserId(userId);
    return res.json({ ok: true, orders });
  } catch (err) {
    console.error("getMyOrders error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const idParsed = OrderIdSchema.safeParse(req.params.orderId);
    if (!idParsed.success) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid orderId." },
      });
    }

    const order = await getOrderByIdForUser(userId, idParsed.data);
    if (!order) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Order not found." },
      });
    }

    return res.json({ ok: true, order });
  } catch (err) {
    console.error("getOrder error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function cancelOrder(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const correlationId = req.header("x-correlation-id") ?? undefined;

    const idParsed = OrderIdSchema.safeParse(req.params.orderId);
    if (!idParsed.success) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid orderId." },
      });
    }

    const result = await cancelPendingOrder(userId, idParsed.data);
    if (result.state === "not_found") {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Order not found." },
      });
    }
    if (result.state === "not_pending") {
      return res.status(400).json({
        error: { code: "INVALID_STATE", message: "Only PENDING orders can be cancelled." },
      });
    }

    const vendorIds = await listVendorIdsByOrderId(idParsed.data).catch((err) => {
      console.error("listVendorIdsByOrderId error:", err);
      return [] as string[];
    });

    await publishEvent(
      "order.cancelled",
      {
        orderId: idParsed.data,
        userId,
        vendorIds,
        previousStatus: result.previousStatus,
        newStatus: "CANCELLED",
        occurredAt: result.occurredAt,
      },
      { correlationId }
    ).catch((err) => {
      console.error("publish order.cancelled failed:", err);
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("cancelOrder error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
