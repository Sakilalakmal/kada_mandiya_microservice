import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { vendor } from "../middlewares/vendor.middleware";
import { getVendorOrders, updateVendorOrderStatus } from "../controllers/vendorOrder.controller";

const router = Router();

router.get("/vendor/orders", auth, vendor, getVendorOrders);
router.patch("/vendor/orders/:orderId/status", auth, vendor, updateVendorOrderStatus);

export default router;

