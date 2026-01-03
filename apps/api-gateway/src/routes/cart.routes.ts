import { Router } from "express";
import { isAuthenticated } from "@npmkadamandiya/auth";
import { createProxy } from "../proxy/createProxy";

export function cartRoutes(JWT_SECRET: string) {
  const router = Router();
  const CART_SERVICE_URL = process.env.CART_SERVICE_URL ?? "http://localhost:4005";

  const publicProxy = createProxy({ baseUrl: CART_SERVICE_URL, stripPrefix: "/api/cart" });
  const authedProxy = createProxy({
    baseUrl: CART_SERVICE_URL,
    stripPrefix: "/api/cart",
    addUserHeaders: true,
  });

  router.get("/health", publicProxy);
  router.get("/health/db", publicProxy);

  router.use("/", isAuthenticated({ secret: JWT_SECRET }), authedProxy);

  return router;
}

