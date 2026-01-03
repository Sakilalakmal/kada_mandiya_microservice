import { Router } from "express";
import { getPool } from "../db/pool";
import { auth } from "../middlewares/auth.middleware";
import {
  addCartItem,
  clearUserCart,
  deleteCartItem,
  getCart,
  updateCartItemQty,
} from "../controllers/cart.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "cart-service", port: 4005 });
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

router.get("/", auth, getCart);
router.post("/items", auth, addCartItem);
router.patch("/items/:itemId", auth, updateCartItemQty);
router.delete("/items/:itemId", auth, deleteCartItem);
router.delete("/", auth, clearUserCart);

export default router;
