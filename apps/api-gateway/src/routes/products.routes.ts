import { Router } from "express";
import { createProxy } from "../proxy/createProxy";
import { isAuthenticated } from "@npmkadamandiya/auth";
import { requireRole } from "../middleware/requireRole";

export function productsRoutes(JWT_SECRET: string) {
  const router = Router();
  const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL ?? "http://localhost:4004";

  const publicProxy = createProxy({ baseUrl: PRODUCT_SERVICE_URL, stripPrefix: "/products" });
  const authedProxy = createProxy({
    baseUrl: PRODUCT_SERVICE_URL,
    stripPrefix: "/products",
    addUserHeaders: true,
  });

  // Public
  router.get("/", publicProxy);

  // Vendor (protected) — put /mine BEFORE /:id
  router.get(
    "/mine",
    isAuthenticated({ secret: JWT_SECRET }),
    requireRole("vendor", { secret: JWT_SECRET }),
    authedProxy
  );
  router.post(
    "/",
    isAuthenticated({ secret: JWT_SECRET }),
    requireRole("vendor", { secret: JWT_SECRET }),
    authedProxy
  );
  router.put(
    "/:id",
    isAuthenticated({ secret: JWT_SECRET }),
    requireRole("vendor", { secret: JWT_SECRET }),
    authedProxy
  );
  router.patch(
    "/:id/deactivate",
    isAuthenticated({ secret: JWT_SECRET }),
    requireRole("vendor", { secret: JWT_SECRET }),
    authedProxy
  );
  router.patch(
    "/:id/reactivate",
    isAuthenticated({ secret: JWT_SECRET }),
    requireRole("vendor", { secret: JWT_SECRET }),
    authedProxy
  );

  // Public detail (keep last)
  router.get("/:id", publicProxy);

  return router;
}
