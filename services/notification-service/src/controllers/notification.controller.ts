import type { Request, Response } from "express";
import { z } from "zod";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../repositories/notification.repo";

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

const ListQuerySchema = z
  .object({
    unreadOnly: z.enum(["true", "false"]).optional().default("false"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

const NotificationIdSchema = z.string().uuid();

export async function getMyNotifications(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = ListQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query params.",
          details: parsed.error.flatten(),
        },
      });
    }

    const { total, unreadCount, notifications } = await listNotifications({
      recipientType: "USER",
      recipientId: userId,
      unreadOnly: parsed.data.unreadOnly === "true",
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });

    return res.json({
      ok: true,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      total,
      unreadCount,
      notifications,
    });
  } catch (err) {
    console.error("getMyNotifications error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function markMyAllRead(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const updatedCount = await markAllNotificationsRead({
      recipientType: "USER",
      recipientId: userId,
    });

    return res.json({ ok: true, updatedCount });
  } catch (err) {
    console.error("markMyAllRead error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function markMyNotificationRead(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = NotificationIdSchema.safeParse(req.params.id);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid notification id." } });
    }

    const result = await markNotificationRead({
      recipientType: "USER",
      recipientId: userId,
      notificationId: parsed.data,
    });

    if (result === "not_found") {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found." } });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("markMyNotificationRead error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function markAnyNotificationRead(req: Request, res: Response) {
  try {
    const parsed = NotificationIdSchema.safeParse(req.params.id);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid notification id." } });
    }

    const vendorId = req.header("x-vendor-id");
    const userId = req.header("x-user-id");

    if (vendorId) {
      const result = await markNotificationRead({
        recipientType: "VENDOR",
        recipientId: vendorId,
        notificationId: parsed.data,
      });

      if (result === "not_found") {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found." } });
      }

      return res.json({ ok: true });
    }

    if (userId) {
      const result = await markNotificationRead({
        recipientType: "USER",
        recipientId: userId,
        notificationId: parsed.data,
      });

      if (result === "not_found") {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found." } });
      }

      return res.json({ ok: true });
    }

    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing x-user-id or x-vendor-id (gateway required)." },
    });
  } catch (err) {
    console.error("markAnyNotificationRead error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

