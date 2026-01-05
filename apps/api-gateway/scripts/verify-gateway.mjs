/* eslint-disable no-console */
import assert from "node:assert/strict";

const baseUrl = process.env.GATEWAY_URL ?? "http://localhost:4001";

async function request(path) {
  const res = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  const text = await res.text();
  return { res, text };
}

function header(res, name) {
  return res.headers.get(name);
}

async function main() {
  const cases = [
    { path: "/health", expectedRoute: "none" },
    { path: "/api/api/orders/health", expectedRoute: "/api/orders" }, // double-prefix normalization
    { path: "/api/users", expectedRoute: "/api/users" }, // alias route
    { path: "/api/does-not-exist", expectedRoute: "none", expect404Json: true },
  ];

  for (const c of cases) {
    const { res, text } = await request(c.path);
    const xGateway = header(res, "x-gateway");
    const xRoute = header(res, "x-gateway-route");

    assert.equal(xGateway, "kada-mandiya", `missing/incorrect x-gateway for ${c.path}`);
    assert.equal(xRoute, c.expectedRoute, `missing/incorrect x-gateway-route for ${c.path}`);

    if (c.expect404Json) {
      assert.equal(res.status, 404, `expected 404 for ${c.path}`);
      const json = JSON.parse(text);
      assert.equal(json?.error, "Route not handled by API Gateway");
      assert.equal(json?.method, "GET");
      assert.equal(json?.hint, "Check frontend base URL or gateway prefix");
    }
  }

  console.log("OK: gateway headers + routing checks passed");
}

main().catch((err) => {
  console.error("FAILED:", err?.message ?? err);
  process.exitCode = 1;
});

