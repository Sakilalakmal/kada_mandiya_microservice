import { Router } from "express";
import { becomeVendor, getMyVendor } from "../controllers/vendor.controller";

const router = Router();

router.post("/become", becomeVendor);
router.get("/me", getMyVendor);

export default router;
