import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes/vendor.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "vendor-service" });
});

// api-gateway proxies `/vendors/*` -> `${VENDOR_SERVICE_URL}/*` (it strips `/vendors`),
// so this service must serve routes at the root (e.g. `/become`, `/me`).
app.use("/", router);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4003;
app.listen(PORT, () => {
  console.log(`vendor-service running on http://localhost:${PORT}`);
});
