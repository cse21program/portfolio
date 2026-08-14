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
| Authentication | Next |
| Portfolio CMS | Planned |
| Courses & payments | Planned |

---

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7 |
| Backend | Express 5, TypeScript, Zod |
| Database | PostgreSQL 16, Prisma 7 |
| Auth (planned) | JWT + httpOnly cookies, RBAC |
| Infra | Docker Compose for Postgres |

---

## Architecture

```mermaid
flowchart LR
  Browser["React SPA :5173"] -->|/api/v1| API["Express API :4000"]
  API --> PG["PostgreSQL :5433"]
  API --> Modules["Feature modules"]
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
│   ├── src/
│   │   ├── app/              Router and app shell
│   │   ├── components/       Layout and shared UI
│   │   ├── features/         Route-level feature modules
│   │   ├── config/           Site and environment
│   │   └── lib/              API client
│   └── package.json
├── backend/                  Express API
│   ├── prisma/               Schema and migrations
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── common/           Config, errors, middleware
│   │   └── modules/          One folder per domain
│   └── package.json
├── docker-compose.yml        PostgreSQL 16
└── requirements.md           Full product specification
```

---

## Prerequisites

- Node.js 20+
- npm
- Docker Desktop (for PostgreSQL)

A local Postgres on **5432** will not be touched. This project maps Docker Postgres to **5433**.

---

## Quick start

### 1. Start the database

```bash
docker compose up -d
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
| `POST` | `/api/v1/auth/register` | Register (stub) |
| `POST` | `/api/v1/auth/login` | Login (stub) |

Auth currently returns `501` until that module is implemented. Other module paths are mounted and waiting for their first handlers.

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
```

---

## Design notes

The public UI uses a paper-and-ink palette (warm off-white, charcoal, copper accent) with **Fraunces** for display type and **Figtree** for body text. The goal is an editorial engineering brand, not a generic dashboard look.

---

## License

Private project unless a license is added later.
