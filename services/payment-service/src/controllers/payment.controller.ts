import type { Request, Response } from "express";
import { z } from "zod";
import { publishEvent } from "../messaging/bus";
import {
  findPaymentByOrderId,
  listPaymentsByUserId,
  updatePaymentStatus,
  type PaymentStatus,
} from "../repositories/payment.repo";

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

const OrderIdSchema = z.string().min(1).max(100);

export async function getPaymentByOrderId(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = OrderIdSchema.safeParse(req.params.orderId);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid orderId." } });
    }

    const payment = await findPaymentByOrderId(parsed.data);
    if (!payment) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Payment not found." } });
    }
    if (payment.userId !== userId) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied." } });
    }

    return res.json({
      ok: true,
      payment: {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        provider: payment.provider,
        providerRef: payment.providerRef,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    });
  } catch (err) {
    console.error("getPaymentByOrderId error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getMyPayments(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const payments = await listPaymentsByUserId(userId);
    return res.json({ ok: true, payments });
  } catch (err) {
    console.error("getMyPayments error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

function isDevMode(): boolean {
  return (process.env.NODE_ENV ?? "").toLowerCase() !== "production";
}

async function simulateStatus(req: Request, res: Response, status: PaymentStatus, eventType: string) {
  if (!isDevMode()) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found." } });
  }

  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = OrderIdSchema.safeParse(req.params.orderId);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid orderId." } });
  }

  const existing = await findPaymentByOrderId(parsed.data);
  if (!existing) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Payment not found." } });
  }
  if (existing.userId !== userId) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied." } });
  }

  const updated = await updatePaymentStatus(parsed.data, status);
  if (!updated) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Payment not found." } });
  }

  const correlationId = req.header("x-correlation-id") ?? updated.correlationId ?? undefined;

  await publishEvent(
    eventType,
    {
      orderId: updated.orderId,
      userId: updated.userId,
      amount: updated.amount,
      currency: updated.currency,
      status: updated.status,
    },
    { correlationId }
  ).catch((err) => console.error(`publish ${eventType} failed:`, err));

  return res.json({ ok: true });
}

export async function simulateSuccess(req: Request, res: Response) {
  return simulateStatus(req, res, "COMPLETED", "payment.completed");
}

export async function simulateFail(req: Request, res: Response) {
  return simulateStatus(req, res, "FAILED", "payment.failed");
}

