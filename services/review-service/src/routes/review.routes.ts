import { Router } from "express";
import { getPool } from "../db/pool";
import { auth } from "../middlewares/auth.middleware";
import {
  createNewReview,
  deleteReview,
  getMyReviews,
  getProductRating,
  getProductReviews,
  patchReview,
} from "../controllers/review.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "review-service", port: 4007 });
});

router.get("/health/db", async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1");
    return res.json({ ok: true });
  } catch (err) {
    console.error("health/db error:", err);
    return res.status(500).json({
      ok: false,
      error: { code: "DB_UNAVAILABLE", message: "Database unreachable." },
    });
  }
});

router.post("/", auth, createNewReview);
router.patch("/:reviewId", auth, patchReview);
router.delete("/:reviewId", auth, deleteReview);

router.get("/products/:productId/reviews", getProductReviews);
router.get("/me", auth, getMyReviews);
router.get("/products/:productId/rating", getProductRating);

export default router;
