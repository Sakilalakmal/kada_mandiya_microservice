import "dotenv/config";
import express from "express";
import cors from "cors";
import notificationRoutes from "./routes/notification.routes";
import vendorNotificationRoutes from "./routes/vendorNotification.routes";
import { startConsumer } from "./messaging/consumer";
import { closeEventBus } from "./messaging/bus";
import { ensureDbSchema } from "./db/schema";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", notificationRoutes);
app.use("/", vendorNotificationRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4011;

let server: ReturnType<typeof app.listen>;
async function main() {
  await ensureDbSchema();

  server = app.listen(PORT, () => {
    console.log(`notification-service running on http://localhost:${PORT}`);
  });

  startConsumer().catch((err) => {
    console.error("[notification-service] consumer startup failed:", err);
  });
}

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[notification-service] shutting down (${signal})...`);

  await closeEventBus().catch(() => {});
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

main().catch((err) => {
  console.error("[notification-service] startup failed:", err);
  process.exit(1);
});

