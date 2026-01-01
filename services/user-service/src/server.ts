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

app.use("/users", userRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4002;
app.listen(PORT, () => {
  console.log(`✅ user-service running on http://localhost:${PORT}`);
});
