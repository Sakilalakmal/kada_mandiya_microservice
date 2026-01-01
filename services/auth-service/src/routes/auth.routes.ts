import { Router } from "express";
import { asyncWrap } from "../middlewares/asyncWrap";
import * as controller from "../controllers/auth.controller";

const router = Router();

router.post("/register", asyncWrap(controller.register));
router.post("/login", asyncWrap(controller.login));
router.get("/me", controller.me);

export default router;
