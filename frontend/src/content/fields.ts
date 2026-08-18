import type { SkillField } from "@/types/public";

export const fields: SkillField[] = [
  {
    slug: "backend-development",
    name: "Backend Development",
    summary: "APIs, domain models, and services that stay stable as systems grow.",
    overview:
      "I treat backend work as product work: clear boundaries, boring operations, and APIs that stay readable after the first launch.",
    featured: true,
    published: true,
  },
  {
    slug: "devops",
    name: "DevOps",
    summary: "Packaging, delivery, and the path from a laptop to production.",
    overview:
      "Containers, compose files, and rollouts so the same artifact I test locally is the one I promote.",
    featured: true,
    published: true,
  },
  {
    slug: "cloud-engineering",
    name: "Cloud Engineering",
    summary: "Identity, networks, compute, and storage on AWS.",
    overview:
      "Cloud work starts with IAM and the network. Compute and data follow once those boundaries are explicit.",
    featured: false,
    published: true,
  },
];
