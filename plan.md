# Kada Mandiya Microservices Plan (Final)

This repo will follow an event-driven microservice architecture with strict rules: business services never call each other via HTTP; they communicate only via RabbitMQ events. The API Gateway is the only edge service allowed to do HTTP routing to internal services.

## 1) Tech Stack (Final)
### Backend (per service)
- Node.js + Express
- TypeScript
- SQL Server (SSMS) - database per service
- RabbitMQ - async events only
- JWT - verified locally in each service

### Frontend
- Next.js (TypeScript)

### Payments
- Stripe (PaymentIntents + Webhooks)

### Shared code distribution
- Internal npm registry packages (recommended: GitHub Packages)

### DevOps (minimum)
- Docker Compose (RabbitMQ + SQL Server + optional services)

## 2) Architecture Rules (Non-Negotiable)
1. No service-to-service HTTP calls between business services.
2. Services communicate only using RabbitMQ events.
3. Each service has its own database (no shared tables).
4. Services verify JWT locally (no calling Auth to validate tokens).
5. Event consumers must be idempotent (safe if the same event arrives twice).

## 3) Services (Final)
1) API Gateway (Edge)
- Single entry point for the frontend
- Verifies JWT (access token)
- Adds `correlationId` to every request and event publish
- Routes requests to internal services via HTTP

2) Auth Service
- Register/Login
- Issues JWT access tokens (refresh tokens optional)
- Stores credentials and (optional) refresh tokens

3) User Service
- User profile data (name, phone, address)

4) Product Service
- Products + categories + pricing

5) Order Service
- Creates orders (initial status: `PENDING_PAYMENT`)
- Publishes: `order.created`
- Consumes payment result events and updates order status
- Publishes: `order.paid` on successful payment

6) Payment Service (Stripe)
- Consumes: `order.created`
- Creates Stripe PaymentIntent (never trusts frontend amounts)
- Publishes: `payment.intent.created`
- Receives Stripe webhooks (signature verification required)
- Publishes: `payment.succeeded` / `payment.failed`

7) Notification Service
- Consumes: `order.paid` / `payment.failed`
- Sends email simulation (logs; Mailtrap optional later)

## 4) RabbitMQ Event Design (Final)
### Exchange
- `domain.events` (type: `topic`)

### Routing keys (v1)
- `order.created`
- `payment.intent.created`
- `payment.succeeded`
- `payment.failed`
- `order.paid`
- `notification.send` (optional; can be introduced later if needed)

### Event envelope (standard; required for every message)
```json
{
  "eventId": "string",
  "eventType": "string",
  "version": 1,
  "occurredAt": "2026-01-01T00:00:00.000Z",
  "correlationId": "string",
  "data": {}
}
```

### Idempotency rule (required for every consumer)
Each consumer stores processed `eventId` in its own DB (per service), for example:
- Table: `processed_events`
  - `eventId` (PK)
  - `processedAt` (datetime)

Consumer algorithm:
- If `eventId` already exists -> ignore (ACK)
- Else -> process -> insert `eventId` -> ACK

## 5) Stripe Payment Flow (Final)
1) Order Service
- Create order (`status = PENDING_PAYMENT`)
- Publish `order.created` with `orderId`, `amount`, `currency`, `userId`

2) Payment Service (consumer)
- Consume `order.created`
- Create Stripe PaymentIntent using backend amount/currency
- Set Stripe metadata: `{ orderId, userId }`
- Publish `payment.intent.created` with `orderId`, `paymentIntentId`, `clientSecret`

3) Frontend (Next.js)
- Fetch `clientSecret` through API Gateway
- Confirm payment using Stripe.js

4) Stripe Webhook -> Payment Service
- Verify webhook signature (mandatory)
- Handle webhook retries (idempotent)
- Publish `payment.succeeded` or `payment.failed` (include `orderId`, `paymentIntentId`)

5) Order Service (consumer)
- Consume payment events
- Update order status
- Publish `order.paid` when success

6) Notification Service (consumer)
- Consume `order.paid`
- Send confirmation (log)

Stripe safety rules (non-negotiable)
- Never trust amount from frontend
- Webhook verification is mandatory
- Use Stripe metadata (`orderId`, `userId`) to link back
- Treat webhooks as at-least-once; implement idempotency

## 6) Database per Service (Final)
Example DBs (single SQL Server instance locally; separate DB per service):
- `auth_db`
- `user_db`
- `product_db`
- `order_db`
- `payment_db`
- `notification_db` (optional)

No shared tables across services.

## 7) Internal npm Packages (Final)
Publish these as internal packages:
1) `@scope/event-contracts`
- Event names, routing keys, TypeScript types, Zod schemas
- Versioned payload definitions

2) `@scope/rabbitmq-client`
- Connect / publish / consume helpers
- Retry strategy + DLQ hooks (baseline)
- `correlationId` propagation helpers

3) `@scope/auth`
- JWT verify middleware (Express)
- Role/permission helpers (as needed)

4) `@scope/logger`
- Structured JSON logs
- `requestId` / `correlationId` middleware

## 8) Repo Structure (Final, Codex-friendly)
Monorepo layout:
```
/apps
  /web-nextjs
  /api-gateway
/services
  /auth-service
  /user-service
  /product-service
  /order-service
  /payment-service
  /notification-service
/packages
  /event-contracts
  /rabbitmq-client
  /auth
  /logger
/infra
  docker-compose.yml
```

Each service contains:
- `src/`
- `Dockerfile`
- `.env.example`
- `README.md`
- `openapi.yaml` (or Swagger)

## 9) Step-by-step Build Roadmap (Best Order)
### Phase 1 - Foundation (monorepo + infra + shared packages)
1. Create the monorepo folder structure (`apps/`, `services/`, `packages/`, `infra/`).
2. Add shared TS config + linting conventions (baseline).
3. Add `infra/docker-compose.yml` for RabbitMQ + SQL Server.
4. Implement `@scope/event-contracts` (event types + Zod schemas + versions).
5. Implement `@scope/logger` (JSON logs + correlation middleware).
6. Implement `@scope/rabbitmq-client` (publish/consume + envelope validation + DLQ baseline).
7. Decide migrations approach per service (one tool, consistent).

Exit criteria:
- RabbitMQ + SQL Server run locally via Compose.
- A tiny "hello event" producer/consumer can publish/consume using the shared packages.

### Phase 2 - Auth + Gateway + Frontend
1. Auth Service: register/login + password hashing + JWT issuance.
2. `@scope/auth`: JWT verify middleware shared by gateway + services.
3. API Gateway: route to Auth + one sample service; verify JWT; add `correlationId`.
4. Next.js: login page + store token + one protected page through gateway.

Exit criteria:
- Frontend can login and call a protected endpoint via gateway.
- JWT verification works locally in gateway and at least one business service.

### Phase 3 - Core Business (Products + Orders)
1. Product Service: CRUD for products/categories/pricing (+ OpenAPI).
2. Order Service: create order (`PENDING_PAYMENT`) + persist to `order_db`.
3. Order Service: publish `order.created` on order creation.
4. Add idempotent consumer framework + `processed_events` table pattern in services.

Exit criteria:
- Creating an order publishes `order.created` (with correlationId, correct envelope).

### Phase 4 - Stripe Payments (big feature)
1. Payment Service: consume `order.created` idempotently.
2. Payment Service: create Stripe PaymentIntent + publish `payment.intent.created`.
3. Gateway + Frontend: fetch `clientSecret` and confirm payment with Stripe.js.
4. Payment Service: webhook endpoint + signature verification + idempotency.
5. Payment Service: publish `payment.succeeded` / `payment.failed`.
6. Order Service: consume payment events; update status; publish `order.paid`.
7. Notification Service: consume `order.paid` and log "email sent".

Exit criteria:
- End-to-end happy path works locally: order -> payment intent -> webhook -> order paid -> notification logged.

### Phase 5 - Polish to "Job Ready"
1. Swagger/OpenAPI docs for every HTTP service.
2. Tests: payment webhook verification + order/payment event flow.
3. Gateway hardening: rate limiting + consistent error model.
4. CI (GitHub Actions): lint + typecheck + tests per package/service.
5. Root `README.md` + architecture diagram + "how to run locally" instructions.

Exit criteria:
- Reproducible local setup, documented APIs, and a reliable demo flow.
