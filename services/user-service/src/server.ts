import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import userRoutes from "./routes/user.routes";


const app = express();
app.use(cors());
app.use(express.json());

const uploadsDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "user-service" });
});

// api-gateway proxies `/users/*` -> `${USER_SERVICE_URL}/*` (it strips `/users`),
// so this service must serve routes at the root (e.g. `/me`, `/me/photo`).
app.use("/", userRoutes);
// Keep backward-compatible direct calls (optional): `/users/me`
app.use("/users", userRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4002;
app.listen(PORT, () => {
  console.log(`✅ user-service running on http://localhost:${PORT}`);
});
