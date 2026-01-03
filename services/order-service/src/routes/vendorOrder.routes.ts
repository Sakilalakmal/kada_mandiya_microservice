import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { vendor } from "../middlewares/vendor.middleware";
import { getVendorOrders, updateVendorOrderStatus } from "../controllers/vendorOrder.controller";

const router = Router();

router.get("/", auth, vendor, getVendorOrders);
router.patch("/:orderId/status", auth, vendor, updateVendorOrderStatus);

export default router;

