import type { Course, Tutorial } from "@/types/public";

export const tutorials: Tutorial[] = [
  {
    slug: "docker-complete",
    title: "Docker complete tutorial",
    description:
      "From images and containers to volumes, networking, Compose, and a deployable API stack.",
    difficulty: "Beginner",
    duration: "4 hours",
    price: "Free",
    free: true,
    skill: "Docker",
    sections: [
      { title: "Introduction", summary: "Why containers, and what problem they actually solve." },
      { title: "Installation", summary: "Docker Desktop and the CLI on macOS." },
      { title: "Images", summary: "Build context, layers, and tagging." },
      { title: "Containers", summary: "Run, logs, exec, and lifecycle." },
      { title: "Volumes", summary: "Keep Postgres data when the container dies." },
      { title: "Networking", summary: "Published ports versus service DNS." },
      { title: "Dockerfile", summary: "Multi-stage builds for Node and Java." },
      { title: "Compose", summary: "API + Postgres with one command." },
      { title: "Deployment", summary: "Promote the same image you tested." },
    ],
  },
  {
    slug: "express-modules",
    title: "Express modules that stay maintainable",
    description:
      "A practical layout for routes, controllers, services, and repositories in TypeScript.",
    difficulty: "Intermediate",
    duration: "2 hours",
    price: "Free",
    free: true,
    skill: "Node.js",
    sections: [
      { title: "Why modules", summary: "Boundaries before frameworks." },
      { title: "Folder layout", summary: "One domain, one folder." },
      { title: "Error envelope", summary: "Stable JSON errors." },
      { title: "Validation", summary: "Zod at the edge." },
    ],
  },
];

export const courses: Course[] = [
  {
    slug: "spring-boot-masterclass",
    title: "Production-grade Spring Boot",
    subtitle: "APIs, security, persistence, and deployment.",
    description:
      "A structured course for building Spring Boot services that can survive real traffic, real auth, and real operations.",
    difficulty: "Intermediate",
    duration: "18 hours",
    price: "$149",
    salePrice: "$99",
    featured: true,
    outcomes: [
      "Design REST resources with consistent errors",
      "Secure endpoints with Spring Security",
      "Model data with JPA without leaking persistence",
      "Package and run the service with Docker",
    ],
    modules: [
      {
        title: "Fundamentals",
        lessons: ["Application structure", "Configuration", "Validation"],
      },
      {
        title: "REST API",
        lessons: ["Resource design", "Pagination", "Exception handling"],
      },
      {
        title: "Security",
        lessons: ["Users and roles", "JWT", "Method security"],
      },
      {
        title: "Deployment",
        lessons: ["Docker image", "Health checks", "12-factor config"],
      },
    ],
  },
  {
    slug: "production-docker",
    title: "Production Docker",
    subtitle: "From laptop Compose files to images you can promote.",
    description:
      "Learn the Docker habits that keep APIs, databases, and workers reproducible.",
    difficulty: "Beginner",
    duration: "8 hours",
    price: "$79",
    featured: true,
    outcomes: [
      "Write Dockerfiles you are willing to ship",
      "Run Postgres and the API with Compose",
      "Understand networks, volumes, and healthchecks",
    ],
    modules: [
      {
        title: "Foundations",
        lessons: ["Images", "Containers", "Ignore files"],
      },
      {
        title: "Data and networks",
        lessons: ["Volumes", "Bridge networks", "Published ports"],
      },
      {
        title: "Compose in anger",
        lessons: ["Healthchecks", "Depends on", "Dev versus prod files"],
      },
    ],
  },
];

export function getTutorial(slug: string) {
  return tutorials.find((tutorial) => tutorial.slug === slug);
}

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}
