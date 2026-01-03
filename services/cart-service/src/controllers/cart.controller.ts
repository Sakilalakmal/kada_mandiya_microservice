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

function presentCart(userId: string, cart: Awaited<ReturnType<typeof getCartByUserId>>) {
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
    return res.json({ ok: true, cart: presentCart(userId, cart) });
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

    await addItem(userId, parsed.data);
    const cart = await getCartByUserId(userId);
    return res.json({ ok: true, cart: presentCart(userId, cart) });
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

    const ok = await updateQty(userId, idParsed.data, parsed.data.qty);
    if (!ok) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Cart item not found." },
      });
    }

    const cart = await getCartByUserId(userId);
    return res.json({ ok: true, cart: presentCart(userId, cart) });
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
    return res.json({ ok: true, cart: presentCart(userId, cart) });
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

