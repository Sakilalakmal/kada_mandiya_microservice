import { Router } from "express";
import { isAuthenticated } from "@npmkadamandiya/auth";
import { createProxy } from "../proxy/createProxy";

export function vendorsRoutes(JWT_SECRET: string) {
  const router = Router();
  const VENDOR_SERVICE_URL = process.env.VENDOR_SERVICE_URL ?? "http://localhost:4003";

  router.use(
    "/",
    isAuthenticated({ secret: JWT_SECRET }),
    createProxy({ baseUrl: VENDOR_SERVICE_URL, stripPrefix: "/vendors", addUserHeaders: true })
  );
  return router;
}
