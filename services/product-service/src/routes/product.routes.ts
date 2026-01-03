import { Router } from "express";
import { getProductDetail, getProducts } from "../controllers/product.public.controller";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductDetail);

export default router;
