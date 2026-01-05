import "dotenv/config";
import express from "express";
import cors from "cors";
import { isAuthenticated } from "@npmkadamandiya/auth";

import { correlationId } from "./middleware/correlationId";
import { authRoutes } from "./routes/auth.routes";
import { usersRoutes } from "./routes/users.routes";
import { meRoutes } from "./routes/me.routes";
import { vendorsRoutes } from "./routes/vendors.routes";
import { productsRoutes } from "./routes/products.routes";
import { cartRoutes } from "./routes/cart.routes";
import { ordersRoutes, vendorOrdersRoutes } from "./routes/orders.routes";
import { productReviewRoutes, reviewsRoutes } from "./routes/reviews.routes";
import { paymentsRoutes } from "./routes/payments.routes";
import { notificationsRoutes, vendorNotificationsRoutes } from "./routes/notifications.routes";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(correlationId);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api-gateway" });
});

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

// Routes - Order matters! More specific routes (/users) must come BEFORE generic ones (/me)
app.use("/auth", authRoutes());
app.use("/users", usersRoutes(JWT_SECRET));  // Must be before /me to handle /users/me correctly
app.use("/vendors", vendorsRoutes(JWT_SECRET));
app.use("/products", productsRoutes(JWT_SECRET));
app.use("/api/cart", cartRoutes(JWT_SECRET));
app.use("/api/orders", ordersRoutes(JWT_SECRET));
app.use("/api/vendor/orders", vendorOrdersRoutes(JWT_SECRET));
app.use("/api/payments", paymentsRoutes(JWT_SECRET));
app.use("/api/notifications", notificationsRoutes(JWT_SECRET));
app.use("/api/vendor/notifications", vendorNotificationsRoutes(JWT_SECRET));
app.use("/api/reviews", reviewsRoutes(JWT_SECRET));
app.use("/api/products", productReviewRoutes());
app.use("/me", meRoutes(JWT_SECRET));  // Convenience alias, comes last

// Example protected route
app.get("/protected", isAuthenticated({ secret: JWT_SECRET }), (req, res) => {
  res.json({
    ok: true,
    user: (req as any).user,
    correlationId: (req as any).correlationId,
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(PORT, () => {
  console.log(`api-gateway running on http://localhost:${PORT}`);
});
