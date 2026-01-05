import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { vendor } from "../middlewares/vendor.middleware";
import { getVendorOrder, getVendorOrders, updateVendorOrderStatus } from "../controllers/vendorOrder.controller";

const router = Router();

router.get("/", auth, vendor, getVendorOrders);
router.get("/:orderId", auth, vendor, getVendorOrder);
router.patch("/:orderId/status", auth, vendor, updateVendorOrderStatus);

export default router;

