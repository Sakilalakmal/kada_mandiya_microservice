import { Router } from "express";
import { isAuthenticated } from "@npmkadamandiya/auth";
import { createProxy } from "../proxy/createProxy";
import { requireRole } from "../middleware/requireRole";

export function ordersRoutes(JWT_SECRET: string) {
  const router = Router();
  const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL ?? "http://localhost:4006";

  const publicProxy = createProxy({ baseUrl: ORDER_SERVICE_URL, stripPrefix: "/api/orders" });
  const authedProxy = createProxy({
    baseUrl: ORDER_SERVICE_URL,
    stripPrefix: "/api/orders",
    addUserHeaders: true,
  });

  router.get("/health", publicProxy);
  router.get("/health/db", publicProxy);

  router.use("/", isAuthenticated({ secret: JWT_SECRET }), authedProxy);

  return router;
}

export function vendorOrdersRoutes(JWT_SECRET: string) {
  const router = Router();
  const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL ?? "http://localhost:4006";

  const healthProxy = createProxy({ baseUrl: ORDER_SERVICE_URL, stripPrefix: "/api/vendor/orders" });
  const vendorBaseUrl = (() => {
    const base = ORDER_SERVICE_URL.replace(/\/+$/, "");
    return base.endsWith("/vendor/orders") ? base : `${base}/vendor/orders`;
  })();
  const vendorProxy = createProxy({
    baseUrl: vendorBaseUrl,
    stripPrefix: "/api/vendor/orders",
    addUserHeaders: true,
    addVendorHeaders: true,
  });

  router.get("/health", healthProxy);
  router.get("/health/db", healthProxy);

  router.use(
    "/",
    isAuthenticated({ secret: JWT_SECRET }),
    requireRole("vendor", { secret: JWT_SECRET }),
    vendorProxy
  );

  return router;
}
