# API Gateway (kada-mandiya)

## Diagnostics added

- All responses include `x-gateway: kada-mandiya`
- All responses include `x-gateway-route: <matched route or none>`
- Structured request logs are emitted as JSON with `event: gateway.request`

## Quick verification checklist

1. Start the gateway:
   - `npm run dev`
2. Confirm gateway is reachable and headers are present:
   - `curl -i http://localhost:4001/health`
3. Confirm `/api/*` requests are handled by the gateway (even if upstream is down):
   - `curl -i http://localhost:4001/api/api/orders/health` (double `/api` normalization)
   - `curl -i http://localhost:4001/api/users` (alias for `/users`)
4. Confirm unknown routes return JSON 404 with gateway headers:
   - `curl -i http://localhost:4001/api/does-not-exist`
5. Run the lightweight verifier:
   - `node scripts/verify-gateway.mjs`

## Frontend routing check

- In the browser network tab, requests should hit `http://localhost:4001/*` and responses should include `x-gateway: kada-mandiya`
- If you see `http://localhost:3000/api/*` returning a response without `x-gateway`, the frontend is not reaching the gateway

## Before vs After (gateway-only)

- Changed:
  - Adds request logging + warning diagnostics
  - Adds `x-gateway` and `x-gateway-route` response headers
  - Normalizes accidental `/api/api/*` to `/api/*`
  - Adds `/api/*` aliases for existing non-`/api` gateway routes (`/auth`, `/users`, `/vendors`, `/me`)
  - Returns JSON 404 for unhandled routes
  - Adds proxy timeout protection (default `15000ms`, configurable via `GATEWAY_PROXY_TIMEOUT_MS`)
- Not changed:
  - Existing public endpoints and existing proxy mounts remain available and unchanged
  - Downstream service URLs and routing targets are unchanged

