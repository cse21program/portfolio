export type ProjectRecord = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  thumbnailUrl: string | null;
  images: string[];
  demoVideoUrl: string | null;
  category: string;
  technologies: string[];
  features: string[];
  architecture: string;
  problem: string;
  requirements: string;
  solution: string;
  challenges: string[];
  solutions: string[];
  lessons: string[];
  status: string;
  startDate: string;
  endDate: string;
  githubUrl: string | null;
  liveUrl: string | null;
  docsUrl: string | null;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
};

export type ProjectWrite = Omit<ProjectRecord, "id" | "sortOrder"> & {
  id?: string;
  sortOrder?: number;
};

export const defaultProjects: ProjectWrite[] = [
  {
    title: "Portfolio Platform",
    slug: "portfolio-platform",
    shortDescription:
      "A personal brand platform that combines portfolio, tutorials, courses, services, and payments.",
    fullDescription:
      "Start with a modular Express API and a React public site. Ship a static public experience first, then replace content with the CMS and checkout.",
    thumbnailUrl: null,
    images: [],
    demoVideoUrl: null,
    category: "Full-stack product",
    technologies: ["React", "TypeScript", "Express", "PostgreSQL", "Prisma", "Docker"],
    features: [
      "Public portfolio and knowledge tree",
      "Blog, tutorials, and courses",
      "Service catalog and contact leads",
      "Customer and admin dashboards (next)",
      "Payment adapter layer (planned)",
    ],
    architecture:
      "React + Vite frontend, Express + TypeScript modular monolith, PostgreSQL, Prisma, Docker Compose. Feature modules own their routes and domain logic.",
    problem:
      "A static resume site cannot sell courses, take service orders, or grow into a knowledge base without a rewrite.",
    requirements: "Independent frontend and backend, a public site first, and room for LMS and payments.",
    solution:
      "Start with a modular Express API and a React public site. Ship a static public experience first, then replace content with the CMS and checkout.",
    challenges: [
      "Keeping frontend and backend independent without a monorepo.",
      "Designing modules so payments and LMS can land without reshaping the core.",
    ],
    solutions: [
      "Separate apps with a shared API contract.",
      "Feature modules own routes and domain logic.",
    ],
    lessons: [
      "Public pages can be static while the domain model is already production-shaped.",
      "Port conflicts with local Postgres are cheaper to avoid than to debug repeatedly.",
    ],
    status: "In progress",
    startDate: "2026-08",
    endDate: "Present",
    githubUrl: "https://github.com/swe-rezaul-karim/portfolio",
    liveUrl: "https://rezaulkarim.dev",
    docsUrl: null,
    featured: true,
    seoTitle: "",
    seoDescription: "",
  },
  {
    title: "Cubicle",
    slug: "cubicle-app",
    shortDescription: "A workspace-oriented web app focused on a clean, usable interface.",
    fullDescription: "A focused UI with a clear layout system, so the product can be understood in the first minute.",
    thumbnailUrl: null,
    images: [],
    demoVideoUrl: null,
    category: "Web application",
    technologies: ["HTML", "CSS", "JavaScript"],
    features: ["Workspace layout", "Responsive interface", "Reusable visual system"],
    architecture: "Frontend-first application with component structure and CSS architecture.",
    problem: "Internal tools often ship with unclear navigation and no visual hierarchy.",
    requirements: "A calm workspace UI that still feels complete on a first visit.",
    solution: "A focused UI with a clear layout system, so the product can be understood in the first minute.",
    challenges: ["Keeping the interface calm while still feeling complete."],
    solutions: ["A shared layout system and a small set of visual rules."],
    lessons: ["Visual consistency is part of engineering, not decoration."],
    status: "Shipped",
    startDate: "2025",
    endDate: "2025",
    githubUrl: "https://github.com/swe-rezaul-karim/cubicle-app",
    liveUrl: null,
    docsUrl: null,
    featured: true,
    seoTitle: "",
    seoDescription: "",
  },
  {
    title: "Talk Now",
    slug: "talk-now",
    shortDescription: "A TypeScript conversation product exploring realtime messaging flows.",
    fullDescription: "Model conversations as first-class entities and keep the client typed from the start.",
    thumbnailUrl: null,
    images: [],
    demoVideoUrl: null,
    category: "Realtime product",
    technologies: ["TypeScript", "React"],
    features: ["Conversation threads", "Typed client models", "Presence-oriented UI"],
    architecture: "TypeScript client with a conversation-centric information architecture.",
    problem: "Messaging UIs fail when state, delivery, and identity are treated as afterthoughts.",
    requirements: "Typed conversation models without overbuilding infrastructure on day one.",
    solution: "Model conversations as first-class entities and keep the client typed from the start.",
    challenges: ["Realtime UX without overbuilding infrastructure on day one."],
    solutions: ["Type the domain first, then the components."],
    lessons: ["Type the domain before you type the components."],
    status: "Shipped",
    startDate: "2025",
    endDate: "2025",
    githubUrl: "https://github.com/swe-rezaul-karim/talk-now",
    liveUrl: null,
    docsUrl: null,
    featured: true,
    seoTitle: "",
    seoDescription: "",
  },
  {
    title: "Post App",
    slug: "postapp",
    shortDescription: "A posting application for creating and browsing short-form content.",
    fullDescription: "A small JavaScript app that treats a post as a document with a public URL.",
    thumbnailUrl: null,
    images: [],
    demoVideoUrl: null,
    category: "Content product",
    technologies: ["JavaScript"],
    features: ["Create posts", "Browse feed", "Open a post"],
    architecture: "Client-side JavaScript with a list/detail information structure.",
    problem: "Simple content products still need authorship, listing, and a readable detail view.",
    requirements: "A tiny document model that still supports list and detail pages.",
    solution: "A small JavaScript app that treats a post as a document with a public URL.",
    challenges: ["Keeping the data model tiny without painting into a corner."],
    solutions: ["One document shape for list and detail."],
    lessons: ["List and detail pages should share one document shape."],
    status: "Shipped",
    startDate: "2024",
    endDate: "2025",
    githubUrl: "https://github.com/swe-rezaul-karim/postapp",
    liveUrl: null,
    docsUrl: null,
    featured: false,
    seoTitle: "",
    seoDescription: "",
  },
];

export function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function relatedProjects(project: ProjectRecord, all: ProjectRecord[], limit = 3) {
  const sameCategory = all.filter(
    (item) => item.slug !== project.slug && item.category === project.category,
  );
  const others = all.filter(
    (item) => item.slug !== project.slug && item.category !== project.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}
