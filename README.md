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

Foundation is in place. Catalog, LMS, and checkout are next.

| Area | State |
| --- | --- |
| Project structure | Done |
| React + TypeScript + Tailwind | Done |
| Express + TypeScript modules | Done |
| PostgreSQL + Prisma | Done |
| Health / API index | Done |
| Authentication | Done |
| About Me | Done |
| Docker & CI/CD | Done |
| Production deployment | Ready |
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
| Infra | S3 + CloudFront (web), Docker registry + SSH + EC2 t4g.small (API) |

---

## Architecture

```mermaid
flowchart TB
  subgraph github [GitHub]
    Push["Push / PR"]
    Detect["Path filter"]
    Push --> Detect
  end

  subgraph frontendPipeline [Frontend]
    FeVal["Lint · test · build"]
    S3["S3"]
    CF["CloudFront"]
    Detect -->|frontend/**| FeVal
    FeVal -->|main| S3 --> CF
  end

  subgraph backendPipeline [Backend]
    BeVal["Lint · API tests"]
    BeImg["linux/arm64 image"]
    Registry["Docker registry"]
    SSH["SSH"]
    Detect -->|backend/**| BeVal
    Detect -->|backend/**| BeImg
    BeVal -->|main| Registry
    BeImg -->|main| Registry
    Registry --> SSH
  end

  subgraph edge [Public edge]
    Apex["rezaulkarim.dev"]
    CF --> Apex
    Apex -->|/api/*| Nginx
  end

  subgraph ec2 [EC2 t4g.small]
    Nginx["Nginx"]
    API["Node.js"]
    PG["PostgreSQL"]
    Redis["Redis"]
    Nginx --> API
    API --> PG
    API --> Redis
  end

  SSH --> ec2
  API --> Uploads["S3 uploads"]
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

Public About data: `GET /api/v1/portfolio/about`. Admins update it with `PUT /api/v1/portfolio/about`.

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
├── docker-compose.yml        Local Postgres + API + web
├── docker-compose.prod.yml   EC2: Nginx, API, Postgres, Redis
├── deploy/                   EC2 Nginx config, SSH release, backups
├── infra/terraform/          S3, CloudFront, EC2 t4g.small, IAM
├── .github/workflows/ci.yml  Path-filtered validate and release
├── .github/scripts/          Frontend S3 / CloudFront sync
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

CI is path-filtered. Frontend changes run lint, tests, and the production build, then publish `dist/` to S3 and invalidate CloudFront. Backend changes run lint and API tests on x86, build the `linux/arm64` image on a native ARM runner, then push to your Docker registry and release on EC2 over SSH.

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

## Production

The production topology is:

| Surface | Service |
| --- | --- |
| Site | S3 + CloudFront (`rezaulkarim.dev`; `www` redirects to apex) |
| API | CloudFront `/api/*` → Nginx on EC2 t4g.small |
| Runtime | Node.js, PostgreSQL, Redis on the instance |
| Files | Private S3 uploads bucket |
| Delivery | GitHub Actions → Docker registry → SSH → EC2 |

Auth cookies stay first-party because the browser talks only to CloudFront. Postgres, Redis, and the Node process are not on the public internet. Changes to the CloudFront SPA function (www → apex, keep `/api` on EC2) go live with `terraform apply`; frontend CI does not publish that function.

### Provision

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

Copy `github_actions_configuration` into the GitHub **production** environment. Set repository variable `DEPLOY_ENABLED=true` and `AWS_REGION` to match Terraform.

| GitHub | Purpose |
| --- | --- |
| `DEPLOY_ENABLED` | Variable. Must be `true` before releases run |
| `AWS_REGION` | Variable |
| `AWS_DEPLOY_ROLE_ARN` | Secret. GitHub OIDC role |
| `FRONTEND_BUCKET` | Secret |
| `CLOUDFRONT_DISTRIBUTION_ID` | Secret |
| `DOCKER_IMAGE` | Variable. Image name without a tag, e.g. `user/portfolio-backend` |
| `DOCKER_REGISTRY` | Variable. Empty for Docker Hub; `ghcr.io` for GHCR |
| `DOCKER_USERNAME` | Secret |
| `DOCKER_PASSWORD` | Secret. Hub token or registry password |
| `DEPLOY_HOST` | Secret. EC2 public IP |
| `DEPLOY_USER` | Secret. Usually `ec2-user` |
| `DEPLOY_SSH_KEY` | Secret. Private key that matches `ssh_public_key` |
| `DEPLOY_PATH` | Secret. Usually `/opt/portfolio` |

If the AWS account already has a GitHub OIDC provider, set `github_oidc_provider_arn` in `terraform.tfvars`. Optional: copy `backend.tf.example` to `backend.tf` for remote state.

### First release

Write `/opt/portfolio/.env` on the instance from `.env.production.example`. Set `FRONTEND_ORIGIN=https://rezaulkarim.dev`, JWT secrets, `DOCKER_IMAGE`, registry credentials if the image is private, and `S3_UPLOADS_BUCKET` to the Terraform `uploads_bucket` output. The API stores live media in that private bucket (instance role, no AWS keys). Put your deploy public key in `ssh_public_key`.

CI runs only on `main` (and manual `workflow_dispatch`). A merge into `main` that touches `frontend/**` publishes the site. A merge that touches `backend/**` publishes the ARM image, copies compose files over SCP, and runs `deploy/ec2-release.sh` over SSH. Protect `main` in GitHub so feature branches are merged in and nobody pushes `main` directly.

### Backups

```bash
/opt/portfolio/deploy/backup.sh
0 3 * * * /opt/portfolio/deploy/backup.sh
```

Dumps are kept for 14 days under `/opt/portfolio/backups`.

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
npm run lint
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

**Docker / AWS**

```bash
docker compose up -d postgres                 # local database
docker compose --profile full up -d --build   # local Nginx + API + web
cd infra/terraform && terraform apply         # AWS
/opt/portfolio/deploy/ec2-release.sh          # on EC2, also used over SSH
/opt/portfolio/deploy/backup.sh               # Postgres dump
```

---

## Design notes

The public UI uses a paper-and-ink palette (warm off-white, charcoal, copper accent) with **Fraunces** for display type and **Figtree** for body text. The goal is an editorial engineering brand, not a generic dashboard look.

---

## License

Private project unless a license is added later.
