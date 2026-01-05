# RabbitMQ Report (Kada Mandiya)

Date: 2026-01-05

This report is **read-only** analysis + runtime verification. No project code was modified to generate this.

## Executive summary

- RabbitMQ is **running** locally via `infra/docker-compose.yml` and is reachable on:
  - AMQP: `localhost:5672`
  - Management UI/API: `http://localhost:15672` (user/pass: `guest`/`guest`)
- The expected topic exchange exists: `domain.events` (durable).
- The expected queues exist (durable) and currently have active consumers:
  - `payment-service.q` (binds `order.created`)
  - `notification-service.q` (binds `order.*` + `payment.*`)
  - `dev.events.q` (binds `#` for the dev event listener)
- SQL Server databases required by RabbitMQ consumers are present, and required tables/indexes exist.

Overall: **RabbitMQ setup and current runtime wiring look correct for local development**.

---

## RabbitMQ Readiness Summary (after hardening)

### What was already correct (left unchanged)

- Durable topic exchange + durable queues
- Manual ACK/NACK usage
- Consumer idempotency:
  - `notification-service`: `processed_events` table (dedupe) + transactional insert + ACK
  - `payment-service`: unique index on `payments.order_id` + “duplicate” detection + ACK
- Event schemas and routing keys

### What was fixed (minimal, surgical)

- **Consumer startup resilience**: consumers retry RabbitMQ connection indefinitely with exponential backoff + jitter (services no longer “miss” events just because RabbitMQ wasn’t ready at boot).
- **Poison message protection**:
  - Adds `x-retry-count` header on retries.
  - After `RABBITMQ_POISON_MAX_RETRIES` (default `5`), message is moved to a durable DLQ queue (`<queue>.dlq`) and the original is ACKed to prevent infinite requeue loops.
- **Publisher confirms + retry**:
  - Uses RabbitMQ confirm channels when available and waits for broker confirmations (`waitForConfirms`) before treating a publish as successful.
  - Retries publishes up to `RABBITMQ_PUBLISH_RETRIES` (default `3`) with backoff, then throws (call sites already log/catch in most services).
- **Config safety**: logs a DEV-only warning when defaulting to `amqp://guest:guest@localhost:5672`, and warns in `NODE_ENV=production` if RabbitMQ URL points to localhost or uses guest/guest.

### What was intentionally NOT fixed (and why)

- **Transactional outbox** (fully correct “DB write + publish” atomicity):
  - Not implemented because it requires new tables/state machines and coordinated changes across services.
  - Current mitigation: publish retries + confirm channels make failures visible and reduce event loss, but cannot make DB+publish atomic.
- **Broker-level DLX policies**:
  - Not implemented to avoid changing queue arguments and broker config; instead DLQ routing is implemented at the consumer layer.

### Reliability paragraph (CV/README friendly)

This RabbitMQ event system uses durable topic exchanges and durable queues, manual ACK/NACK with idempotent consumers, publisher confirm channels with bounded retries, and consumer-side poison message protection with durable DLQs. The result is at-least-once delivery with replay-safe handlers, clear failure visibility, and automatic recovery when RabbitMQ is temporarily unavailable.

---

## 1) Infrastructure configuration

File: `infra/docker-compose.yml`

- RabbitMQ image: `rabbitmq:3-management`
- Container: `kada_rabbitmq`
- Ports published:
  - `5672:5672` (AMQP)
  - `15672:15672` (Management)
- Credentials:
  - `RABBITMQ_DEFAULT_USER=guest`
  - `RABBITMQ_DEFAULT_PASS=guest`

Notes:
- No dedicated RabbitMQ volume is configured in compose; broker state will not persist if the container is recreated.

---

## 2) Code-level RabbitMQ wiring (publishers/consumers)

### Exchange / routing convention

- Exchange name: `domain.events` (configurable via `EVENT_EXCHANGE`, defaults to `domain.events`)
- Exchange type: `topic`
- Routing key: eventType string (e.g. `order.created`, `payment.not_required`)

Examples:
- Shared event bus:
  - `shared/event-bus/rabbit.ts` (connect + assert exchange)
  - `shared/event-bus/publisher.ts` (publishes with `persistent: true`)
- Order service publisher:
  - `services/order-service/src/messaging/publisher.ts`
- Review service publisher:
  - `services/review-service/src/messaging/publisher.ts`
- Payment service:
  - Consumer: `services/payment-service/src/messaging/consumer.ts` (binds `order.created`)
  - Publisher: `services/payment-service/src/messaging/bus.ts` (publishes payment events)
- Notification service:
  - Consumer: `services/notification-service/src/messaging/consumer.ts`
  - Bus: `services/notification-service/src/messaging/bus.ts`
- Dev listener:
  - `tools/event-listener/src/listener.ts` (binds `#` into `dev.events.q`)

### Consumers (what is actually consumed)

- `payment-service.q`
  - bindings: `order.created`
  - consumer: `services/payment-service/src/messaging/consumer.ts`
- `notification-service.q`
  - bindings:
    - `order.created`
    - `order.status_updated`
    - `order.cancelled`
    - `payment.not_required`
    - `payment.completed`
    - `payment.failed`
  - consumer: `services/notification-service/src/messaging/consumer.ts`

### Delivery semantics (as implemented)

- Exchange asserted durable (`durable: true`)
- Queues asserted durable (`durable: true`)
- Publishers set messages as persistent (`persistent: true`)
- Consumers use manual ack:
  - `ack` on success / on validation failure (to drop bad payloads)
  - `nack(..., requeue=true)` on handler errors (retries)

---

## 3) Runtime verification (this machine)

### Docker compose status

`docker compose -f infra/docker-compose.yml ps` shows:
- `kada_rabbitmq` is `Up`
- `kada_sqlserver` is `Up`

### RabbitMQ status (container)

`docker exec kada_rabbitmq rabbitmqctl status` shows:
- RabbitMQ version: `3.13.7`
- Listeners include:
  - `5672` (amqp)
  - `15672` (http management)
- Connection count: `4`
- Queue count: `3`

### Exchange and queues (container)

`docker exec kada_rabbitmq rabbitmqctl list_exchanges name type durable` includes:
- `domain.events topic true`

`docker exec kada_rabbitmq rabbitmqctl list_queues name durable consumers messages_ready messages_unacknowledged` shows:
- `dev.events.q true 1 0 0`
- `payment-service.q true 1 0 0`
- `notification-service.q true 1 0 0`

### Management API checks

`GET http://localhost:15672/api/overview` returns a valid JSON payload and reports:
- `domain.events` exists
- `consumers: 3`, `queues: 3`, `connections: 4`

Bindings verified via the management API:
- `notification-service.q` is bound to the routing keys listed above
- `payment-service.q` is bound to `order.created`
- `dev.events.q` is bound to `#`

---

## 4) Database collaboration verification

RabbitMQ consumers that write to SQL Server:

### Notification service

- Startup creates/ensures schema: `services/notification-service/src/db/schema.ts`
- Uses idempotency table: `dbo.processed_events` (PK on `event_id`)
- Writes notifications inside a DB transaction, and only then acks the message.

Verified in SQL Server container:
- Database: `KadaMandiyaNotification`
- Tables present:
  - `dbo.notifications`
  - `dbo.processed_events`
- Indexes present (example):
  - `IX_notifications_recipient_unread`
  - `IX_notifications_recipient_created`

### Payment service

- Writes payment record on `order.created` consumption.
- Uses unique constraint error handling to detect duplicates.

Verified in SQL Server container:
- Database: `KadaMandiyaPayment`
- Table present:
  - `dbo.payments`
- Indexes present:
  - `UX_payments_order_id` (unique) — required for idempotency behavior in `createNotRequiredPayment(...)`
  - `IX_payments_user_id`
  - `IX_payments_status`

---

## 5) Issues / risks found

These are not necessarily “broken right now”, but they are real operational risks or footguns.

1) **DLQ is consumer-managed (not broker-managed)**
   - Fixed at the service layer: consumers now track `x-retry-count` and move poison messages to durable `<queue>.dlq`.
   - Remaining risk: this is not a broker-enforced DLX policy; if a different consumer is added later and does raw `nack(requeue=true)`, poison-loop behavior can reappear.

2) **Outbox gap (DB write + publish are not atomic)**
   - Improved: publishers now use confirm channels (when available) and retry publishing, so failures are visible and less lossy.
   - Remaining risk: DB commit + publish are still not a single atomic transaction (no transactional outbox).

3) **Retry republish changes broker metadata**
   - Poison retries are implemented by re-publishing the message to the same queue with incremented `x-retry-count`.
   - This changes the broker-level `exchange`/`routingKey` metadata for retry deliveries; original values are preserved in headers (`x-original-exchange`, `x-original-routing-key`).

4) **Credentials are dev defaults**
   - `guest/guest` is okay for local dev, but not safe for any shared environment.

5) **`localhost` RabbitMQ URL is host-only**
   - Services default to `amqp://guest:guest@localhost:5672`.
   - This is correct when services run on the host machine, but **will not work** if services are containerized unless `RABBITMQ_URL` is changed to point to `rabbitmq` (compose service name) or the correct broker host.

6) **Architecture rule mismatch (non-RabbitMQ)**
   - Repo `README.md` claims services do not call each other via HTTP, but:
     - `services/order-service` calls `cart-service` over HTTP.
     - `services/review-service` calls `order-service` over HTTP.
   - Not a RabbitMQ bug, but relevant when assessing “event-driven only” expectations.

---

## 6) Quick “is it working?” checklist (no code changes)

1. Ensure infra is up:
   - `docker compose -f infra/docker-compose.yml up -d rabbitmq sqlserver`
2. Open management UI:
   - `http://localhost:15672` (guest/guest)
3. Confirm:
   - Exchange `domain.events` exists
   - Queues `payment-service.q` and `notification-service.q` exist and have consumers
4. Optional dev observation:
   - Run `tools/event-listener` and confirm it receives events on `dev.events.q` (`#` binding)

---

## 7) New runtime knobs (env)

- `RABBITMQ_URL` (already existed): full AMQP URL for the broker
- `EVENT_EXCHANGE` (already existed): exchange name (default `domain.events`)
- `PAYMENT_QUEUE` / `NOTIFICATION_QUEUE` (already existed): service queue names
- `RABBITMQ_PUBLISH_RETRIES` (new): max publish attempts (default `3`)
- `RABBITMQ_POISON_MAX_RETRIES` (new): max handler retries before DLQ (default `5`)
