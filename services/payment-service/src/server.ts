import "dotenv/config";
import express from "express";
import cors from "cors";
import paymentRoutes from "./routes/payment.routes";
import { startConsumer } from "./messaging/consumer";
import { closeEventBus } from "./messaging/bus";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", paymentRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4010;
const server = app.listen(PORT, () => {
  console.log(`payment-service running on http://localhost:${PORT}`);
});

startConsumer().catch((err) => {
  console.error("[payment-service] consumer startup failed:", err);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[payment-service] shutting down (${signal})...`);

  await closeEventBus().catch(() => {});
  await new Promise<void>((resolve) => server.close(() => resolve()));
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

