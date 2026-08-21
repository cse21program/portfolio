import { isLiveContent } from "@common/publishing";

export type BlogRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  featuredImageUrl: string | null;
  author: string;
  category: string;
  tags: string[];
  skill: string;
  topic: string;
  readingTime: string;
  publishedAt: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  sortOrder: number;
  updatedAt?: string;
  likeCount?: number;
};

export type BlogWrite = Omit<BlogRecord, "id" | "sortOrder" | "updatedAt"> & {
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

export function estimateReadingTime(paragraphs: string[]) {
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200) || 1);
  return `${minutes} min`;
}

export function isPublishedBlog(item: Pick<BlogRecord, "status" | "publishedAt">) {
  return isLiveContent(item);
}

export function relatedBlogs(blog: BlogRecord, all: BlogRecord[]) {
  const others = all.filter((item) => isPublishedBlog(item) && item.slug !== blog.slug);
  const close = others.filter(
    (item) =>
      Boolean(blog.category && item.category === blog.category) ||
      Boolean(blog.skill && item.skill === blog.skill) ||
      Boolean(blog.topic && item.topic === blog.topic),
  );
  const rest = others.filter((item) => !close.includes(item));
  return [...close, ...rest].slice(0, 3);
}

export const defaultBlogs: BlogWrite[] = [
  {
    title: "JWT authentication without painting yourself into a corner",
    slug: "jwt-authentication",
    excerpt: "Access tokens, refresh tokens, and why authorization still has to live on the server.",
    content: [
      "JWTs are a transport for claims, not a security architecture. If the API trusts a token because it decoded, you have a client-side permission system with extra steps.",
      "I keep access tokens short-lived, refresh tokens rotated, and every privileged action authorized again on the server from the user record.",
      "The public site you are reading is still static. When auth ships, the same rules will apply to course access and service orders.",
    ],
    featuredImageUrl: null,
    author: "Rezaul Karim",
    category: "Backend",
    tags: ["JWT", "Security", "Spring Boot", "Express"],
    skill: "Spring Boot",
    topic: "Spring Security",
    readingTime: "8 min",
    publishedAt: "2026-07-12",
    status: "published",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
  },
  {
    title: "Docker networking explained for API developers",
    slug: "docker-networking",
    excerpt: "Bridge networks, published ports, and why your Postgres is not where you think it is.",
    content: [
      "Containers do not share localhost with your laptop unless you publish a port. That one sentence prevents a week of 'connection refused'.",
      "This project publishes Postgres on 5433 so a local server on 5432 can keep running. Compose gives the API a hostname; your machine gets a port.",
      "If Prisma says access denied, check which Postgres is actually listening, not which one you meant.",
    ],
    featuredImageUrl: null,
    author: "Rezaul Karim",
    category: "DevOps",
    tags: ["Docker", "Networking", "PostgreSQL"],
    skill: "Docker",
    topic: "Images",
    readingTime: "6 min",
    publishedAt: "2026-06-02",
    status: "published",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
  },
  {
    title: "Start with a modular monolith",
    slug: "modular-monolith",
    excerpt: "Feature folders beat microservices until you have a real scaling or ownership reason.",
    content: [
      "This platform has many domains: portfolio, courses, payments, media. That is not a reason to start with six services.",
      "Each Express module owns routes, controller, service, and repository. The seam is already there if a module later needs its own process.",
      "The expensive mistake is coupling checkout to the blog because both happened to share a folder named utils.",
    ],
    featuredImageUrl: null,
    author: "Rezaul Karim",
    category: "Architecture",
    tags: ["Architecture", "Express", "Domain design"],
    skill: "Node.js",
    topic: "",
    readingTime: "7 min",
    publishedAt: "2025-11-18",
    status: "published",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
  },
];
