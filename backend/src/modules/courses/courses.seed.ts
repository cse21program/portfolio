import { inferLessonKind, type CourseLesson, type CourseModule, type CourseWrite } from "./courses.types";

function lesson(title: string, summary: string, extra: Partial<CourseLesson> = {}): CourseLesson {
  const built = {
    title,
    summary,
    body: extra.body ?? [],
    videoUrl: extra.videoUrl ?? null,
    images: extra.images ?? [],
    codeSnippets: extra.codeSnippets ?? [],
    resources: extra.resources ?? [],
    downloads: extra.downloads ?? [],
    pdfs: extra.pdfs ?? [],
    quiz: extra.quiz ?? { passingScore: 70, questions: [] },
    assignment: extra.assignment ?? { brief: [], requirements: [], submission: "none" as const, dueNote: "" },
  };
  return {
    ...built,
    kind: extra.kind ?? inferLessonKind(built),
  };
}

function module(title: string, summary: string, lessons: CourseLesson[]): CourseModule {
  return { title, summary, lessons };
}

export const defaultCourses: CourseWrite[] = [
  {
    id: "b2e2d9f1-0000-4000-8000-000000000080",
    title: "Production-grade Spring Boot",
    slug: "spring-boot-masterclass",
    subtitle: "APIs, security, persistence, and deployment.",
    description:
      "A structured course for building Spring Boot services that can survive real traffic, real auth, and real operations.",
    overview: [
      "This is the path I use for Spring Boot services that leave a laptop. You will design resources, reject bad input, keep persistence behind a service, and ship an image with health checks instead of a README full of hope.",
      "The course is linear. Each module assumes the previous one is in place. Skip ahead only if you already have a service that validates requests and fails closed when the database is down.",
    ],
    thumbnailUrl: null,
    promoVideoUrl: null,
    instructor: "Rezaul Karim",
    category: "Backend",
    skill: "Spring Boot",
    difficulty: "Intermediate",
    language: "English",
    duration: "18 hours",
    requirements: [
      "Java 21 on the PATH",
      "Comfort with REST and JSON",
      "Docker Desktop for the deployment module",
    ],
    outcomes: [
      "Design REST resources with consistent errors",
      "Secure endpoints with Spring Security",
      "Model data with JPA without leaking persistence",
      "Package and run the service with Docker",
    ],
    audience: [
      "Backend engineers shipping Spring APIs",
      "Teams replacing a tutorial project with production habits",
    ],
    price: "$149",
    salePrice: "$99",
    currency: "USD",
    free: false,
    featured: true,
    certificateAvailable: true,
    relatedSkillSlugs: ["java"],
    relatedTutorialSlugs: ["jwt-api-security"],
    relatedCourseSlugs: ["production-docker"],
    modules: [
      module("Fundamentals", "Packages, configuration, and validation before you write a controller.", [
        lesson("Application structure", "Packages that match how the service actually changes.", {
          body: [
            "A Spring Boot service that will last more than a weekend needs a package layout people can find without a slide. Controllers stay thin. Services own use cases. Persistence stays in repositories. Configuration lives in its own package, not next to domain types.",
            "## What belongs where",
            "- Controllers stay thin\n- Services own use cases\n- Persistence stays in repositories\n- Configuration lives in its own package",
            "> The expensive failure is a class that cannot move because everything imports it.",
            "I keep the main class in the root package so component scan is boring. Tests live next to the code they prove. If a new endpoint requires touching six unrelated files, the layout is already lying.",
          ],
          codeSnippets: [
            {
              label: "Package layout",
              language: "text",
              code: "com.rezaul.catalog\n  CatalogApplication.java\n  api/           # controllers, request/response records\n  application/   # use cases\n  domain/        # entities that are not JPA-shaped\n  persistence/   # Spring Data repositories\n  config/        # security, jackson, web",
            },
          ],
          resources: [{ label: "Spring Boot application structure", url: "https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html" }],
        }),
        lesson("Configuration", "Typed properties and profiles, not a pile of @Value.", {
          body: [
            "Configuration belongs in application.yml with a documented prefix, bound to a @ConfigurationProperties record. Scattered @Value strings are how secrets and ports drift between local, CI, and the host.",
            "Use profiles for what actually changes: datasource URL, log level, cookie flags. Do not fork the whole file per environment. Twelve-factor still applies: the image is the same; the environment supplies the rest.",
            "Fail fast on missing required properties. A service that starts with a blank JWT secret is not 'flexible'. It is already compromised.",
          ],
          codeSnippets: [
            {
              label: "Bind a prefix",
              language: "java",
              code: "@ConfigurationProperties(prefix = \"catalog\")\npublic record CatalogProperties(String issuer, Duration accessTtl) {}",
            },
          ],
          resources: [{ label: "Externalized configuration", url: "https://docs.spring.io/spring-boot/reference/features/external-config.html" }],
        }),
        lesson("Validation", "Reject bad requests at the edge, in the type system.", {
          body: [
            "Put Bean Validation on request records. The controller should not parse strings into enums by hand. If the body is wrong, return 400 with a stable error shape — not a stack trace and not a generic 'error'.",
            "Validate path and query parameters the same way. Pagination size, sort fields, and UUIDs belong in the contract. Do not wait for JPA to throw because someone sent page=-1.",
            "Keep domain invariants in the service. HTTP validation is for shape. 'This SKU cannot be archived while it has open orders' is not a @NotBlank problem.",
          ],
          codeSnippets: [
            {
              label: "Request record",
              language: "java",
              code: "public record CreateItemRequest(\n    @NotBlank @Size(max = 160) String title,\n    @NotNull @Positive BigDecimal price\n) {}",
            },
          ],
        }),
      ]),
      module("REST API", "Resources, lists, and errors that clients can code against.", [
        lesson("Resource design", "Nouns, status codes, and a payload that does not leak tables.", {
          body: [
            "A resource is a thing a client can name: /items/{id}, not /getItem. Collections are lists with filters. Mutations return the new representation or 204 when there is nothing useful to echo.",
            "Do not expose entity graphs. Map to response records. Hide generated IDs only if the public identifier is a slug — and then keep the slug stable. Nested writes that update three tables in one POST are a smell; split the use cases.",
            "Idempotency matters for payments and enrollments later. For this course, PUT and DELETE should be safe to retry. POST that creates should not create twice because the client double-clicked.",
          ],
          codeSnippets: [
            {
              label: "Collection and item",
              language: "text",
              code: "GET    /api/v1/items\nPOST   /api/v1/items\nGET    /api/v1/items/{id}\nPUT    /api/v1/items/{id}\nDELETE /api/v1/items/{id}",
            },
          ],
          resources: [{ label: "RFC 9110 HTTP semantics", url: "https://www.rfc-editor.org/rfc/rfc9110" }],
        }),
        lesson("Pagination", "Stable lists that do not melt the database.", {
          body: [
            "Offset pagination is fine until the table is large and clients skip deep pages. Cursor pagination is kinder to indexes. Either way, cap page size. Unbounded lists are an incident waiting for a crawler.",
            "Return total counts only when you need them. COUNT(*) on every list request is how dashboards feel fast in staging and stall in production.",
            "Sort on indexed columns. If the UI can sort by anything, you will get ORDER BY description and a sequential scan. Document the allowed sort keys in the API.",
          ],
          codeSnippets: [
            {
              label: "Capped page query",
              language: "java",
              code: "@GetMapping\npublic Page<ItemResponse> list(\n    @RequestParam(defaultValue = \"0\") @Min(0) int page,\n    @RequestParam(defaultValue = \"20\") @Min(1) @Max(100) int size) {\n  return items.list(PageRequest.of(page, size, Sort.by(\"createdAt\").descending()));\n}",
            },
          ],
        }),
        lesson("Exception handling", "One error envelope, no leaked SQL.", {
          body: [
            "A @ControllerAdvice that maps MethodArgumentNotValidException, NoHandlerFound, and your domain exceptions to the same JSON shape is not polish. It is how mobile and web clients share one parser.",
            "Never return Hibernate messages. 'could not execute statement' is an internal incident, not a 400. Log the cause with a request id. Tell the client a code they can search in your docs.",
            "404 for missing resources. 409 for conflicts. 401/403 for auth. 429 if you rate-limit. 500 only when you do not know. Mixing those is how operators cannot tell a bad deploy from a bad payload.",
          ],
          codeSnippets: [
            {
              label: "Stable error body",
              language: "json",
              code: "{\n  \"success\": false,\n  \"error\": {\n    \"code\": \"RESOURCE_NOT_FOUND\",\n    \"message\": \"Course not found\"\n  }\n}",
            },
          ],
        }),
        lesson("API error contract", "Check that you can tell a bad payload from a missing row.", {
          kind: "quiz",
          quiz: {
            passingScore: 70,
            questions: [
              {
                prompt: "A client sends page=-1. What should the API return?",
                choices: ["500 with a Hibernate message", "400 with a stable error code", "200 and an empty list", "302 to /docs"],
                answerIndex: 1,
                explanation: "Shape errors are 400. Database exceptions are incidents, not a public contract.",
              },
              {
                prompt: "A GET for an unknown id should be:",
                choices: ["400 validation failed", "404 resource not found", "500 internal", "204 no content"],
                answerIndex: 1,
                explanation: "Missing resources are 404. 204 is for a successful empty mutation, not a missing row.",
              },
            ],
          },
        }),
      ]),
      module("Security", "Users, tokens, and method checks that fail closed.", [
        lesson("Users and roles", "The user record is the source of truth, not the JWT.", {
          body: [
            "Store users with a status, a password hash or a federated id, and roles that mean something in this product: CUSTOMER and ADMIN is enough for many sites. Do not invent ROLE_SUPER_POWER until you have a use case.",
            "Load the user on each privileged request. A token can be valid and the account suspended. If authorization reads only the JWT, you cannot lock someone out without waiting for expiry.",
            "Hash passwords with a slow algorithm. Never log tokens or raw passwords. First registered user as ADMIN is a bootstrap, not a security model — document it so you do not ship that accident to production twice.",
          ],
          codeSnippets: [
            {
              label: "Fail closed on status",
              language: "java",
              code: "if (user.status() != UserStatus.ACTIVE) {\n  throw new DisabledException(\"Account is not active\");\n}",
            },
          ],
        }),
        lesson("JWT", "Short-lived access, boring claims, server-side authorization.", {
          body: [
            "A JWT is transport for a subject and an expiry. It is not a permission database. Keep access tokens short. Put roles in the token only as a cache; still check the user row for anything that can change.",
            "Sign with a rotating secret or a key pair you actually rotate. Reject tokens with the wrong issuer or audience. Do not accept alg=none. Do not put PII you would not print on an invoice into claims.",
            "Refresh tokens belong in httpOnly cookies or a rotated store. A long-lived JWT in localStorage is a tutorial, not a session.",
          ],
          codeSnippets: [
            {
              label: "Minimal claims",
              language: "json",
              code: "{\n  \"sub\": \"user-id\",\n  \"iss\": \"https://rezaulkarim.dev\",\n  \"exp\": 1710000000\n}",
            },
          ],
          resources: [{ label: "JWT access control tutorial", url: "/tutorials/jwt-api-security" }],
        }),
        lesson("Method security", "Authorize the action, not just the URL.", {
          body: [
            "HTTP security rules catch anonymous traffic. Method security catches the case where two roles share a controller. Prefer @PreAuthorize on the service method that mutates data, so a new controller cannot skip the check.",
            "Test both allow and deny. A test that only hits 200 with an admin token does not prove a customer is blocked. Use the same request as production: cookie or bearer, not a mocked SecurityContext that never runs the filter chain.",
            "CORS, CSRF, and cookie flags are part of this lesson even if they feel like frontend. An API that is 'open for the SPA' without a allowlist is open for everyone.",
          ],
          codeSnippets: [
            {
              label: "Authorize the use case",
              language: "java",
              code: "@PreAuthorize(\"hasRole('ADMIN')\")\npublic CourseRecord replaceAll(UpdateCourseListInput input) {\n  return courses.replaceAll(input);\n}",
            },
          ],
          resources: [{ label: "Spring Security", url: "https://docs.spring.io/spring-security/reference/index.html" }],
        }),
        lesson("Lock one privileged action", "Prove a customer cannot call an admin write.", {
          kind: "assignment",
          assignment: {
            brief: [
              "Pick one mutating admin endpoint in your service. Write a test that the same request succeeds as ADMIN and is denied as CUSTOMER.",
              "Do not mock the SecurityContext past the filter chain. Hit the HTTP layer the way production does.",
            ],
            requirements: [
              "One allow test and one deny test",
              "The denied case returns 403, not 500",
              "The check lives on the use case, not only the URL matcher",
            ],
            submission: "link",
            dueNote: "After the Security module. Keep the work in your repo until enrollment can accept a link.",
          },
        }),
      ]),
      module("Deployment", "The same image from laptop to host.", [
        lesson("Docker image", "A Dockerfile you are willing to run in CI.", {
          body: [
            "Build a JVM image with a small runtime stage. Copy the jar, not the whole Gradle cache. Run as a non-root user. Pin the base image digest when the team is ready; at minimum pin a major tag you track.",
            "The image should start with JAVA_OPTS and a single process. Do not bake .env into layers. Secrets come from the environment or a secret store, never from a file that landed in git.",
            "Tag with a git sha in CI. latest is a pointer, not a release. The deployment module of this site uses that habit for a reason.",
          ],
          codeSnippets: [
            {
              label: "Runtime stage",
              language: "docker",
              code: "FROM eclipse-temurin:21-jre-alpine\nWORKDIR /app\nCOPY --from=build /app/build/libs/app.jar app.jar\nUSER 10001\nENTRYPOINT [\"java\",\"-jar\",\"app.jar\"]",
            },
          ],
          resources: [{ label: "Production Docker course", url: "/courses/production-docker" }],
        }),
        lesson("Health checks", "Ready versus live, and what Compose should wait on.", {
          body: [
            "liveness means the process should be restarted. readiness means it should not receive traffic yet — database down, migrations running, cache cold. Mixing them is how you kill pods that were only waiting on Postgres.",
            "Spring Actuator /health is a start. Split groups so Kubernetes or Compose does not flap. Do not make /health query five downstreams unless you accept coupled outages.",
            "Log the check that failed. A 503 with no body is how you spend an hour on the wrong container.",
          ],
          codeSnippets: [
            {
              label: "Actuator health",
              language: "yaml",
              code: "management:\n  endpoints:\n    web:\n      exposure:\n        include: health,info\n  endpoint:\n    health:\n      probes:\n        enabled: true",
            },
          ],
          resources: [{ label: "Spring Boot actuator", url: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html" }],
        }),
        lesson("12-factor config", "One image, many environments.", {
          body: [
            "The artifact you tested is the artifact you promote. Config is env: DATABASE_URL, JWT secret, public origin. If you need a different jar for staging, you do not have a promotion path — you have two products.",
            "Keep local Compose close to production: same image name, different ports and volumes. This portfolio maps Postgres to 5433 on the host so it does not fight a laptop Postgres on 5432. That is 12-factor in a small file.",
            "Document the required variables in one place. A missing key should crash on boot, not at the first login.",
          ],
          codeSnippets: [
            {
              label: "Required env",
              language: "text",
              code: "DATABASE_URL=postgresql://user:pass@postgres:5432/catalog\nJWT_SECRET=\nAPP_PUBLIC_ORIGIN=https://rezaulkarim.dev",
            },
          ],
          resources: [{ label: "The twelve-factor app", url: "https://12factor.net/config" }],
        }),
        lesson("Operations checklist", "The PDF you actually print before a first deploy.", {
          kind: "pdf",
          pdfs: [
            {
              label: "Spring Boot reference (PDF)",
              url: "https://docs.spring.io/spring-boot/docs/3.4.5/reference/pdf/spring-boot-reference.pdf",
              fileName: "spring-boot-reference.pdf",
            },
          ],
          body: [
            "Use the reference as a map, not a novel. The pages that matter for this module are externalized config, actuator health, and packaging.",
          ],
        }),
      ]),
    ],
    status: "published",
    publishedAt: "2026-04-12",
    seoTitle: "Production-grade Spring Boot",
    seoDescription: "APIs, security, persistence, and deployment for Spring Boot services that leave a laptop.",
    canonicalUrl: "",
  },
  {
    id: "b2e2d9f1-0000-4000-8000-000000000081",
    title: "Production Docker",
    slug: "production-docker",
    subtitle: "From laptop Compose files to images you can promote.",
    description: "Learn the Docker habits that keep APIs, databases, and workers reproducible.",
    overview: [
      "Containers are not a tiny virtual machine. They are a packaged process with a declared network and disk contract. This course is the longer path after the Docker tutorial: images you will ship, volumes you will not delete by accident, and Compose files that wait on health instead of sleep 10.",
      "You will leave able to explain why .dockerignore exists, why published ports are not the same as container ports, and why depends_on without a healthcheck is a race.",
    ],
    thumbnailUrl: null,
    promoVideoUrl: null,
    instructor: "Rezaul Karim",
    category: "DevOps",
    skill: "Docker",
    difficulty: "Beginner",
    language: "English",
    duration: "8 hours",
    requirements: ["A laptop you can install Docker Desktop on", "Comfort with a terminal"],
    outcomes: [
      "Write Dockerfiles you are willing to ship",
      "Run Postgres and the API with Compose",
      "Understand networks, volumes, and healthchecks",
    ],
    audience: ["Developers packaging APIs", "Anyone tired of it-works-on-my-machine"],
    price: "$79",
    salePrice: "",
    currency: "USD",
    free: false,
    featured: true,
    certificateAvailable: false,
    relatedSkillSlugs: ["docker"],
    relatedTutorialSlugs: ["docker-complete"],
    relatedCourseSlugs: ["spring-boot-masterclass"],
    modules: [
      module("Foundations", "Images, containers, and what must never enter the build context.", [
        lesson("Images", "Layers, tags, and a context that stays small.", {
          body: [
            "An image is a stack of layers. Put the rarely changing steps first so source edits reuse the cache. The build context is the directory you pass to docker build — a fat context makes every build slow and can leak .env.",
            "Tag what you intend to run: name:gitsha in CI, name:local on a laptop. latest is a moving pointer. Distroless or slim runtimes are a choice; copying a whole SDK into production is not.",
          ],
          codeSnippets: [
            {
              label: "Ignore the context you do not want",
              language: "text",
              code: "node_modules\ndist\n.git\n.env\n*.log",
            },
          ],
          resources: [{ label: "Dockerfile reference", url: "https://docs.docker.com/reference/dockerfile/" }],
        }),
        lesson("Containers", "Run, logs, exec, and a process that exits.", {
          body: [
            "A container is a running image plus config: env, ports, mounts. Prefer docker run --rm for one-shots. Named containers for things you will logs and exec into.",
            "Read logs before you exec. Most 'it is broken' is a missing env or a port already taken. Stop and remove deliberately; dangling containers hold volumes and ports you forgot.",
          ],
          codeSnippets: [
            {
              label: "See what is running",
              language: "bash",
              code: "docker ps -a\ndocker logs --tail 80 api\ndocker exec -it api sh",
            },
          ],
        }),
        lesson("Ignore files", ".dockerignore is part of the Dockerfile.", {
          body: [
            "Without .dockerignore you send node_modules, .git, and secrets to the daemon. That is slow and sometimes a leak. Treat ignore files as production config, not a nicety.",
            "Keep the pattern list next to the Dockerfile. If you have two build contexts, you need two ignore files or you will debug the wrong cache miss.",
          ],
        }),
      ]),
      module("Data and networks", "Disk that survives, and names that resolve.", [
        lesson("Volumes", "Postgres data that outlives the container.", {
          body: [
            "A bind mount is a host path. A named volume is Docker-managed. Databases belong on a named volume so compose down does not wipe the catalog you were testing.",
            "Know the difference between deleting a container and docker volume prune. The second is how staging 'resets' and nobody knows why enrollments vanished.",
          ],
          codeSnippets: [
            {
              label: "Named volume",
              language: "yaml",
              code: "services:\n  postgres:\n    volumes:\n      - catalog_data:/var/lib/postgresql/data\nvolumes:\n  catalog_data:",
            },
          ],
        }),
        lesson("Bridge networks", "Service names instead of localhost folklore.", {
          body: [
            "On a user-defined bridge, Compose DNS makes postgres resolve from the API container. localhost inside the API is the API, not your laptop. That single fact fixes half of first-week Compose bugs.",
            "Do not share the default bridge between unrelated stacks. Give the project a network name you can see in docker network ls.",
          ],
          codeSnippets: [
            {
              label: "API talks to Postgres by name",
              language: "text",
              code: "DATABASE_URL=postgresql://catalog:catalog@postgres:5432/catalog",
            },
          ],
          resources: [{ label: "Docker networking tutorial", url: "/blog/docker-networking" }],
        }),
        lesson("Published ports", "Host 5433, container 5432, and why both exist.", {
          body: [
            "ports: '5433:5432' maps a host port to the container port. Tools on the laptop use 5433 so they do not fight a local Postgres on 5432. Other containers still use 5432 on the network.",
            "Publishing 5432 to 0.0.0.0 on a laptop is convenient and on a public host is an incident. Bind to 127.0.0.1 when the database should not leave the machine.",
          ],
          codeSnippets: [
            {
              label: "Host mapping for this portfolio",
              language: "yaml",
              code: "ports:\n  - \"127.0.0.1:5433:5432\"",
            },
          ],
        }),
      ]),
      module("Compose in anger", "Health, startup order, and files you can promote.", [
        lesson("Healthchecks", "Wait for ready, not for a sleep.", {
          body: [
            "depends_on: postgres does not wait until Postgres accepts connections. A healthcheck and condition: service_healthy does. sleep 10 is how CI is flaky on a slow runner.",
            "The check should be the same question production asks: can I connect, not is the process pid 1 still there.",
          ],
          codeSnippets: [
            {
              label: "Postgres ready",
              language: "yaml",
              code: "healthcheck:\n  test: [\"CMD-SHELL\", \"pg_isready -U catalog\"]\n  interval: 5s\n  timeout: 3s\n  retries: 20",
            },
          ],
        }),
        lesson("Health versus startup order", "A short check before you copy another sleep 10.", {
          kind: "quiz",
          quiz: {
            passingScore: 70,
            questions: [
              {
                prompt: "depends_on: postgres without a healthcheck waits until:",
                choices: [
                  "Postgres accepts connections",
                  "The container process has started",
                  "pg_isready returns 0",
                  "The volume is created",
                ],
                answerIndex: 1,
                explanation: "Without condition: service_healthy, Compose only waits for the container to exist, not for the database to be ready.",
              },
              {
                prompt: "A liveness probe should restart the process when:",
                choices: [
                  "The database is still booting",
                  "The process is deadlocked or wedged",
                  "A client sent a bad payload",
                  "You changed an env var",
                ],
                answerIndex: 1,
                explanation: "Readiness keeps traffic off a starting app. Liveness restarts a process that will not recover.",
              },
            ],
          },
        }),
        lesson("Depends on", "Order without a mesh of hope.", {
          body: [
            "API depends on Postgres being healthy. Worker depends on API if it must. Cycles mean you modelled the system wrong. Prefer the app to retry on boot rather than a ten-step depends_on graph.",
            "Restart policies are part of this: unless-stopped for things you meant to keep, no for one-shot migrations.",
          ],
          codeSnippets: [
            {
              label: "Wait on healthy Postgres",
              language: "yaml",
              code: "depends_on:\n  postgres:\n    condition: service_healthy",
            },
          ],
        }),
        lesson("Dev versus prod files", "Override, do not fork.", {
          body: [
            "compose.yml is the contract. compose.override.yml or a --file prod file adds bind mounts for source, or drops them for production. Copy-pasting two 200-line files is how ports drift.",
            "The image name stays the same. Dev mounts source. Prod runs the tagged image. That is the whole lesson.",
          ],
          resources: [{ label: "Compose file reference", url: "https://docs.docker.com/reference/compose-file/" }],
        }),
      ]),
    ],
    status: "published",
    publishedAt: "2026-05-20",
    seoTitle: "Production Docker",
    seoDescription: "Images, volumes, networks, and Compose files you can promote from a laptop to a host.",
    canonicalUrl: "",
  },
];
