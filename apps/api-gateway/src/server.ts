import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { isAuthenticated } from "@npmkadamandiya/auth";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Correlation ID middleware (super important for debugging)
app.use((req, res, next) => {
  const incoming = req.header("x-correlation-id");
  const correlationId = incoming ?? randomUUID();

  res.setHeader("x-correlation-id", correlationId);
  (req as any).correlationId = correlationId;

  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api-gateway" });
});

// Service URLs
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ?? "http://localhost:4000";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

// Helper: re-stream parsed JSON body to target (needed because express.json() consumes the stream)
function restreamBody(proxyReq: any, req: express.Request) {
  if (!req.body || !Object.keys(req.body).length) return;
  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader("Content-Type", "application/json");
  proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
}

// Minimal proxy: /auth/* -> auth-service (strip /auth prefix)
app.use("/auth", async (req, res) => {
  const correlationId = (req as any).correlationId;
  const targetPath = req.originalUrl.replace(/^\/auth/, "") || "/";
  const url = `${AUTH_SERVICE_URL}${targetPath}`;

  try {
    // copy headers, drop host/content-length/transfer-encoding, add correlation id
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (
        lower === "host" ||
        lower === "content-length" ||
        lower === "transfer-encoding"
      )
        continue;
      if (Array.isArray(value)) {
        headers[key] = value.join(", ");
      } else if (value !== undefined) {
        headers[key] = value as string;
      }
    }
    headers["x-correlation-id"] = correlationId;

    const hasBody = !["GET", "HEAD"].includes(req.method.toUpperCase());
    const body = hasBody && req.body ? JSON.stringify(req.body) : undefined;
    if (body)
      headers["content-type"] = headers["content-type"] ?? "application/json";

    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-length") return;
      res.setHeader(key, value);
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.send(buffer);
  } catch (err) {
    console.error("Proxy error to auth-service:", err);
    return res
      .status(502)
      .json({
        error: { code: "BAD_GATEWAY", message: "Auth service unreachable" },
      });
  }
});

// Example protected gateway route (proves middleware works)
app.get("/protected", isAuthenticated({ secret: JWT_SECRET }), (req, res) => {
  res.json({
    ok: true,
    user: (req as any).user,
    correlationId: (req as any).correlationId,
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(PORT, () => {
  console.log(`api-gateway running on http://localhost:${PORT}`);
  console.log(`Proxy /auth -> ${AUTH_SERVICE_URL}`);
});
