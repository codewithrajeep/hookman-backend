# Hookman

> A webhook delivery service with guaranteed delivery, automatic retries, and real-time monitoring.

![CI](https://github.com/codewithrajeep/hookman-backend/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-22-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-6.x-blue.svg)

---

## What is Hookman?

Hookman is a webhook delivery service. Apps register HTTP endpoints with Hookman, send events to it, and Hookman guarantees delivery — queuing jobs, retrying on failure with exponential backoff, parking dead jobs in a dead letter queue, and streaming every delivery attempt live via WebSocket.

Think of it as a self-hosted alternative to [Svix](https://svix.com) or [Hookdeck](https://hookdeck.com).

---

## Core Flow

```
App registers endpoint
       ↓
App sends event → Hookman API
       ↓
Event queued in BullMQ (Redis)
       ↓
Worker delivers via signed HTTP POST
       ↓
Success → DeliveryAttempt recorded → Event marked DELIVERED
Failure → Retry with exponential backoff (up to 5 attempts)
       ↓
After 5 failures → Dead Letter Queue
       ↓
User can replay dead letter events via API
       ↓
WebSocket streams live delivery status to connected clients
```

---

## Tech Stack

**Backend**

- Node.js 22 + TypeScript 6
- Express 5
- PostgreSQL (Neon) + Prisma 7
- Redis (Upstash) + BullMQ
- ioredis
- Socket.io (WebSocket)
- Pino + pino-http (structured logging)
- Zod (validation)

**Frontend** *(planned)*

- Next.js 15 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- TanStack Query v5 + Zustand v5
- Socket.io client (live delivery feed)

**Infrastructure**

- Docker
- GitHub Actions (CI/CD)
- Render (backend deployment)
- Vercel (frontend deployment — planned)

---

## Project Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation — Prisma schema, Redis, Express, Docker, CI/CD | ✅ Complete |
| Phase 2 | Auth + API Keys — JWT, API key generation, auth middleware | ✅ Complete |
| Phase 3 | Endpoints + Events — CRUD, event ingestion, BullMQ enqueue | ✅ Complete |
| Phase 4 | Delivery + Retry + DLQ — Worker, exponential backoff, dead letter queue, event replay | ✅ Complete |
| Phase 5 | Stats API + WebSocket — Delivery metrics, real-time delivery events | ✅ Complete |
| Phase 6 | Frontend — Next.js dashboard | ⬜ Planned |

---

## Database Schema

```
User
 ├── ApiKey[]              (hashed keys with prefix)
 └── Endpoint[]            (registered webhook URLs)
      └── Event[]          (incoming events — cascades on endpoint delete)
           └── DeliveryAttempt[]   (one row per HTTP attempt)

DeadLetterEvent            (permanently failed events after max retries)
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL (or [Neon](https://neon.tech) free tier)
- Redis (or [Upstash](https://upstash.com) free tier)

### Installation

```bash
git clone https://github.com/codewithrajeep/hookman-backend.git
cd hookman-backend
pnpm install
```

### Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL pooled connection string |
| `DIRECT_URL` | PostgreSQL direct connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `REDIS_URL` | Redis connection string |

### Running Locally

```bash
# run migrations
pnpm dlx dotenv-cli -e .env -- pnpm prisma migrate dev

# generate prisma client
pnpm prisma generate

# start dev server
pnpm dev
```

Server starts at `http://localhost:3000`

Health check: `GET /health`

### Running with Docker

```bash
docker build -t hookman-backend .
docker run -p 3000:3000 --env-file .env hookman-backend
```

### Validation Scripts

```bash
# lint + typecheck + build
./scripts/build-test.sh

# full docker build + health check
./scripts/docker-test.sh
```

---

## API Reference

Base URL (production): `https://hookman-backend.onrender.com`

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Register a new user | None |
| `POST` | `/api/v1/auth/login` | Login and receive JWT token | None |

### API Keys

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/api-keys` | Create an API key | JWT |
| `GET` | `/api/v1/api-keys` | List all API keys | JWT |
| `DELETE` | `/api/v1/api-keys/:id` | Delete an API key | JWT |

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/endpoints` | Register a webhook endpoint | JWT |
| `GET` | `/api/v1/endpoints` | List all endpoints | JWT |
| `GET` | `/api/v1/endpoints/:id` | Get endpoint by ID | JWT |
| `PATCH` | `/api/v1/endpoints/:id` | Update endpoint | JWT |
| `DELETE` | `/api/v1/endpoints/:id` | Delete endpoint (cascades events) | JWT |

### Events

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/events` | Ingest an event | API Key |
| `GET` | `/api/v1/events` | List all events | JWT |
| `GET` | `/api/v1/events/:id` | Get event by ID | JWT |

### Delivery

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/delivery/attempts/:eventId` | List delivery attempts for an event | JWT |
| `GET` | `/api/v1/delivery/dead-letters` | List all dead letter events | JWT |
| `GET` | `/api/v1/delivery/dead-letters/:eventId` | Get dead letter event | JWT |
| `POST` | `/api/v1/delivery/dead-letters/:eventId/replay` | Replay a dead letter event | JWT |

### Stats

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/stats` | Overall delivery metrics | JWT |
| `GET` | `/api/v1/stats/:endpointId` | Per-endpoint delivery metrics | JWT |

---

## Webhook Signature Verification

Every webhook POST includes an `X-Hookman-Signature` header:

```
X-Hookman-Signature: sha256=<hmac_hex>
```

Verify it on your receiving server:

```ts
import crypto from "crypto";

const signature = req.headers["x-hookman-signature"];
const expected = `sha256=${crypto
  .createHmac("sha256", YOUR_ENDPOINT_SECRET)
  .update(JSON.stringify(req.body))
  .digest("hex")}`;

if (signature !== expected) {
  return res.status(401).send("Invalid signature");
}
```

---

## CI/CD Pipeline

```
feature/* → PR → CI (lint + typecheck + build)
                ↓
           development branch
                ↓
      Auto PR → main
                ↓
           CD → Render auto-deploy
```

- CI runs on every push and PR
- CD triggers only when CI passes on `main`
- Branch protection enforced on `main` and `development`

---

## Local Development Workflow

```bash
# start a new feature
git checkout development
git pull origin development
git checkout -b feat/your-feature

# after writing code
git add src/path/to/file.ts
git commit -m "feat(scope): description"
git push origin feat/your-feature

# open PR to development → CI passes → merge
# open PR to main → merge → auto-deploys to Render
```

---

## API Testing

A Bruno collection is included in `api-tests/` covering all endpoints with post-response scripts that auto-save tokens and IDs to environment variables.

See [api-tests/README.md](./api-tests/README.md) for setup instructions.

---

## License

ISC © [Rajeep](https://github.com/codewithrajeep)