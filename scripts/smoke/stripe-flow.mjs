/* eslint-disable no-console */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const baseUrl = (process.env.GATEWAY_URL ?? "http://localhost:4001").replace(/\/+$/, "");

async function request(path, { method = "GET", token, body, headers } = {}) {
  const h = new Headers(headers ?? {});
  h.set("accept", "application/json");
  if (token) h.set("authorization", `Bearer ${token}`);
  if (body !== undefined) {
    h.set("content-type", "application/json");
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  const payload = (() => {
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  })();

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${method} ${path}: ${text}`.slice(0, 500));
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function createCheckoutSessionWithRetry(orderId, token) {
  const maxAttempts = 8;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await request(`/api/payments/${orderId}/checkout-session`, { method: "POST", token });
      assert.equal(data?.ok, true);
      assert.equal(typeof data?.url, "string");
      return data.url;
    } catch (err) {
      const status = err?.status;
      if (status !== 404 || attempt >= maxAttempts) throw err;
      await sleep(250 * attempt);
    }
  }
  throw new Error("checkout-session retry exhausted");
}

async function main() {
  console.log(`Gateway: ${baseUrl}`);

  const email = `stripe-smoke+${randomUUID().slice(0, 8)}@example.com`;
  const password = "Passw0rd!123";
  const name = "Stripe Smoke";

  console.log("1) Register + login");
  await request("/api/auth/register", { method: "POST", body: { name, email, password } });
  const login = await request("/api/auth/login", { method: "POST", body: { email, password } });
  const token = login?.accessToken;
  assert.equal(typeof token, "string");

  console.log("2) Pick a product");
  const products = await request("/products?limit=1&page=1", { method: "GET" });
  const product = products?.items?.[0];
  if (!product) {
    console.log("No products found. Seed at least 1 active product, then re-run.");
    process.exitCode = 2;
    return;
  }

  console.log("3) Clear cart + add 1 item");
  await request("/api/cart", { method: "DELETE", token });
  await request("/api/cart/items", {
    method: "POST",
    token,
    body: {
      productId: product.id,
      qty: 1,
      unitPrice: Number(product.price),
      title: String(product.name),
      imageUrl: product.thumbnailImageUrl ?? undefined,
    },
  });

  console.log("4) Create ONLINE order");
  const order = await request("/api/orders", {
    method: "POST",
    token,
    body: {
      deliveryAddress: "Colombo (smoke test)",
      mobile: "0700000000",
      paymentMethod: "ONLINE",
    },
  });
  assert.equal(order?.ok, true);
  const orderId = order?.orderId;
  assert.equal(typeof orderId, "string");

  console.log(`5) Create Stripe Checkout Session (orderId hidden in UI): ${orderId}`);
  const url = await createCheckoutSessionWithRetry(orderId, token);
  console.log("Open this URL to pay (test mode):");
  console.log(url);

  console.log("6) After completing Checkout, poll payment status");
  const maxMs = 90_000;
  const started = Date.now();
  for (;;) {
    const payment = await request(`/api/payments/${orderId}`, { method: "GET", token });
    const status = payment?.payment?.status;
    if (status === "COMPLETED" || status === "FAILED") {
      console.log(`Final payment status: ${status}`);
      return;
    }
    if (Date.now() - started > maxMs) {
      console.log(`Timed out after ${Math.round(maxMs / 1000)}s (last status=${status})`);
      process.exitCode = 3;
      return;
    }
    await sleep(2000);
  }
}

main().catch((err) => {
  console.error("FAILED:", err?.message ?? err);
  process.exitCode = 1;
});

