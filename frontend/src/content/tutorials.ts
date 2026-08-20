import type { Tutorial } from "@/types/public";
import { normalizeTutorialList } from "@/types/tutorial";

/** Keep in sync with backend/src/modules/tutorials/tutorials.seed.ts */

export const tutorials: Tutorial[] = normalizeTutorialList([
  {
    "title": "Docker complete tutorial",
    "slug": "docker-complete",
    "description": "From images and containers to volumes, networking, Compose, and a deployable API stack — the same habits this site uses to run Postgres on 5433.",
    "difficulty": "Beginner",
    "prerequisites": [
      "A laptop you can install Docker Desktop on",
      "Comfort with a terminal"
    ],
    "duration": "4 hours",
    "thumbnailUrl": null,
    "skill": "Docker",
    "relatedSkillSlugs": [
      "docker"
    ],
    "relatedCourseSlugs": [
      "production-docker"
    ],
    "price": "Free",
    "free": true,
    "sections": [
      {
        "title": "Introduction",
        "summary": "Why containers, and what problem they actually solve.",
        "body": [
          "Containers package an app with its runtime so the same image runs on a laptop, CI, and a host.",
          "A container is not a tiny virtual machine. It is a packaged process with a declared network and disk contract — without a second set of install notes for every environment.",
          "The expensive failure is 'it works on my machine' because the machine had a global Node, a Postgres on 5432, and an env file nobody else loaded. Images freeze the runtime. Compose freezes how the API finds the database.",
          "This walkthrough stays practical. We build an image, run a container, keep Postgres data in a volume, put the API and database on one network, then promote the same image you tested."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [],
        "resources": [
          {
            "label": "Docker overview",
            "url": "https://docs.docker.com/get-started/overview/"
          }
        ],
        "downloads": []
      },
      {
        "title": "Installation",
        "summary": "Docker Desktop and the CLI on macOS.",
        "body": [
          "Install Docker Desktop for Mac and confirm the engine answers before you write a Dockerfile. The CLI talks to a Linux VM; if Desktop is stopped, every command fails with a socket error that looks like a bad file path.",
          "You want docker, docker compose, and a context pointing at desktop-linux. After that, hello-world is enough to prove pull, run, and logs work on this machine."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Confirm the engine",
            "language": "bash",
            "code": "docker version\ndocker compose version\ndocker run --rm hello-world"
          }
        ],
        "resources": [
          {
            "label": "Docker Desktop for Mac",
            "url": "https://docs.docker.com/desktop/setup/install/mac-install/"
          }
        ],
        "downloads": []
      },
      {
        "title": "Images",
        "summary": "Build context, layers, and tagging.",
        "body": [
          "An image is a stack of layers. Each Dockerfile instruction that changes the filesystem adds a layer. Put the rarely changing steps first — system packages, dependency install — so source edits reuse the cache.",
          "The build context is the directory you pass to docker build. A fat context (node_modules, .git, dist) makes every build slow and can leak secrets. .dockerignore is not optional.",
          "Tag what you intend to run: name:gitsha in CI, name:local on a laptop. latest is a moving pointer, not a version."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Ignore files that must not enter the context",
            "language": "text",
            "code": "node_modules\ndist\n.git\n.env\n*.log"
          }
        ],
        "resources": [
          {
            "label": "Dockerfile reference",
            "url": "https://docs.docker.com/reference/dockerfile/"
          }
        ],
        "downloads": []
      },
      {
        "title": "Containers",
        "summary": "Run, logs, exec, and lifecycle.",
        "body": [
          "A container is a running (or stopped) instance of an image. docker run creates it; docker logs follows stdout; docker exec is for debugging, not for configuring production.",
          "Name the container in Compose. On the CLI, prefer --rm for one-shot jobs so you do not collect exited containers that still hold names and ports.",
          "If the process inside exits, the container exits. A Node server that crashes on a missing DATABASE_URL is a failed container, not a mysterious Docker bug."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Run, inspect, stop",
            "language": "bash",
            "code": "docker run --name api -p 4000:4000 --rm portfolio-api:local\ndocker logs -f api\ndocker exec -it api sh"
          }
        ],
        "resources": [],
        "downloads": []
      },
      {
        "title": "Volumes",
        "summary": "Keep Postgres data when the container dies.",
        "body": [
          "Container filesystems are ephemeral. Postgres that stores data in the container loses it on docker compose down -v, and often on a recreate. A named volume keeps the cluster data directory off the container layer.",
          "Bind mounts are for source you are editing. Named volumes are for database files. Do not bind-mount a host folder into pgdata unless you like permission fights on macOS.",
          "This project keeps API state in Postgres. The volume is the difference between a disposable sandbox and a database you can actually develop against."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Named volume for Postgres",
            "language": "yaml",
            "code": "services:\n  postgres:\n    image: postgres:16\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:"
          }
        ],
        "resources": [
          {
            "label": "Use volumes",
            "url": "https://docs.docker.com/engine/storage/volumes/"
          }
        ],
        "downloads": []
      },
      {
        "title": "Networking",
        "summary": "Published ports versus service DNS.",
        "body": [
          "Containers on a Compose network reach each other by service name. The API should call postgres:5432, not localhost:5432. localhost inside a container is the container.",
          "Published ports map host → container for your laptop and for tools like Prisma Studio. This site publishes Postgres on 5433 so a local server on 5432 can keep running. Compose gives the API a hostname; your machine gets a port.",
          "If Prisma says connection refused, check which Postgres is actually listening — Desktop, Homebrew, or Compose — not which one you meant."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Host port versus service DNS",
            "language": "yaml",
            "code": "services:\n  postgres:\n    ports:\n      - \"5433:5432\"\n  api:\n    environment:\n      DATABASE_URL: postgres://app:app@postgres:5432/portfolio"
          }
        ],
        "resources": [
          {
            "label": "Docker networking explained for API developers",
            "url": "/blog/docker-networking"
          },
          {
            "label": "Bridge networks",
            "url": "https://docs.docker.com/engine/network/drivers/bridge/"
          }
        ],
        "downloads": []
      },
      {
        "title": "Dockerfile",
        "summary": "Multi-stage builds for Node and Java.",
        "body": [
          "A production image should not contain compilers, test fixtures, or your laptop's npm cache. Multi-stage builds compile in one stage and copy the artifact into a thin runtime image.",
          "For Node, install dependencies in a stage with the lockfile, build, then copy dist and production node_modules into a runtime based on node:22-alpine or distroless. For Java, build the jar with Temurin JDK, run it on a JRE image.",
          "Run as a non-root user. Set a healthcheck that hits /health, not a process that is merely PID 1."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Multi-stage Node API",
            "language": "docker",
            "code": "FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=build /app/package.json /app/package-lock.json ./\nCOPY --from=build /app/node_modules ./node_modules\nCOPY --from=build /app/dist ./dist\nUSER node\nCMD [\"node\", \"dist/server.js\"]"
          }
        ],
        "resources": [
          {
            "label": "Multi-stage builds",
            "url": "https://docs.docker.com/build/building/multi-stage/"
          }
        ],
        "downloads": []
      },
      {
        "title": "Compose",
        "summary": "API + Postgres with one command.",
        "body": [
          "Compose is how this repo runs. One file describes the API, Postgres, ports, volumes, and the network they share. docker compose up --build is the onboarding command.",
          "depends_on without a healthcheck only waits for the container to start, not for Postgres to accept connections. Use a healthcheck on Postgres and condition: service_healthy on the API, or let the API retry.",
          "Keep a compose file for development and a narrower one for production. Bind-mounts and published database ports belong on the laptop, not on a public host."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "API and Postgres",
            "language": "yaml",
            "code": "services:\n  postgres:\n    image: postgres:16\n    environment:\n      POSTGRES_USER: app\n      POSTGRES_PASSWORD: app\n      POSTGRES_DB: portfolio\n    ports:\n      - \"5433:5432\"\n    healthcheck:\n      test: [\"CMD-SHELL\", \"pg_isready -U app -d portfolio\"]\n      interval: 5s\n      retries: 10\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n  api:\n    build: ./backend\n    depends_on:\n      postgres:\n        condition: service_healthy\n    ports:\n      - \"4000:4000\"\n    environment:\n      DATABASE_URL: postgres://app:app@postgres:5432/portfolio\nvolumes:\n  pgdata:"
          }
        ],
        "resources": [
          {
            "label": "Compose specification",
            "url": "https://docs.docker.com/reference/compose-file/"
          }
        ],
        "downloads": []
      },
      {
        "title": "Deployment",
        "summary": "Promote the same image you tested.",
        "body": [
          "Build once. Tag with a git SHA. Run that digest in staging, then in production. Rebuilding on the server with different base layers is how 'it passed CI' becomes a different artifact.",
          "Pass config through the environment. Bake URLs and secrets into the image and you cannot promote it. Healthchecks, structured logs, and a read-only root filesystem are the difference between a demo and a service.",
          "When something fails in production, start with the image id and the compose or task definition that started it — not with a fresh docker build on the host."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [],
        "resources": [
          {
            "label": "Production Docker course",
            "url": "/courses/production-docker"
          }
        ],
        "downloads": []
      }
    ],
    "publishedAt": "2026-06-02",
    "status": "published",
    "seoTitle": "Docker complete tutorial",
    "seoDescription": "Images, containers, volumes, networks, Compose, and a deployable API stack for backend developers.",
    "canonicalUrl": ""
  },
  {
    "title": "Express modules that stay maintainable",
    "slug": "express-modules",
    "description": "A practical layout for routes, controllers, services, and repositories in TypeScript — the seam this API already uses.",
    "difficulty": "Intermediate",
    "prerequisites": [
      "TypeScript",
      "Basic Express routing"
    ],
    "duration": "2 hours",
    "thumbnailUrl": null,
    "skill": "Node.js",
    "relatedSkillSlugs": [
      "nodejs"
    ],
    "relatedCourseSlugs": [],
    "price": "Free",
    "free": true,
    "sections": [
      {
        "title": "Why modules",
        "summary": "Boundaries before frameworks.",
        "body": [
          "This platform has many domains: portfolio, courses, payments, media. That is not a reason to start with six services. It is a reason to stop dumping everything into a helpers folder.",
          "A module owns a URL prefix, a controller, a service, a repository, and its validation. Other modules talk to it through the service, not by importing SQL. The seam is already there if a module later needs its own process.",
          "The expensive mistake is coupling checkout to the blog because both happened to share a file named utils.ts."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [],
        "resources": [
          {
            "label": "Start with a modular monolith",
            "url": "/blog/modular-monolith"
          }
        ],
        "downloads": []
      },
      {
        "title": "Folder layout",
        "summary": "One domain, one folder.",
        "body": [
          "Under src/modules each domain is a folder: blogs, tutorials, auth. index.ts exports the router and the basePath. The app registers modules; it does not reach into repositories.",
          "Keep types next to the module. Shared primitives — AppError, prisma, sendSuccess — live in common. If two modules need the same query, one of them owns it and the other calls the service.",
          "Tests sit beside the behaviour: API tests hit the router, unit tests cover pure helpers. That split stays cheap as the catalog grows."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Register a module",
            "language": "typescript",
            "code": "export const tutorialsModule: AppModule = {\n  name: \"tutorials\",\n  basePath: \"/tutorials\",\n  router,\n};\n\napp.use(`${apiPrefix}${mod.basePath}`, mod.router);"
          }
        ],
        "resources": [],
        "downloads": []
      },
      {
        "title": "Error envelope",
        "summary": "Stable JSON errors.",
        "body": [
          "Clients should not parse Express default HTML error pages. Every failure is JSON: a code, a message, optional field details. HTTP status is for the transport; the code is for the client.",
          "Throw AppError from services. A wrapper turns it into the envelope and logs unexpected failures without leaking stack traces to the browser.",
          "Validation errors use the same shape with a details array. The Studio forms already consume that list; do not invent a second format for 'just this module'."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Envelope the client can switch on",
            "language": "json",
            "code": "{\n  \"success\": false,\n  \"error\": {\n    \"code\": \"VALIDATION_ERROR\",\n    \"message\": \"Each tutorial slug must be unique\",\n    \"details\": [{ \"path\": \"tutorials\", \"message\": \"Each tutorial slug must be unique\" }]\n  }\n}"
          }
        ],
        "resources": [],
        "downloads": []
      },
      {
        "title": "Validation",
        "summary": "Zod at the edge.",
        "body": [
          "Parse the body once, at the route, with Zod. The service receives a typed object. If you parse again in the repository, you no longer have a single source of truth.",
          "Coerce empty strings to null for optional media. Reject javascript: URLs. Unique slugs belong in a superRefine on the list, not in a later database error the user cannot read.",
          "Keep max lengths honest. A 20k code snippet is a teaching aid; a 2MB string in JSON is an accident."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Validate then handle",
            "language": "typescript",
            "code": "router.put(\n  \"/\",\n  requireAuth,\n  requireRole(\"ADMIN\"),\n  validateRequest(updateTutorialListSchema),\n  asyncHandler(tutorialsController.replaceAll),\n);"
          }
        ],
        "resources": [
          {
            "label": "Zod",
            "url": "https://zod.dev/"
          }
        ],
        "downloads": []
      }
    ],
    "publishedAt": "2025-12-01",
    "status": "published",
    "seoTitle": "Express modules that stay maintainable",
    "seoDescription": "Routes, controllers, services, repositories, JSON errors, and Zod at the edge in TypeScript.",
    "canonicalUrl": ""
  },
  {
    "title": "JWT access control for Spring APIs",
    "slug": "jwt-api-security",
    "description": "Issue short-lived access tokens, rotate refresh tokens, and authorize every privileged action from the user record — not from claims the client sent.",
    "difficulty": "Intermediate",
    "prerequisites": [
      "Java",
      "REST APIs"
    ],
    "duration": "3 hours",
    "thumbnailUrl": null,
    "skill": "Spring Boot",
    "relatedSkillSlugs": [
      "spring-boot",
      "java"
    ],
    "relatedCourseSlugs": [
      "spring-boot-masterclass"
    ],
    "price": "$29",
    "free": false,
    "sections": [
      {
        "title": "Why JWTs are not a permission system",
        "summary": "Claims are transport. Authorization still lives on the server.",
        "body": [
          "JWTs are a transport for claims, not a security architecture. If the API trusts a token because it decoded, you have a client-side permission system with extra steps.",
          "A forged or stale role claim must not raise privileges. The token proves who presented it, for a short time. What they may do is read from the user record, every time.",
          "This walkthrough uses Spring Security the way I would ship it: short-lived access tokens, rotated refresh tokens, and method security that hits the database."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [],
        "resources": [
          {
            "label": "JWT authentication without painting yourself into a corner",
            "url": "/blog/jwt-authentication"
          }
        ],
        "downloads": []
      },
      {
        "title": "Access tokens",
        "summary": "Keep them short-lived and boring.",
        "body": [
          "Put the subject and a handful of display claims in the access token. Do not put permissions you are unwilling to re-check. Fifteen minutes is a reasonable default; an hour is already generous.",
          "Sign with a rotating key you control. Accept only your issuer and audience. Clock skew of a minute is enough; do not 'fix' expiry by stretching it.",
          "The browser stores the access token in memory. The refresh token is an httpOnly cookie. If you put both in localStorage, XSS becomes a session steal."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Claims the API will actually trust",
            "language": "json",
            "code": "{\n  \"sub\": \"user-id\",\n  \"iss\": \"https://rezaulkarim.dev\",\n  \"aud\": \"portfolio-api\",\n  \"exp\": 1780000000\n}"
          }
        ],
        "resources": [],
        "downloads": []
      },
      {
        "title": "Refresh rotation",
        "summary": "Rotate on use and reject reuse.",
        "body": [
          "A refresh token is a capability to mint a new access token. Treat it like a password: random, hashed at rest, one active family per device.",
          "On every refresh, issue a new token and revoke the old one. If the old token is presented again, revoke the whole family. That is how you detect theft instead of extending it.",
          "Expire refresh tokens on logout and on password change. Do not silently refresh in a hidden iframe for days."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Rotate or kill the family",
            "language": "java",
            "code": "public TokenPair refresh(String presented) {\n  var stored = refreshTokens.findActive(hash(presented))\n      .orElseThrow(() -> new AppException(\"invalid_refresh\"));\n  if (stored.isRevoked()) {\n    refreshTokens.revokeFamily(stored.familyId());\n    throw new AppException(\"refresh_reuse\");\n  }\n  stored.revoke();\n  return issuePair(stored.userId(), stored.familyId());\n}"
          }
        ],
        "resources": [],
        "downloads": []
      },
      {
        "title": "Spring Security wiring",
        "summary": "Filters, user lookup, and method security.",
        "body": [
          "The JWT filter authenticates: it sets a principal from a valid signature. It does not authorize. @PreAuthorize and security rules load the user and their roles from persistence.",
          "Permit login, refresh, and public GETs. Everything else authenticated. Admin routes check role ADMIN from the user row, not from a claim named role that the client can echo.",
          "Disable default form login if this is an API. CORS and CSRF follow cookie rules: same-site cookies for the SPA, or bearer tokens without cookie CSRF."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Authorize from the user record",
            "language": "java",
            "code": "@PreAuthorize(\"hasRole('ADMIN')\")\n@PutMapping(\"/api/v1/tutorials\")\npublic ApiResponse<List<Tutorial>> replaceAll(@Valid @RequestBody UpdateTutorials body) {\n  return ApiResponse.ok(tutorials.replaceAll(body));\n}"
          }
        ],
        "resources": [
          {
            "label": "Spring Security architecture",
            "url": "https://docs.spring.io/spring-security/reference/servlet/architecture.html"
          }
        ],
        "downloads": []
      },
      {
        "title": "Tests you can keep",
        "summary": "Prove a forged claim cannot raise privileges.",
        "body": [
          "A green unit test that parses a JWT you just minted proves almost nothing. Write the test that forges role ADMIN in an otherwise valid token and still gets 403 on an admin route.",
          "Cover reuse of a rotated refresh token, expiry, and a user who was suspended after the token was issued. Those are the incidents you will actually debug.",
          "Keep the tests against the HTTP layer with MockMvc or the real server. Authorization bugs live in filters and annotations, not in the JwtService happy path."
        ],
        "videoUrl": null,
        "images": [],
        "codeSnippets": [
          {
            "label": "Forged role must not pass",
            "language": "java",
            "code": "@Test\nvoid forgedAdminClaimIsForbidden() throws Exception {\n  var token = jwt.sign(userId, Map.of(\"role\", \"ADMIN\"));\n  mockMvc.perform(put(\"/api/v1/tutorials\")\n          .header(\"Authorization\", \"Bearer \" + token)\n          .contentType(APPLICATION_JSON)\n          .content(\"{}\"))\n      .andExpect(status().isForbidden());\n}"
          }
        ],
        "resources": [
          {
            "label": "Production-grade Spring Boot",
            "url": "/courses/spring-boot-masterclass"
          }
        ],
        "downloads": []
      }
    ],
    "publishedAt": "2026-08-01",
    "status": "published",
    "seoTitle": "JWT access control for Spring APIs",
    "seoDescription": "Short-lived access tokens, refresh rotation, and authorization from the user record in Spring Security.",
    "canonicalUrl": ""
  }
]);

export function getTutorial(slug: string) {
  return tutorials.find((tutorial) => tutorial.slug === slug);
}
