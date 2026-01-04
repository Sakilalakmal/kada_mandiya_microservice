# Kada Mandiya

Event-driven microservices demo project (Node.js + Express + TypeScript + SQL Server + RabbitMQ + Stripe).

## Architecture rules
- Business services do not call each other via HTTP.
- Services communicate only via RabbitMQ events.
- Each service has its own database.
- JWT is verified locally in each service.
- Consumers are idempotent.

## Repo structure
- apps/         -> Next.js + API Gateway
- services/     -> Microservices
- packages/     -> Shared internal npm packages
- infra/        -> Docker compose (RabbitMQ + SQL Server)

## RabbitMQ event testing (dev)
- `docker compose -f infra/docker-compose.yml up -d rabbitmq sqlserver`
- Start `apps/api-gateway`, `services/order-service`, `services/review-service`
- Start the dev listener: `cd tools/event-listener && npm install && npm run dev`
- Trigger events:
  - Create order -> observe `order.created`
  - Vendor status update -> observe `order.status_updated`
  - Create/update/delete review -> observe `review.*`
