import { Router } from "express";
import { isAuthenticated } from "@npmkadamandiya/auth";
import { createProxy } from "../proxy/createProxy";
import { requireRole } from "../middleware/requireRole";

export function notificationsRoutes(JWT_SECRET: string) {
  const router = Router();
  const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:4011";

  const publicProxy = createProxy({ baseUrl: NOTIFICATION_SERVICE_URL, stripPrefix: "/api/notifications" });
  const authedProxy = createProxy({
    baseUrl: NOTIFICATION_SERVICE_URL,
    stripPrefix: "/api/notifications",
    addUserHeaders: true,
  });

  router.get("/health", publicProxy);
  router.get("/health/db", publicProxy);

  router.use("/", isAuthenticated({ secret: JWT_SECRET }), authedProxy);

  return router;
}

export function vendorNotificationsRoutes(JWT_SECRET: string) {
  const router = Router();
  const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:4011";

  const publicProxy = createProxy({ baseUrl: NOTIFICATION_SERVICE_URL, stripPrefix: "/api/vendor/notifications" });
  const vendorProxy = createProxy({
    baseUrl: NOTIFICATION_SERVICE_URL,
    stripPrefix: "/api/vendor/notifications",
    addVendorHeaders: true,
  });

  router.get("/health", publicProxy);
  router.get("/health/db", publicProxy);

  router.use(
    "/",
    isAuthenticated({ secret: JWT_SECRET }),
    requireRole("vendor", { secret: JWT_SECRET }),
    vendorProxy
  );

  return router;
}

