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
