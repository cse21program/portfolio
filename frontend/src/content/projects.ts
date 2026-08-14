import type { Project } from "@/types/public";

export const projects: Project[] = [
  {
    slug: "portfolio-platform",
    title: "Portfolio Platform",
    category: "Full-stack product",
    status: "In progress",
    featured: true,
    shortDescription:
      "A personal brand platform that combines portfolio, tutorials, courses, services, and payments.",
    problem:
      "A static resume site cannot sell courses, take service orders, or grow into a knowledge base without a rewrite.",
    solution:
      "Start with a modular Express API and a React public site. Ship a static public experience first, then replace content with the CMS and checkout.",
    architecture:
      "React + Vite frontend, Express + TypeScript modular monolith, PostgreSQL, Prisma, Docker Compose. Feature modules own their routes and domain logic.",
    features: [
      "Public portfolio and knowledge tree",
      "Blog, tutorials, and courses",
      "Service catalog and contact leads",
      "Customer and admin dashboards (next)",
      "Payment adapter layer (planned)",
    ],
    technologies: ["React", "TypeScript", "Express", "PostgreSQL", "Prisma", "Docker"],
    challenges: [
      "Keeping frontend and backend independent without a monorepo.",
      "Designing modules so payments and LMS can land without reshaping the core.",
    ],
    lessons: [
      "Public pages can be static while the domain model is already production-shaped.",
      "Port conflicts with local Postgres are cheaper to avoid than to debug repeatedly.",
    ],
    githubUrl: "https://github.com/swe-rezaul-karim/portfolio",
    startDate: "2026-08",
    endDate: "Present",
  },
  {
    slug: "cubicle-app",
    title: "Cubicle",
    category: "Web application",
    status: "Shipped",
    featured: true,
    shortDescription: "A workspace-oriented web app focused on a clean, usable interface.",
    problem: "Internal tools often ship with unclear navigation and no visual hierarchy.",
    solution:
      "A focused UI with a clear layout system, so the product can be understood in the first minute.",
    architecture: "Frontend-first application with component structure and CSS architecture.",
    features: ["Workspace layout", "Responsive interface", "Reusable visual system"],
    technologies: ["HTML", "CSS", "JavaScript"],
    challenges: ["Keeping the interface calm while still feeling complete."],
    lessons: ["Visual consistency is part of engineering, not decoration."],
    githubUrl: "https://github.com/swe-rezaul-karim/cubicle-app",
    startDate: "2025",
    endDate: "2025",
  },
  {
    slug: "talk-now",
    title: "Talk Now",
    category: "Realtime product",
    status: "Shipped",
    featured: true,
    shortDescription: "A TypeScript conversation product exploring realtime messaging flows.",
    problem: "Messaging UIs fail when state, delivery, and identity are treated as afterthoughts.",
    solution:
      "Model conversations as first-class entities and keep the client typed from the start.",
    architecture: "TypeScript client with a conversation-centric information architecture.",
    features: ["Conversation threads", "Typed client models", "Presence-oriented UI"],
    technologies: ["TypeScript", "React"],
    challenges: ["Realtime UX without overbuilding infrastructure on day one."],
    lessons: ["Type the domain before you type the components."],
    githubUrl: "https://github.com/swe-rezaul-karim/talk-now",
    startDate: "2025",
    endDate: "2025",
  },
  {
    slug: "postapp",
    title: "Post App",
    category: "Content product",
    status: "Shipped",
    featured: false,
    shortDescription: "A posting application for creating and browsing short-form content.",
    problem: "Simple content products still need authorship, listing, and a readable detail view.",
    solution: "A small JavaScript app that treats a post as a document with a public URL.",
    architecture: "Client-side JavaScript with a list/detail information structure.",
    features: ["Create posts", "Browse feed", "Open a post"],
    technologies: ["JavaScript"],
    challenges: ["Keeping the data model tiny without painting into a corner."],
    lessons: ["List and detail pages should share one document shape."],
    githubUrl: "https://github.com/swe-rezaul-karim/postapp",
    startDate: "2024",
    endDate: "2025",
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export const featuredProjects = projects.filter((project) => project.featured);
