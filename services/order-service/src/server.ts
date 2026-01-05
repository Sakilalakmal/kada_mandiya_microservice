import "dotenv/config";
import express from "express";
import cors from "cors";
import orderRoutes from "./routes/order.routes";
import vendorOrderRoutes from "./routes/vendorOrder.routes";
import { startPaymentConsumer } from "./messaging/paymentConsumer";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", orderRoutes);
app.use("/vendor/orders", vendorOrderRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4006;
app.listen(PORT, () => {
  console.log(`order-service running on http://localhost:${PORT}`);
});

startPaymentConsumer().catch((err) => {
  console.error("[order-service] payment consumer failed:", err);
});

