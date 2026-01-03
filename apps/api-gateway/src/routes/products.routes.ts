import { Router } from "express";
import { createProxy } from "../proxy/createProxy";
import { isAuthenticated, requireRole } from "@npmkadamandiya/auth";

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
  router.get("/mine", isAuthenticated({ secret: JWT_SECRET }), requireRole("vendor"), authedProxy);
  router.post("/", isAuthenticated({ secret: JWT_SECRET }), requireRole("vendor"), authedProxy);
  router.put("/:id", isAuthenticated({ secret: JWT_SECRET }), requireRole("vendor"), authedProxy);
  router.patch("/:id/deactivate", isAuthenticated({ secret: JWT_SECRET }), requireRole("vendor"), authedProxy);

  // Public detail (keep last)
  router.get("/:id", publicProxy);

  return router;
}
