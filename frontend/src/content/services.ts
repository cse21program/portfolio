import type { Service } from "@/types/public";

export const services: Service[] = [
  {
    slug: "backend-development",
    title: "Backend API development",
    shortDescription: "Production APIs in Spring Boot or Node.js.",
    description:
      "From domain model to deployed API: resources, auth, persistence, and a handover another engineer can extend.",
    startingPrice: "$1,200",
    pricingType: "Starting from",
    deliveryTime: "2–6 weeks",
    featured: true,
    features: [
      "Requirements and API shape",
      "Auth and role-based access",
      "PostgreSQL data model",
      "OpenAPI documentation",
      "Dockerized local setup",
    ],
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
  },
  {
    slug: "devops-consulting",
    title: "DevOps & AWS deployment",
    shortDescription: "Containers, CI, and a cloud path that is boring on purpose.",
    description:
      "Dockerize the app, add a pipeline, and land it on AWS with logs, health checks, and a rollback story.",
    startingPrice: "$900",
    pricingType: "Starting from",
    deliveryTime: "1–4 weeks",
    featured: true,
    features: [
      "Dockerfile and Compose",
      "CI on GitHub Actions",
      "AWS networking and compute baseline",
      "Secrets and environment strategy",
    ],
    technologies: ["Docker", "AWS", "GitHub Actions", "Kubernetes"],
    faq: [
      {
        question: "Do I need Kubernetes?",
        answer: "Usually not on day one. We start with the smallest setup that can restart, roll back, and be observed.",
      },
    ],
  },
  {
    slug: "architecture-review",
    title: "Architecture review",
    shortDescription: "A structured look at an existing backend or cloud setup.",
    description:
      "I read the code, the deploy path, and the failure modes, then give you a written review with a short list of changes that matter.",
    startingPrice: "$400",
    pricingType: "Fixed price",
    deliveryTime: "5–10 days",
    featured: false,
    features: [
      "Code and infra review",
      "Risk list ordered by blast radius",
      "Recommended next slice",
    ],
    technologies: ["System design", "Backend", "DevOps"],
    faq: [
      {
        question: "What do you need from me?",
        answer: "Repo access, a deploy overview, and 45 minutes to walk through the product.",
      },
    ],
  },
  {
    slug: "technical-mentoring",
    title: "Technical mentoring",
    shortDescription: "1:1 guidance on backend, DevOps, and career-shaped projects.",
    description:
      "Working sessions for engineers who want a second pair of eyes on architecture, interviews, or a portfolio that looks like real work.",
    startingPrice: "$60 / hour",
    pricingType: "Hourly",
    deliveryTime: "Ongoing",
    featured: true,
    features: ["Pairing", "Code review", "Project scoping", "Interview prep"],
    technologies: ["Java", "Node.js", "Docker", "AWS"],
    faq: [
      {
        question: "Is this a course?",
        answer: "No. Mentoring is live and specific to your codebase or goals. Courses will be self-paced.",
      },
    ],
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export const featuredServices = services.filter((service) => service.featured);
