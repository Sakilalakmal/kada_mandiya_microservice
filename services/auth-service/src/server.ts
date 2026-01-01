import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "auth-service" });
});

app.use(errorHandler);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`auth-service running on http://localhost:${PORT}`);
});
