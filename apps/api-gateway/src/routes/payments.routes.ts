import { Router } from "express";
import { isAuthenticated } from "@npmkadamandiya/auth";
import { createProxy } from "../proxy/createProxy";

export function paymentsRoutes(JWT_SECRET: string) {
  const router = Router();
  const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL ?? "http://localhost:4010";

  const publicProxy = createProxy({ baseUrl: PAYMENT_SERVICE_URL, stripPrefix: "/api/payments" });
  const authedProxy = createProxy({
    baseUrl: PAYMENT_SERVICE_URL,
    stripPrefix: "/api/payments",
    addUserHeaders: true,
  });

  router.get("/health", publicProxy);
  router.get("/health/db", publicProxy);

  router.use("/", isAuthenticated({ secret: JWT_SECRET }), authedProxy);

  return router;
}

