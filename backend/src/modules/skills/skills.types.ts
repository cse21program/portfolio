export type TopicRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  body: string;
  images: string[];
  videoUrl: string | null;
  embedVideoUrl: string | null;
  codeSnippets: import("../topics/topics.types").TopicSnippet[];
  resources: import("../topics/topics.types").TopicLink[];
  externalLinks: import("../topics/topics.types").TopicLink[];
  relatedBlogSlugs: string[];
  relatedTutorialSlugs: string[];
  relatedCourseSlugs: string[];
  relatedProjectSlugs: string[];
  relatedCertificateSlugs: string[];
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
};

export type SkillRecord = {
  id: string;
  name: string;
  slug: string;
  field: string;
  fieldSlug: string;
  level: string;
  years: string;
  summary: string;
  overview: string;
  iconUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  embedVideoUrl: string | null;
  fieldVideoUrl: string | null;
  fieldEmbedVideoUrl: string | null;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  topics: TopicRecord[];
};

export type TopicWrite = Omit<
  TopicRecord,
  | "id"
  | "sortOrder"
  | "body"
  | "codeSnippets"
  | "resources"
  | "externalLinks"
  | "relatedProjectSlugs"
  | "relatedCertificateSlugs"
  | "published"
> & {
  id?: string;
  sortOrder?: number;
  body?: string;
  codeSnippets?: TopicRecord["codeSnippets"];
  resources?: TopicRecord["resources"];
  externalLinks?: TopicRecord["externalLinks"];
  relatedProjectSlugs?: string[];
  relatedCertificateSlugs?: string[];
  published?: boolean;
};

export type SkillWrite = Omit<SkillRecord, "id" | "sortOrder" | "topics" | "fieldSlug"> & {
  id?: string;
  sortOrder?: number;
  topics: TopicWrite[];
};

export const defaultSkills: SkillWrite[] = [
  {
    name: "Java",
    slug: "java",
    field: "Backend Development",
    level: "Advanced",
    years: "Core language",
    summary: "Object-oriented backend services with a strong type system.",
    overview:
      "Java is the foundation of my Spring Boot work: domain models, collections, concurrency basics, and API boundaries that stay stable as systems grow.",
    iconUrl: null,
    imageUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    fieldVideoUrl: null,
    fieldEmbedVideoUrl: null,
    featured: true,
    published: true,
    seoTitle: "",
    seoDescription: "",
    topics: [
      {
        slug: "oop",
        title: "OOP",
        summary: "Encapsulation, composition, and domain modeling.",
        overview:
          "I use object-oriented design to keep business rules close to the model and out of controllers. Composition is preferred over deep inheritance.",
        body: "Keep invariants on the entity.\n\nControllers should translate HTTP, not own business rules.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        codeSnippets: [{ label: "Record", language: "java", code: "record UserId(String value) {}" }],
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
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
        seoTitle: "",
        seoDescription: "",
      },
    ],
  },
  {
    name: "Spring Boot",
    slug: "spring-boot",
    field: "Backend Development",
    level: "Advanced",
    years: "Primary backend stack",
    summary: "REST APIs, security, persistence, and modular services.",
    overview:
      "Spring Boot is how I ship Java APIs: REST, Spring Security, JPA, validation, and a module layout that can grow without becoming a tangle.",
    iconUrl: null,
    imageUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    fieldVideoUrl: null,
    fieldEmbedVideoUrl: null,
    featured: true,
    published: true,
    seoTitle: "",
    seoDescription: "",
    topics: [
      {
        slug: "rest-api",
        title: "REST API",
        summary: "Resource design, status codes, and consistent payloads.",
        overview:
          "APIs should be boring to consume. I standardize success and error envelopes, pagination, and validation messages.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: ["jwt-authentication"],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
        seoTitle: "",
        seoDescription: "",
      },
      {
        slug: "spring-security",
        title: "Spring Security",
        summary: "Authentication, authorization, and token handling.",
        overview:
          "Security belongs on the server. Role checks, password hashing, and token rotation are never left to the frontend.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: ["jwt-authentication"],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
        seoTitle: "",
        seoDescription: "",
      },
      {
        slug: "jpa",
        title: "JPA",
        summary: "Relational mapping without leaking persistence into the domain.",
        overview:
          "Entities stay close to the database. Application services own transactions and keep queries from leaking into controllers.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["spring-boot-masterclass"],
        seoTitle: "",
        seoDescription: "",
      },
    ],
  },
  {
    name: "Node.js",
    slug: "nodejs",
    field: "Backend Development",
    level: "Advanced",
    years: "APIs and tooling",
    summary: "Express services, TypeScript backends, and scripting.",
    overview:
      "Node.js is my fast path for TypeScript APIs, CLIs, and the Express backend of this platform.",
    iconUrl: null,
    imageUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    fieldVideoUrl: null,
    fieldEmbedVideoUrl: null,
    featured: true,
    published: true,
    seoTitle: "",
    seoDescription: "",
    topics: [
      {
        slug: "express",
        title: "Express",
        summary: "Modular routers, middleware, and typed handlers.",
        overview:
          "Each domain gets its own module: routes, controller, service, repository. Cross-cutting concerns live in common middleware.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: [],
        relatedTutorialSlugs: ["docker-complete"],
        relatedCourseSlugs: [],
        seoTitle: "",
        seoDescription: "",
      },
      {
        slug: "authentication",
        title: "Authentication",
        summary: "Sessions, JWT, and role-based access.",
        overview:
          "Register, login, refresh, and email verification follow the same rules whether the stack is Express or Spring.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: ["jwt-authentication"],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        seoTitle: "",
        seoDescription: "",
      },
    ],
  },
  {
    name: "Docker",
    slug: "docker",
    field: "DevOps",
    level: "Advanced",
    years: "Local and production",
    summary: "Images, compose files, and repeatable environments.",
    overview:
      "If it does not run in a container locally, it will surprise you in production. Docker is the default packaging for APIs and datastores.",
    iconUrl: null,
    imageUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    fieldVideoUrl: null,
    fieldEmbedVideoUrl: null,
    featured: true,
    published: true,
    seoTitle: "",
    seoDescription: "",
    topics: [
      {
        slug: "images",
        title: "Images",
        summary: "Lean Dockerfiles and reproducible builds.",
        overview:
          "Multi-stage builds, pinned base images, and no secrets in layers. The image should be the artifact you promote.",
        body: "Pin the base image and keep the runtime layer small.\n\nBuild in one stage, copy the artifact into a second.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        codeSnippets: [
          { label: "Runtime stage", language: "docker", code: "FROM eclipse-temurin:21-jre\nCOPY app.jar /app.jar" },
        ],
        resources: [{ label: "Docker build docs", url: "https://docs.docker.com/build/" }],
        relatedBlogSlugs: ["docker-networking"],
        relatedTutorialSlugs: ["docker-complete"],
        relatedCourseSlugs: ["production-docker"],
        relatedCertificateSlugs: ["docker-essentials"],
        seoTitle: "",
        seoDescription: "",
      },
      {
        slug: "compose",
        title: "Compose",
        summary: "Postgres, Redis, and app services on one command.",
        overview:
          "docker compose is how this project runs PostgreSQL on port 5433 without fighting a local database on 5432.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: [],
        relatedTutorialSlugs: ["docker-complete"],
        relatedCourseSlugs: ["production-docker"],
        seoTitle: "",
        seoDescription: "",
      },
    ],
  },
  {
    name: "Kubernetes",
    slug: "kubernetes",
    field: "DevOps",
    level: "Intermediate",
    years: "Workloads and networking",
    summary: "Deployments, services, and rollout discipline.",
    overview:
      "Kubernetes is for when process supervision, rolling updates, and service discovery need a shared control plane.",
    iconUrl: null,
    imageUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    fieldVideoUrl: null,
    fieldEmbedVideoUrl: null,
    featured: true,
    published: true,
    seoTitle: "",
    seoDescription: "",
    topics: [
      {
        slug: "deployments",
        title: "Deployments",
        summary: "Replicas, rollouts, and health probes.",
        overview:
          "A Deployment is not done until probes, resource requests, and a rollback story exist.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: ["production-docker"],
        seoTitle: "",
        seoDescription: "",
      },
    ],
  },
  {
    name: "AWS",
    slug: "aws",
    field: "Cloud Engineering",
    level: "Intermediate",
    years: "Core services",
    summary: "IAM, compute, networking, and object storage.",
    overview:
      "AWS is the default cloud for production: identity first, then network, then compute and data.",
    iconUrl: null,
    imageUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    fieldVideoUrl: null,
    fieldEmbedVideoUrl: null,
    featured: true,
    published: true,
    seoTitle: "",
    seoDescription: "",
    topics: [
      {
        slug: "iam",
        title: "IAM",
        summary: "Least privilege for people and workloads.",
        overview:
          "Every outage postmortem that starts with a wildcard policy is preventable. Roles are scoped to a job.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        seoTitle: "",
        seoDescription: "",
      },
      {
        slug: "vpc",
        title: "VPC",
        summary: "Subnets, routing, and private connectivity.",
        overview:
          "Public by default is a mistake. APIs and databases live in private subnets with explicit ingress.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        seoTitle: "",
        seoDescription: "",
      },
      {
        slug: "s3",
        title: "S3",
        summary: "Object storage for media, certificates, and course files.",
        overview:
          "This platform will store images, PDFs, and lesson resources in S3-compatible object storage.",
        images: [],
        videoUrl: null,
        embedVideoUrl: null,
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        seoTitle: "",
        seoDescription: "",
      },
    ],
  },
];

export function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function relatedSkills(skill: SkillRecord, all: SkillRecord[], limit = 3) {
  const sameField = all.filter((item) => item.slug !== skill.slug && item.field === skill.field);
  const others = all.filter((item) => item.slug !== skill.slug && item.field !== skill.field);
  return [...sameField, ...others].slice(0, limit);
}
