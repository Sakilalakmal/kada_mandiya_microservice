import { Router } from "express";
import { getMe, updateMe } from "../controllers/user.controller";

const router = Router();

router.get("/me", getMe);

router.put("/me", updateMe);

export default router;
