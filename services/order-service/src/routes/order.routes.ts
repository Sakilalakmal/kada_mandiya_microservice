import { Router } from "express";
import { getPool } from "../db/pool";
import { auth } from "../middlewares/auth.middleware";
import { cancelOrder, createOrder, getMyOrders, getOrder } from "../controllers/order.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "order-service", port: 4006 });
});

router.get("/health/db", async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1");
    return res.json({ ok: true });
  } catch (err) {
    console.error("health/db error:", err);
    return res.status(500).json({ ok: false });
  }
});

router.post("/orders", auth, createOrder);
router.get("/orders/my", auth, getMyOrders);
router.get("/orders/:orderId", auth, getOrder);
router.patch("/orders/:orderId/cancel", auth, cancelOrder);

export default router;

