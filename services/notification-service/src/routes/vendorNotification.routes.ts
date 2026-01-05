import { Router } from "express";
import { authVendor } from "../middlewares/authVendor.middleware";
import {
  getVendorNotifications,
  markVendorAllRead,
  markVendorNotificationRead,
} from "../controllers/vendorNotification.controller";

const router = Router();

// api-gateway proxies `/api/vendor/notifications/*` -> `${NOTIFICATION_SERVICE_URL}/*` (it strips `/api/vendor/notifications`),
// so vendor routes must also be available at the root (e.g. `/`).
router.get("/", authVendor, getVendorNotifications);
router.patch("/read-all", authVendor, markVendorAllRead);
router.patch("/:id/read", authVendor, markVendorNotificationRead);

// Direct (non-gateway) calls: `/vendor/notifications/*`
router.get("/vendor/notifications", authVendor, getVendorNotifications);
router.patch("/vendor/notifications/read-all", authVendor, markVendorAllRead);
router.patch("/vendor/notifications/:id/read", authVendor, markVendorNotificationRead);

export default router;

