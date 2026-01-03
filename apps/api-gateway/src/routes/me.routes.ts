import { Router } from "express";
import { isAuthenticated } from "@npmkadamandiya/auth";
import { createProxy } from "../proxy/createProxy";

export function meRoutes(JWT_SECRET: string) {
  const router = Router();
  const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? "http://localhost:4002";

  router.use(
    "/",
    isAuthenticated({ secret: JWT_SECRET }),
    createProxy({ baseUrl: USER_SERVICE_URL, stripPrefix: "/me", addUserHeaders: true })
  );
  return router;
}
