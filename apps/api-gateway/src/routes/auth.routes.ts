import { Router } from "express";
import { createProxy } from "../proxy/createProxy";

export function authRoutes() {
  const router = Router();
  const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? "http://localhost:4000";

  router.use("/", createProxy({ baseUrl: AUTH_SERVICE_URL, stripPrefix: "/auth" }));
  return router;
}
