import type { Skill } from "@/types/public";

export const skills: Skill[] = [
  {
    slug: "java",
    name: "Java",
    field: "Backend Development",
    level: "Advanced",
    years: "Core language",
    summary: "Object-oriented backend services with a strong type system.",
    overview:
      "Java is the foundation of my Spring Boot work: domain models, collections, concurrency basics, and API boundaries that stay stable as systems grow.",
    featured: true,
    topics: [
      {
        slug: "oop",
        title: "OOP",
        summary: "Encapsulation, composition, and domain modeling.",
        overview:
          "I use object-oriented design to keep business rules close to the model and out of controllers. Composition is preferred over deep inheritance.",
        body: "Keep invariants on the entity.\n\nControllers should translate HTTP, not own business rules.",
        codeSnippets: [
          { label: "Record", language: "java", code: "record UserId(String value) {}" },
        ],
        resources: [
          {
            label: "Oracle OOP concepts",
            url: "https://docs.oracle.com/javase/tutorial/java/concepts/",
          },
        ],
        relatedBlogSlugs: ["jwt-authentication"],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
        relatedProjectSlugs: ["portfolio-platform"],
        relatedCertificateSlugs: ["spring-security"],
        seoTitle: "OOP in Java services",
        seoDescription: "Encapsulation, composition, and domain modeling for APIs.",
      },
      {
        slug: "collections",
        title: "Collections",
        summary: "Lists, maps, and data shaping at the service layer.",
        overview:
          "Most production bugs in Java backends hide in data transformation. I keep collection pipelines explicit and tested.",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
      },
    ],
  },
  {
    slug: "spring-boot",
    name: "Spring Boot",
    field: "Backend Development",
    level: "Advanced",
    years: "Primary backend stack",
    summary: "REST APIs, security, persistence, and modular services.",
    overview:
      "Spring Boot is how I ship Java APIs: REST, Spring Security, JPA, validation, and a module layout that can grow without becoming a tangle.",
    featured: true,
    topics: [
      {
        slug: "rest-api",
        title: "REST API",
        summary: "Resource design, status codes, and consistent payloads.",
        overview:
          "APIs should be boring to consume. I standardize success and error envelopes, pagination, and validation messages.",
        relatedBlogSlugs: ["jwt-authentication"],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
      },
      {
        slug: "spring-security",
        title: "Spring Security",
        summary: "Authentication, authorization, and token handling.",
        overview:
          "Security belongs on the server. Role checks, password hashing, and token rotation are never left to the frontend.",
        relatedBlogSlugs: ["jwt-authentication"],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
      },
      {
        slug: "jpa",
        title: "JPA",
        summary: "Relational mapping without leaking persistence into the domain.",
        overview:
          "Entities stay close to the database. Application services own transactions and keep queries from leaking into controllers.",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
      },
    ],
  },
  {
    slug: "nodejs",
    name: "Node.js",
    field: "Backend Development",
    level: "Advanced",
    years: "APIs and tooling",
    summary: "Express services, TypeScript backends, and scripting.",
    overview:
      "Node.js is my fast path for TypeScript APIs, CLIs, and the Express backend of this platform.",
    featured: true,
    topics: [
      {
        slug: "express",
        title: "Express",
        summary: "Modular routers, middleware, and typed handlers.",
        overview:
          "Each domain gets its own module: routes, controller, service, repository. Cross-cutting concerns live in common middleware.",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: ["docker-complete"],
        relatedCourseSlugs: [],
      },
      {
        slug: "authentication",
        title: "Authentication",
        summary: "Sessions, JWT, and role-based access.",
        overview:
          "Register, login, refresh, and email verification follow the same rules whether the stack is Express or Spring.",
        relatedBlogSlugs: ["jwt-authentication"],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
      },
    ],
  },
  {
    slug: "docker",
    name: "Docker",
    field: "DevOps",
    level: "Advanced",
    years: "Local and production",
    summary: "Images, compose files, and repeatable environments.",
    overview:
      "If it does not run in a container locally, it will surprise you in production. Docker is the default packaging for APIs and datastores.",
    featured: true,
    topics: [
      {
        slug: "images",
        title: "Images",
        summary: "Lean Dockerfiles and reproducible builds.",
        overview:
          "Multi-stage builds, pinned base images, and no secrets in layers. The image should be the artifact you promote.",
        body: "Pin the base image and keep the runtime layer small.\n\nBuild in one stage, copy the artifact into a second.",
        codeSnippets: [
          { label: "Runtime stage", language: "docker", code: "FROM eclipse-temurin:21-jre\nCOPY app.jar /app.jar" },
        ],
        resources: [{ label: "Docker build docs", url: "https://docs.docker.com/build/" }],
        relatedBlogSlugs: ["docker-networking"],
        relatedTutorialSlugs: ["docker-complete"],
        relatedCourseSlugs: ["production-docker"],
        relatedCertificateSlugs: ["docker-essentials"],
      },
      {
        slug: "compose",
        title: "Compose",
        summary: "Postgres, Redis, and app services on one command.",
        overview:
          "docker compose is how this project runs PostgreSQL on port 5433 without fighting a local database on 5432.",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: ["docker-complete"],
        relatedCourseSlugs: ["production-docker"],
      },
    ],
  },
  {
    slug: "kubernetes",
    name: "Kubernetes",
    field: "DevOps",
    level: "Intermediate",
    years: "Workloads and networking",
    summary: "Deployments, services, and rollout discipline.",
    overview:
      "Kubernetes is for when process supervision, rolling updates, and service discovery need a shared control plane.",
    featured: true,
    topics: [
      {
        slug: "deployments",
        title: "Deployments",
        summary: "Replicas, rollouts, and health probes.",
        overview:
          "A Deployment is not done until probes, resource requests, and a rollback story exist.",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["production-docker"],
      },
    ],
  },
  {
    slug: "aws",
    name: "AWS",
    field: "Cloud Engineering",
    level: "Intermediate",
    years: "Core services",
    summary: "IAM, compute, networking, and object storage.",
    overview:
      "AWS is the default cloud for production: identity first, then network, then compute and data.",
    featured: true,
    topics: [
      {
        slug: "iam",
        title: "IAM",
        summary: "Least privilege for people and workloads.",
        overview:
          "Every outage postmortem that starts with a wildcard policy is preventable. Roles are scoped to a job.",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
      },
      {
        slug: "vpc",
        title: "VPC",
        summary: "Subnets, routing, and private connectivity.",
        overview:
          "Public by default is a mistake. APIs and databases live in private subnets with explicit ingress.",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
      },
      {
        slug: "s3",
        title: "S3",
        summary: "Object storage for media, certificates, and course files.",
        overview:
          "This platform will store images, PDFs, and lesson resources in S3-compatible object storage.",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
      },
    ],
  },
];

export const skillFields = [
  "Backend Development",
  "DevOps",
  "Cloud Engineering",
] as const;

export function getSkill(slug: string) {
  return skills.find((skill) => skill.slug === slug);
}

export function getTopic(skillSlug: string, topicSlug: string) {
  const skill = getSkill(skillSlug);
  return skill?.topics.find((topic) => topic.slug === topicSlug);
}
