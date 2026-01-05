import type { Request, Response } from "express";
import { z } from "zod";
import { listOrdersForVendor, updateOrderStatusForVendor } from "../repositories/vendorOrder.repo";
import { publishEvent } from "../messaging/publisher";

function requireVendorId(req: Request, res: Response): string | null {
  const vendorId = req.vendor?.vendorId;
  if (!vendorId) {
    res.status(403).json({
      ok: false,
      error: { code: "FORBIDDEN", message: "Missing vendor identity." },
    });
    return null;
  }
  return vendorId;
}

const OrderIdSchema = z.string().uuid();
const UpdateVendorStatusSchema = z
  .object({
    status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED"]),
  })
  .strict();

export async function getVendorOrders(req: Request, res: Response) {
  try {
    const vendorId = requireVendorId(req, res);
    if (!vendorId) return;

    const orders = await listOrdersForVendor(vendorId);
    return res.json({ ok: true, orders });
  } catch (err) {
    console.error("getVendorOrders error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateVendorOrderStatus(req: Request, res: Response) {
  try {
    const vendorId = requireVendorId(req, res);
    if (!vendorId) return;

    const correlationId = req.header("x-correlation-id") ?? undefined;

    const idParsed = OrderIdSchema.safeParse(req.params.orderId);
    if (!idParsed.success) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid orderId." },
      });
    }

    const parsed = UpdateVendorStatusSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid status payload.",
          details: parsed.error.flatten(),
        },
      });
    }

    const result = await updateOrderStatusForVendor({
      vendorId,
      orderId: idParsed.data,
      status: parsed.data.status,
    });

    if (result.state === "not_found") {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Order not found." },
      });
    }
    if (result.state === "forbidden") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have items in this order." },
      });
    }

    await publishEvent(
      "order.status_updated",
      {
        orderId: idParsed.data,
        userId: result.userId,
        vendorId,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        occurredAt: result.occurredAt,
      },
      { correlationId }
    ).catch((err) => {
      console.error("publish order.status_updated failed:", err);
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("updateVendorOrderStatus error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

