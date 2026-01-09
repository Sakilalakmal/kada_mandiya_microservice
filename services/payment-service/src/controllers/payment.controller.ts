import type { Request, Response } from "express";
import { z } from "zod";
import { publishEvent } from "../messaging/bus";
import {
  attachStripeRefsByOrderId,
  findPaymentByOrderId,
  listPaymentsByUserId,
  setPaymentStatusFromStripe,
  updatePaymentStatus,
  type PaymentStatus,
} from "../repositories/payment.repo";
import { getStripe } from "../stripe/stripeClient";
import {
  getStripeCancelUrl,
  getStripeCheckoutMode,
  getStripeSuccessUrl,
  getStripeWebhookSecret,
  toStripeCurrencyCode,
  toStripeMinorAmount,
} from "../stripe/stripeConfig";

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
        stripeSessionId: payment.stripeSessionId,
        stripePaymentIntentId: payment.stripePaymentIntentId,
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

export async function createCheckoutSession(req: Request, res: Response) {
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
    if (payment.method !== "ONLINE") {
      return res.status(400).json({ error: { code: "INVALID_STATE", message: "This order does not require payment." } });
    }
    if (payment.status === "COMPLETED") {
      return res.status(409).json({ error: { code: "ALREADY_PAID", message: "Payment already completed." } });
    }

    const stripe = getStripe();
    const currency = toStripeCurrencyCode(payment.currency);
    const unitAmount = toStripeMinorAmount(payment.amount);

    const mode = getStripeCheckoutMode();
    const session = await stripe.checkout.sessions.create({
      mode,
      client_reference_id: payment.orderId,
      success_url: getStripeSuccessUrl(payment.orderId),
      cancel_url: getStripeCancelUrl(payment.orderId),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: { name: "Kada Mandiya order" },
          },
        },
      ],
      metadata: {
        orderId: payment.orderId,
        userId: payment.userId,
      },
      ...(mode === "payment"
        ? { payment_intent_data: { metadata: { orderId: payment.orderId, userId: payment.userId } } }
        : {}),
    });

    const sessionId = session.id ?? null;
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

    await attachStripeRefsByOrderId({
      orderId: payment.orderId,
      stripeSessionId: sessionId,
      stripePaymentIntentId: paymentIntentId,
    });

    const url = session.url;
    if (!url) {
      return res.status(502).json({
        error: { code: "STRIPE_ERROR", message: "Stripe session URL missing." },
      });
    }

    return res.json({ ok: true, url });
  } catch (err) {
    console.error("createCheckoutSession error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.header("stripe-signature");
  if (!signature) {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Missing Stripe signature." } });
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Webhook body must be raw bytes." } });
  }

  let event: any;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (err) {
    console.error("[payment-service] webhook signature verification failed:", err);
    return res.status(400).json({ error: { code: "BAD_SIGNATURE", message: "Webhook signature verification failed." } });
  }

  try {
    const type = String(event?.type ?? "");

    const maybePublish = async (updated: Awaited<ReturnType<typeof setPaymentStatusFromStripe>>) => {
      if (!updated) return;
      const eventType = updated.status === "COMPLETED" ? "payment.completed" : "payment.failed";
      const correlationId = updated.correlationId ?? event.id ?? undefined;

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
    };

    if (type === "checkout.session.completed") {
      const session = event.data?.object;
      const orderId = String(session?.metadata?.orderId ?? "");
      if (!orderId) return res.json({ received: true });

      const stripeSessionId = typeof session?.id === "string" ? session.id : null;
      const stripePaymentIntentId = typeof session?.payment_intent === "string" ? session.payment_intent : null;

      const updated = await setPaymentStatusFromStripe({
        orderId,
        status: "COMPLETED",
        stripeSessionId,
        stripePaymentIntentId,
      });
      await maybePublish(updated);
      return res.json({ received: true });
    }

    if (type === "checkout.session.async_payment_failed") {
      const session = event.data?.object;
      const orderId = String(session?.metadata?.orderId ?? "");
      if (!orderId) return res.json({ received: true });

      const stripeSessionId = typeof session?.id === "string" ? session.id : null;
      const stripePaymentIntentId = typeof session?.payment_intent === "string" ? session.payment_intent : null;

      const updated = await setPaymentStatusFromStripe({
        orderId,
        status: "FAILED",
        stripeSessionId,
        stripePaymentIntentId,
      });
      await maybePublish(updated);
      return res.json({ received: true });
    }

    if (type === "payment_intent.payment_failed" || type === "payment_intent.succeeded") {
      const paymentIntent = event.data?.object;
      const orderId = String(paymentIntent?.metadata?.orderId ?? "");
      if (!orderId) return res.json({ received: true });

      const stripePaymentIntentId = typeof paymentIntent?.id === "string" ? paymentIntent.id : null;
      const status = type === "payment_intent.succeeded" ? "COMPLETED" : "FAILED";

      const updated = await setPaymentStatusFromStripe({
        orderId,
        status,
        stripePaymentIntentId,
      });
      await maybePublish(updated);
      return res.json({ received: true });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("[payment-service] webhook handler error:", err);
    // Respond 200 to avoid webhook retries for transient mapping issues; Stripe will retry on 5xx.
    return res.status(200).json({ received: true });
  }
}
