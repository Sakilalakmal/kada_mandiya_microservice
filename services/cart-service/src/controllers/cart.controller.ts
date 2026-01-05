import type { Request, Response } from "express";
import { z } from "zod";
import {
  addItem,
  clearCart,
  getCartByUserId,
  removeItem,
  updateQty,
} from "../repositories/cart.repo";

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function productBaseUrl() {
  return process.env.PRODUCT_SERVICE_URL ?? "http://localhost:4004";
}

function buildProductUrl(pathname: string) {
  const base = productBaseUrl();
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const relative = pathname.replace(/^\/+/, "");
  return new URL(relative, normalizedBase).toString();
}

type StockCheckResponse =
  | { ok: true; items: { productId: string; stockQty: number }[] }
  | { ok: false; error?: { code?: string; message?: string } };

async function fetchStockQtyMap(productIds: string[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(productIds.filter((id) => typeof id === "string" && id.trim().length > 0)));
  if (unique.length === 0) return {};

  const headers: Record<string, string> = { "content-type": "application/json" };
  const internalKey = process.env.INTERNAL_API_KEY;
  if (internalKey) headers["x-internal-key"] = internalKey;

  const r = await fetch(buildProductUrl("/internal/stock/check"), {
    method: "POST",
    headers,
    body: JSON.stringify({ productIds: unique }),
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`product-service stock check failed: ${r.status} ${text}`);
  }

  const data = (await r.json().catch(() => null)) as StockCheckResponse | null;
  if (!data || !("ok" in data) || !data.ok || !Array.isArray((data as any).items)) {
    throw new Error("product-service stock check returned invalid response");
  }

  const map: Record<string, number> = {};
  for (const item of data.items) {
    map[String(item.productId)] = Math.max(0, Math.floor(Number(item.stockQty ?? 0)));
  }
  return map;
}

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

function presentCart(
  userId: string,
  cart: Awaited<ReturnType<typeof getCartByUserId>>,
  stockQtyByProductId: Record<string, number> = {}
) {
  if (!cart) {
    return {
      cartId: null as string | null,
      userId,
      items: [] as any[],
      subtotal: 0,
    };
  }

  const items = cart.items.map((item) => {
    const unitPrice = Number(item.unitPrice);
    const qty = Number(item.qty);
    const lineTotal = roundMoney(unitPrice * qty);
    return {
      itemId: item.itemId,
      productId: item.productId,
      vendorId: item.vendorId,
      title: item.title,
      imageUrl: item.imageUrl,
      unitPrice,
      qty,
      lineTotal,
      stockQty: stockQtyByProductId[item.productId] ?? 0,
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  return { cartId: cart.cartId, userId: cart.userId, items, subtotal };
}

const AddItemSchema = z
  .object({
    productId: z.string().min(1).max(100),
    qty: z.number().int().min(1),
    unitPrice: z.number().min(0),
    title: z.string().min(1).max(200),
    imageUrl: z
      .string()
      .max(500)
      .optional()
      .refine((v) => !v || /^https?:\/\//i.test(v), { message: "Must be a valid URL" }),
    vendorId: z.string().max(100).optional(),
  })
  .strict();

const UpdateQtySchema = z
  .object({
    qty: z.number().int().min(1),
  })
  .strict();

const UuidSchema = z.string().uuid();

export async function getCart(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const cart = await getCartByUserId(userId);

    const stockMap = cart?.items?.length ? await fetchStockQtyMap(cart.items.map((i) => i.productId)) : {};
    return res.json({ ok: true, cart: presentCart(userId, cart, stockMap) });
  } catch (err) {
    console.error("getCart error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function addCartItem(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = AddItemSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid add-to-cart payload.",
          details: parsed.error.flatten(),
        },
      });
    }

    const currentCart = await getCartByUserId(userId);
    const currentQty = Number(
      currentCart?.items?.find((i) => i.productId === parsed.data.productId)?.qty ?? 0
    );

    const stockMap = await fetchStockQtyMap([parsed.data.productId]);
    const stockQty = stockMap[parsed.data.productId] ?? 0;

    if (stockQty <= 0) {
      return res.status(409).json({
        error: { code: "OUT_OF_STOCK", message: "This item is out of stock." },
      });
    }

    const remaining = stockQty - currentQty;
    if (remaining <= 0) {
      return res.status(409).json({
        error: { code: "OUT_OF_STOCK", message: "Not enough stock for this item." },
      });
    }

    const qtyToAdd = Math.max(0, Math.min(parsed.data.qty, remaining));
    if (qtyToAdd <= 0) {
      return res.status(409).json({
        error: { code: "OUT_OF_STOCK", message: "Not enough stock for this item." },
      });
    }

    await addItem(userId, { ...parsed.data, qty: qtyToAdd });
    const cart = await getCartByUserId(userId);
    const stockMapAfter = cart?.items?.length ? await fetchStockQtyMap(cart.items.map((i) => i.productId)) : {};
    return res.json({ ok: true, cart: presentCart(userId, cart, stockMapAfter) });
  } catch (err) {
    console.error("addCartItem error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateCartItemQty(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const idParsed = UuidSchema.safeParse(req.params.itemId);
    if (!idParsed.success) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid itemId." },
      });
    }

    const parsed = UpdateQtySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid qty payload.",
          details: parsed.error.flatten(),
        },
      });
    }

    const currentCart = await getCartByUserId(userId);
    const targetItem = currentCart?.items?.find((i) => i.itemId === idParsed.data);
    if (!targetItem) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Cart item not found." },
      });
    }

    const stockMap = await fetchStockQtyMap([targetItem.productId]);
    const stockQty = stockMap[targetItem.productId] ?? 0;

    if (stockQty <= 0) {
      return res.status(409).json({
        error: { code: "OUT_OF_STOCK", message: "This item is out of stock." },
      });
    }

    const boundedQty = Math.max(1, Math.min(parsed.data.qty, stockQty));
    const ok = await updateQty(userId, idParsed.data, boundedQty);
    if (!ok) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Cart item not found." },
      });
    }

    const cart = await getCartByUserId(userId);
    const stockMapAfter = cart?.items?.length ? await fetchStockQtyMap(cart.items.map((i) => i.productId)) : {};
    return res.json({ ok: true, cart: presentCart(userId, cart, stockMapAfter) });
  } catch (err) {
    console.error("updateCartItemQty error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteCartItem(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const idParsed = UuidSchema.safeParse(req.params.itemId);
    if (!idParsed.success) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid itemId." },
      });
    }

    const ok = await removeItem(userId, idParsed.data);
    if (!ok) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Cart item not found." },
      });
    }

    const cart = await getCartByUserId(userId);
    const stockMapAfter = cart?.items?.length ? await fetchStockQtyMap(cart.items.map((i) => i.productId)) : {};
    return res.json({ ok: true, cart: presentCart(userId, cart, stockMapAfter) });
  } catch (err) {
    console.error("deleteCartItem error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function clearUserCart(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    await clearCart(userId);
    return res.json({ ok: true, message: "cart cleared" });
  } catch (err) {
    console.error("clearUserCart error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

