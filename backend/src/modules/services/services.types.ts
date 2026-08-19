export const servicePricingTypes = ["Fixed price", "Starting from", "Hourly", "Custom quote"] as const;
export type ServicePricingType = (typeof servicePricingTypes)[number];

export const servicePublishStatuses = ["draft", "published"] as const;
export type ServicePublishStatus = (typeof servicePublishStatuses)[number];

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type ServicePackage = {
  name: string;
  price: string;
  deliveryTime: string;
  features: string[];
};

export type ServiceRecord = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string | null;
  category: string;
  startingPrice: string;
  pricingType: string;
  deliveryTime: string;
  features: string[];
  requirements: string[];
  technologies: string[];
  faq: ServiceFaq[];
  packages: ServicePackage[];
  available: boolean;
  featured: boolean;
  status: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  sortOrder: number;
  updatedAt: string;
};

export type ServiceWrite = Omit<ServiceRecord, "id" | "sortOrder" | "updatedAt"> & {
  id?: string;
  sortOrder?: number;
};

export function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function isPublishedService(item: Pick<ServiceRecord, "status">) {
  return item.status === "published";
}

export function parseServiceFaq(value: unknown): ServiceFaq[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }
      const row = entry as Record<string, unknown>;
      const question = typeof row.question === "string" ? row.question.trim() : "";
      const answer = typeof row.answer === "string" ? row.answer.trim() : "";
      if (!question || !answer) {
        return null;
      }
      return { question, answer };
    })
    .filter((entry): entry is ServiceFaq => entry !== null);
}

export function parseServicePackages(value: unknown): ServicePackage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }
      const row = entry as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      if (!name) {
        return null;
      }
      const features = Array.isArray(row.features)
        ? row.features.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : [];
      return {
        name,
        price: typeof row.price === "string" ? row.price.trim() : "",
        deliveryTime: typeof row.deliveryTime === "string" ? row.deliveryTime.trim() : "",
        features,
      };
    })
    .filter((entry): entry is ServicePackage => entry !== null);
}

export function relatedServices(current: ServiceRecord, all: ServiceRecord[]) {
  const sameCategory = all.filter(
    (item) => item.slug !== current.slug && item.category && item.category === current.category,
  );
  if (sameCategory.length > 0) {
    return sameCategory.slice(0, 3);
  }
  return all.filter((item) => item.slug !== current.slug && item.featured).slice(0, 3);
}

export const defaultServices: ServiceWrite[] = [
  {
    title: "Backend API development",
    slug: "backend-development",
    shortDescription: "Production APIs in Spring Boot or Node.js.",
    description:
      "From domain model to deployed API: resources, auth, persistence, and a handover another engineer can extend.",
    thumbnailUrl: null,
    category: "Backend",
    startingPrice: "$1,200",
    pricingType: "Starting from",
    deliveryTime: "2–6 weeks",
    features: [
      "Requirements and API shape",
      "Auth and role-based access",
      "PostgreSQL data model",
      "OpenAPI documentation",
      "Dockerized local setup",
    ],
    requirements: ["A written product brief or a working prototype", "Access to the repo or a greenfield start"],
    technologies: ["Spring Boot", "Node.js", "PostgreSQL"],
    faq: [
      {
        question: "Which stack?",
        answer: "Spring Boot or Express + TypeScript. We pick based on the team that will maintain it.",
      },
      {
        question: "Do you include frontend?",
        answer: "Frontend can be scoped separately. This service is the API and data layer.",
      },
    ],
    packages: [
      {
        name: "API slice",
        price: "$1,200",
        deliveryTime: "2 weeks",
        features: ["One bounded context", "Auth and persistence", "OpenAPI and Docker Compose"],
      },
      {
        name: "Production API",
        price: "$2,800",
        deliveryTime: "4–6 weeks",
        features: ["Full resource model", "Roles and audit trail", "CI, health checks, and handover notes"],
      },
    ],
    available: true,
    featured: true,
    status: "published",
    publishedAt: "2026-08-01",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
  },
  {
    title: "DevOps & AWS deployment",
    slug: "devops-consulting",
    shortDescription: "Containers, CI, and a cloud path that is boring on purpose.",
    description:
      "Dockerize the app, add a pipeline, and land it on AWS with logs, health checks, and a rollback story.",
    thumbnailUrl: null,
    category: "DevOps",
    startingPrice: "$900",
    pricingType: "Starting from",
    deliveryTime: "1–4 weeks",
    features: [
      "Dockerfile and Compose",
      "CI on GitHub Actions",
      "AWS networking and compute baseline",
      "Secrets and environment strategy",
    ],
    requirements: ["Current deploy notes, even if they are messy", "AWS account access or a sandbox"],
    technologies: ["Docker", "AWS", "GitHub Actions", "Kubernetes"],
    faq: [
      {
        question: "Do I need Kubernetes?",
        answer: "Usually not on day one. We start with the smallest setup that can restart, roll back, and be observed.",
      },
    ],
    packages: [
      {
        name: "Basic",
        price: "$400",
        deliveryTime: "1 week",
        features: ["Dockerfile and Compose", "Local health check", "A README another engineer can follow"],
      },
      {
        name: "Standard",
        price: "$900",
        deliveryTime: "2–3 weeks",
        features: ["GitHub Actions CI", "AWS compute and networking baseline", "Secrets and rollback notes"],
      },
      {
        name: "Premium",
        price: "$1,800",
        deliveryTime: "4 weeks",
        features: ["Production path with logs", "Optional Kubernetes only if it is justified", "Runbook and handover"],
      },
    ],
    available: true,
    featured: true,
    status: "published",
    publishedAt: "2026-08-01",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
  },
  {
    title: "Architecture review",
    slug: "architecture-review",
    shortDescription: "A structured look at an existing backend or cloud setup.",
    description:
      "I read the code, the deploy path, and the failure modes, then give you a written review with a short list of changes that matter.",
    thumbnailUrl: null,
    category: "Review",
    startingPrice: "$400",
    pricingType: "Fixed price",
    deliveryTime: "5–10 days",
    features: ["Code and infra review", "Risk list ordered by blast radius", "Recommended next slice"],
    requirements: ["Repo access", "A deploy overview", "45 minutes to walk through the product"],
    technologies: ["System design", "Backend", "DevOps"],
    faq: [
      {
        question: "What do you need from me?",
        answer: "Repo access, a deploy overview, and 45 minutes to walk through the product.",
      },
    ],
    packages: [],
    available: true,
    featured: false,
    status: "published",
    publishedAt: "2026-08-01",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
  },
  {
    title: "Technical mentoring",
    slug: "technical-mentoring",
    shortDescription: "1:1 guidance on backend, DevOps, and career-shaped projects.",
    description:
      "Working sessions for engineers who want a second pair of eyes on architecture, interviews, or a portfolio that looks like real work.",
    thumbnailUrl: null,
    category: "Mentoring",
    startingPrice: "$60 / hour",
    pricingType: "Hourly",
    deliveryTime: "Ongoing",
    features: ["Pairing", "Code review", "Project scoping", "Interview prep"],
    requirements: ["A goal for the next four sessions", "Code or interview materials to review"],
    technologies: ["Java", "Node.js", "Docker", "AWS"],
    faq: [
      {
        question: "Is this a course?",
        answer: "No. Mentoring is live and specific to your codebase or goals. Courses are self-paced.",
      },
    ],
    packages: [],
    available: true,
    featured: true,
    status: "published",
    publishedAt: "2026-08-01",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
  },
];
