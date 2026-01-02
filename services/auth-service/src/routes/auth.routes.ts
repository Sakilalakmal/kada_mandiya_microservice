import { Router } from "express";
import { asyncWrap } from "../middlewares/asyncWrap";
import * as controller from "../controllers/auth.controller";
import { internalGrantRole } from "../controllers/internal.controller";
import { refresh } from "../controllers/refresh.controller";

const router = Router();

router.post("/register", asyncWrap(controller.register));
router.post("/login", asyncWrap(controller.login));
router.get("/me", controller.me);
router.post("/internal/grant-role", internalGrantRole);
router.post("/refresh", refresh);


export default router;
