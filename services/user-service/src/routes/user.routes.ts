import { Router } from "express";
import multer from "multer";
import path from "path";
import { getMe, updateMe, updateMyPhoto } from "../controllers/user.controller";

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.resolve(process.cwd(), "uploads"));
    },
    filename: (req, file, cb) => {
      const userId = req.header("x-user-id") ?? "unknown";
      const ext =
        file.mimetype === "image/png"
          ? ".png"
          : file.mimetype === "image/webp"
            ? ".webp"
            : ".jpg";
      cb(null, `${userId}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    cb(null, ok);
  },
});

router.get("/me", getMe);

router.put("/me", updateMe);

router.post("/me/photo", upload.single("photo"), updateMyPhoto);

export default router;
