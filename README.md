# Portfolio Platform

A professional personal brand, knowledge, and digital business platform.

Not a one-page resume site. This project is being built as a **portfolio + blog + tutorial library + course platform + service marketplace**, with payments and an admin dashboard behind it.

```text
Visitor discovers you
        ↓
Explores skills, topics, projects, and writing
        ↓
Trusts the work
        ↓
Hires you, buys a course, or books a service
```

Frontend and backend are **separate apps** (not a monorepo). Each has its own `package.json`, scripts, and environment.

---

## Status

Foundation is in place. Auth, catalog, LMS, and checkout are next.

| Area | State |
| --- | --- |
| Project structure | Done |
| React + TypeScript + Tailwind | Done |
| Express + TypeScript modules | Done |
| PostgreSQL + Prisma | Done |
| Health / API index | Done |
| Authentication | Done |
| Docker & CI/CD | Done |
| Portfolio CMS | Planned |
| Courses & payments | Planned |

---

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7 |
| Backend | Express 5, TypeScript, Zod |
| Database | PostgreSQL 16, Prisma 7 |
| Auth | JWT + httpOnly cookies, RBAC |
| Infra | Docker Compose (Postgres, API, web) + GitHub Actions |

---

## Architecture

```mermaid
flowchart LR
  Browser["Browser"] -->|:8080| Web["Nginx + React"]
  Web -->|/api/v1| API["Express API"]
  API --> PG["PostgreSQL"]
```

Backend is a **modular monolith**. Each domain owns its routes, controller, service, and repository:

```text
HTTP request
    → routes
    → controller
    → service
    → repository
    → PostgreSQL
```

Mounted modules:

```text
health · auth · users · portfolio · education · experience
projects · skills · fields · topics · certificates
blogs · tutorials · courses · enrollments
services · cart · orders · payments · reviews · contact
notifications · media · analytics · search · admin · audit
```

Public site features live in matching frontend folders under `frontend/src/features`.

---

## Repository layout

```text
portfolio/
├── frontend/                 React SPA
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/                  Express API
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   └── package.json
├── docker-compose.yml        Postgres + API + web
├── .github/workflows/ci.yml  Tests and image builds
└── requirements.md           Full product specification
```

---

## Prerequisites

- Node.js 22+
- npm
- Docker Desktop

A local Postgres on **5432** will not be touched. This project maps Docker Postgres to **5433**.

---

## Quick start

### 1. Start the database

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

API: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Web: [http://localhost:5173](http://localhost:5173)

Vite proxies `/api` to the Express server, so the SPA can call `/api/v1/...` without CORS issues in development.

---

## Testing

Tests use **Vitest**. Backend API tests run against a separate Postgres database, `portfolio_test`, on the same Docker instance (port 5433).

```bash
docker compose up -d postgres

# API unit + integration tests
cd backend
npx prisma generate
npm test

# Frontend unit + component tests
cd ../frontend
npm test
```

Watch mode:

```bash
npm run test:watch
```

CI runs both suites, then builds Docker images (`.github/workflows/ci.yml`). Images are published to GitHub Container Registry on pushes to `main`.

---

## Docker

Postgres-only (local `npm run dev` workflow):

```bash
docker compose up -d postgres
```

Full stack (API + web + Postgres):

```bash
cp .env.docker.example .env
docker compose --profile full up -d --build
```

- Site: [http://localhost:8080](http://localhost:8080)
- API (through Nginx): [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- Postgres: `localhost:5433`

Nginx serves the React app and proxies `/api` to the backend, so auth cookies stay on one origin. The API is not published on host port 4000, so local `npm run dev` can keep using [http://localhost:4000](http://localhost:4000). Port **8080** must be free for the Docker site.

---

## Environment

### Backend `backend/.env`

```env
NODE_ENV=development
PORT=4000
API_PREFIX=/api/v1
DATABASE_URL=postgresql://portfolio:portfolio@localhost:5433/portfolio?schema=public
CORS_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars
```

### Frontend `frontend/.env`

```env
VITE_API_URL=/api/v1
```

Never commit `.env` files. Use the `.env.example` files as templates.

---

## API

Standard success response:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Standard error response:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Route not found"
  }
}
```

Useful endpoints right now:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1` | API index |
| `GET` | `/api/v1/health` | Liveness |
| `GET` | `/api/v1/health/ready` | Database connectivity |
| `POST` | `/api/v1/auth/register` | Register |
| `POST` | `/api/v1/auth/login` | Login |
| `GET` | `/api/v1/auth/me` | Current user (cookie) |

Other module paths are mounted and waiting for their first handlers.

---

## Product vision

The long-term product is specified in [`requirements.md`](./requirements.md). In short:

**Portfolio** — about, experience, education, projects, certificates  
**Knowledge** — fields → skills → topics → blogs, tutorials, courses  
**Business** — services, checkout, payments, orders, dashboards

### MVP

Authentication, public portfolio, skills tree, blog, tutorials, services, courses, checkout, one payment provider, customer dashboard, admin dashboard, contact, SEO.

### Later

Reviews, coupons, progress certificates, search, notifications, analytics, quizzes, comments, subscriptions.

---

## Scripts

**Backend**

```bash
npm run dev              # tsx watch
npm run build            # prisma generate + tsc
npm run typecheck
npm test                 # Vitest (uses portfolio_test)
npx prisma generate
npx prisma migrate deploy
npx prisma studio
```

**Frontend**

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm test
```

**Docker**

```bash
docker compose up -d postgres                 # database only
docker compose --profile full up -d --build   # full stack
docker compose --profile full down
```

---

## Design notes

The public UI uses a paper-and-ink palette (warm off-white, charcoal, copper accent) with **Fraunces** for display type and **Figtree** for body text. The goal is an editorial engineering brand, not a generic dashboard look.

---

## License

Private project unless a license is added later.
