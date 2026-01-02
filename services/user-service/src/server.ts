import "dotenv/config";
import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";


const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "user-service" });
});

// api-gateway proxies `/users/*` -> `${USER_SERVICE_URL}/*` (it strips `/users`),
// so this service must serve routes at the root (e.g. `/me`).
app.use("/", userRoutes);
// Keep backward-compatible direct calls (optional): `/users/me`
app.use("/users", userRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4002;
app.listen(PORT, () => {
  console.log(`✅ user-service running on http://localhost:${PORT}`);
});
