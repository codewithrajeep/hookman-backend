# Hookman

> A webhook delivery service with guaranteed delivery, automatic retries, and real-time monitoring.

![CI](https://github.com/codewithrajeep/hookman-backend/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-20-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

---

## What is Hookman?

Hookman is a webhook delivery service. Apps register HTTP endpoints with Hookman, send events to it, and Hookman guarantees delivery — queuing jobs, retrying on failure with exponential backoff, parking dead jobs in a dead letter queue, and streaming every delivery attempt live to a dashboard.

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
Worker delivers via HTTP POST
       ↓
Success → DeliveryAttempt recorded
Failure → Retry with exponential backoff
       ↓
After N failures → Dead Letter Queue
       ↓
Dashboard streams live delivery status via WebSocket
```

---

## Tech Stack

**Backend**
- Node.js 20 + TypeScript
- Express 5
- PostgreSQL (Neon) + Prisma 7
- Redis (Upstash) + BullMQ
- ioredis
- Pino (structured logging)
- Zod (env validation)

**Frontend** *(Phase 5)*
- Next.js 15 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- TanStack Query v5 + Zustand v5
- WebSocket (live delivery feed)

**Infrastructure**
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Render (backend deployment)
- Vercel (frontend deployment)

---

## Project Status

This project is being built in phases. Each phase ships a working increment.

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation — Prisma schema, Redis, Express, Docker, CI/CD | ✅ Complete |
| Phase 2 | Auth + API Keys — JWT, API key generation, auth middleware | 🔄 In Progress |
| Phase 3 | Endpoints + Events — CRUD, event ingestion, BullMQ enqueue | ⬜ Planned |
| Phase 4 | Delivery + Retry + DLQ — Worker, exponential backoff, dead letter queue | ⬜ Planned |
| Phase 5 | WebSocket + Dashboard — Live feed, Next.js frontend | ⬜ Planned |
| Phase 6 | CI/CD + Production — Full deploy, monitoring, docs | ⬜ Planned |

---

## Database Schema

```
User
 ├── ApiKey[]        (hashed keys with prefix)
 └── Endpoint[]      (registered webhook URLs)
      └── Event[]         (incoming events)
           └── DeliveryAttempt[]   (per-attempt records)

DeadLetterEvent     (failed events after max retries)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
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
| `NODE_ENV` | `development` / `production` |
| `DATABASE_URL` | PostgreSQL pooled connection string |
| `DIRECT_URL` | PostgreSQL direct connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `REDIS_URL` | Redis connection string |

### Running Locally

```bash
# run migrations
pnpm prisma migrate dev

# generate prisma client
pnpm prisma generate

# start dev server
pnpm dev
```

Server starts at `http://localhost:3000`

Health check: `GET /health`

### Running with Docker

```bash
docker compose up
```

---

## API Reference

> Full API docs coming in Phase 3. Base URL: `https://hookman-api.onrender.com`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Register a new user | None |
| `POST` | `/api/v1/auth/login` | Login and get JWT | None |
| `GET` | `/api/v1/endpoints` | List endpoints | JWT |
| `POST` | `/api/v1/endpoints` | Register an endpoint | JWT |
| `POST` | `/api/v1/events` | Send an event | API Key |
| `GET` | `/api/v1/deliveries` | List delivery attempts | JWT |

---

## CI/CD Pipeline

Every push goes through:

```
feature/* → PR → CI (lint + typecheck + build + migrate)
                ↓
           development branch
                ↓
      Auto PR → main (end of phase)
                ↓
           CD → Render deploy
```

- **CI** runs on every push and PR
- **CD** triggers only when CI passes on `main`
- Branch protection enforced on both `main` and `development`

---

## Local Development Workflow

```bash
# start a new feature
git checkout development
git pull origin development
git checkout -b feature/your-feature

# after writing a file
git add src/path/to/file.ts
git commit -m "feat(scope): description"
git push origin feature/your-feature

# open PR to development on GitHub
# CI passes → merge → done
```

---

## License

ISC © [Rajeep](https://github.com/codewithrajeep)
