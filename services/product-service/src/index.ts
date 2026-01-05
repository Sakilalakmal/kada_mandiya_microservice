import "dotenv/config";
import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes";
import ProductVendorRouter from "./routes/product.vendor.routes";
import internalRoutes from "./routes/internal.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "product-service" });
});

// api-gateway proxies `/products/*` -> `${PRODUCT_SERVICE_URL}/*` (it strips `/products`),
// so this service must serve routes at the root (e.g. `/`, `/mine`, `/:id`).
app.use("/internal", internalRoutes);
app.use("/", ProductVendorRouter);
app.use("/", productRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4004;
app.listen(PORT, () => {
  console.log(`product-service running on http://localhost:${PORT}`);
});
