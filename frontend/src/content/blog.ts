import type { Article } from "@/types/public";

export const articles: Article[] = [
  {
    slug: "jwt-authentication",
    title: "JWT authentication without painting yourself into a corner",
    excerpt:
      "Access tokens, refresh tokens, and why authorization still has to live on the server.",
    category: "Backend",
    tags: ["JWT", "Security", "Spring Boot", "Express"],
    skill: "Spring Boot",
    publishedAt: "2026-07-12",
    readingTime: "8 min",
    content: [
      "JWTs are a transport for claims, not a security architecture. If the API trusts a token because it decoded, you have a client-side permission system with extra steps.",
      "I keep access tokens short-lived, refresh tokens rotated, and every privileged action authorized again on the server from the user record.",
      "The public site you are reading is still static. When auth ships, the same rules will apply to course access and service orders.",
    ],
  },
  {
    slug: "docker-networking",
    title: "Docker networking explained for API developers",
    excerpt:
      "Bridge networks, published ports, and why your Postgres is not where you think it is.",
    category: "DevOps",
    tags: ["Docker", "Networking", "PostgreSQL"],
    skill: "Docker",
    publishedAt: "2026-06-02",
    readingTime: "6 min",
    content: [
      "Containers do not share localhost with your laptop unless you publish a port. That one sentence prevents a week of 'connection refused'.",
      "This project publishes Postgres on 5433 so a local server on 5432 can keep running. Compose gives the API a hostname; your machine gets a port.",
      "If Prisma says access denied, check which Postgres is actually listening, not which one you meant.",
    ],
  },
  {
    slug: "modular-monolith",
    title: "Start with a modular monolith",
    excerpt:
      "Feature folders beat microservices until you have a real scaling or ownership reason.",
    category: "Architecture",
    tags: ["Architecture", "Express", "Domain design"],
    skill: "Node.js",
    publishedAt: "2026-05-18",
    readingTime: "7 min",
    content: [
      "This platform has many domains: portfolio, courses, payments, media. That is not a reason to start with six services.",
      "Each Express module owns routes, controller, service, and repository. The seam is already there if a module later needs its own process.",
      "The expensive mistake is coupling checkout to the blog because both happened to share a folder named utils.",
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
