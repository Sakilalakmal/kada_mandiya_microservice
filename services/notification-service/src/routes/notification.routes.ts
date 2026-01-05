import { Router } from "express";
import { getPool } from "../db/pool";
import { authUser } from "../middlewares/authUser.middleware";
import {
  getMyNotifications,
  markAnyNotificationRead,
  markMyAllRead,
  markMyNotificationRead,
} from "../controllers/notification.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "notification-service", port: 4011 });
});

router.get("/health/db", async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1");
    return res.json({ ok: true });
  } catch (err) {
    console.error("health/db error:", err);
    return res.status(500).json({ ok: false });
  }
});

// api-gateway proxies `/api/notifications/*` -> `${NOTIFICATION_SERVICE_URL}/*` (it strips `/api/notifications`),
// so this service must serve routes at the root (e.g. `/me`).
router.get("/me", authUser, getMyNotifications);
router.patch("/me/read-all", authUser, markMyAllRead);
router.patch("/:id/read", markAnyNotificationRead);

// Direct (non-gateway) calls: `/notifications/*`
router.get("/notifications/me", authUser, getMyNotifications);
router.patch("/notifications/me/read-all", authUser, markMyAllRead);
router.patch("/notifications/:id/read", authUser, markMyNotificationRead);

export default router;

