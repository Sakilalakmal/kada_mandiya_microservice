import { Router } from "express";
import { isAuthenticated } from "@npmkadamandiya/auth";
import { createProxy } from "../proxy/createProxy";

export function reviewsRoutes(JWT_SECRET: string) {
  const router = Router();
  const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL ?? "http://localhost:4007";

  const publicProxy = createProxy({ baseUrl: REVIEW_SERVICE_URL, stripPrefix: "/api/reviews" });
  const authedProxy = createProxy({
    baseUrl: REVIEW_SERVICE_URL,
    stripPrefix: "/api/reviews",
    addUserHeaders: true,
  });

  router.get("/health", publicProxy);
  router.get("/health/db", publicProxy);

  // Public (also accessible under /api/products/*)
  router.get("/products/:productId/reviews", publicProxy);
  router.get("/products/:productId/rating", publicProxy);

  // Everything else is protected (gateway injects x-user-id)
  router.use("/", isAuthenticated({ secret: JWT_SECRET }), authedProxy);

  return router;
}

export function productReviewRoutes() {
  const router = Router();
  const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL ?? "http://localhost:4007";

  const proxy = createProxy({
    baseUrl: `${REVIEW_SERVICE_URL}/products`,
    stripPrefix: "/api/products",
  });

  router.get("/:productId/reviews", proxy);
  router.get("/:productId/rating", proxy);

  return router;
}
