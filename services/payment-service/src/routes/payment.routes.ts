import { Router } from "express";
import { getPool } from "../db/pool";
import { auth } from "../middlewares/auth.middleware";
import {
  getMyPayments,
  getPaymentByOrderId,
  simulateFail,
  simulateSuccess,
} from "../controllers/payment.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "payment-service", port: 4010 });
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

// api-gateway proxies `/api/payments/*` -> `${PAYMENT_SERVICE_URL}/*` (it strips `/api/payments`),
// so this service must serve routes at the root (e.g. `/my`).
router.get("/my", auth, getMyPayments);
router.get("/:orderId", auth, getPaymentByOrderId);
router.post("/:orderId/simulate-success", auth, simulateSuccess);
router.post("/:orderId/simulate-fail", auth, simulateFail);

router.get("/payments/my", auth, getMyPayments);
router.get("/payments/:orderId", auth, getPaymentByOrderId);

router.post("/payments/:orderId/simulate-success", auth, simulateSuccess);
router.post("/payments/:orderId/simulate-fail", auth, simulateFail);

export default router;
