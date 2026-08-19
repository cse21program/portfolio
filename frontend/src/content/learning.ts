import type { Course } from "@/types/public";

export { getTutorial, tutorials } from "@/content/tutorials";

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

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}
